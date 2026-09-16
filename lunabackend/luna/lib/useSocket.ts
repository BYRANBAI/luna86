import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!socket) {
      socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000", {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });

      socket.on("connect", () => {
        console.log("[WebSocket] Connected");
        setIsConnected(true);
      });

      socket.on("disconnect", () => {
        console.log("[WebSocket] Disconnected");
        setIsConnected(false);
      });

      socket.on("connect_error", (error) => {
        console.error("[WebSocket] Connection error:", error);
        setIsConnected(false);
      });
    }

    return () => {
      if (socket) {
        socket.off("connect");
        socket.off("disconnect");
        socket.off("connect_error");
      }
    };
  }, []);

  return { socket, isConnected };
}

export function useOrderUpdates(callback: (order: unknown) => void) {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.emit("subscribe:orders");
    socket.on("order:update", callback);

    return () => {
      socket.off("order:update", callback);
    };
  }, [socket, isConnected, callback]);

  return isConnected;
}

export function useStockUpdates(callback: (item: unknown) => void) {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.emit("subscribe:stock");
    socket.on("stock:update", callback);

    return () => {
      socket.off("stock:update", callback);
    };
  }, [socket, isConnected, callback]);

  return isConnected;
}

export function useMenuUpdates(callback: (data: unknown) => void) {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.emit("subscribe:menu");
    socket.on("menu:update", callback);

    return () => {
      socket.off("menu:update", callback);
    };
  }, [socket, isConnected, callback]);

  return isConnected;
}

export function useRealtimeData() {
  const { socket, isConnected } = useSocket();
  const [data, setData] = useState<{
    orders: unknown[];
    items: unknown[];
    guests: unknown[];
    categories: unknown[];
  }>({
    orders: [],
    items: [],
    guests: [],
    categories: []
  });

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/state");
      const newData = await response.json();
      setData(newData);
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  }, []);

  // Загрузка данных при монтировании
  useEffect(() => {
    load();
  }, [load]);

  // Подписка на все обновления
  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.emit("subscribe:all");

    const handleOrderUpdate = () => load();
    const handleStockUpdate = () => load();
    const handleMenuUpdate = () => load();

    socket.on("order:update", handleOrderUpdate);
    socket.on("stock:update", handleStockUpdate);
    socket.on("menu:update", handleMenuUpdate);

    return () => {
      socket.off("order:update", handleOrderUpdate);
      socket.off("stock:update", handleStockUpdate);
      socket.off("menu:update", handleMenuUpdate);
    };
  }, [socket, isConnected, load]);

  return { data, isConnected, refresh: load };
}
