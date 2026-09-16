import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { db } from "./db";

let io: SocketIOServer | null = null;

export function initSocketServer(httpServer: HTTPServer) {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === "production"
        ? process.env.ALLOWED_ORIGINS?.split(",")
        : "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);

    // Подписка на обновления заказов
    socket.on("subscribe:orders", () => {
      socket.join("orders");
      console.log(`[WebSocket] Client ${socket.id} subscribed to orders`);
    });

    // Подписка на обновления склада
    socket.on("subscribe:stock", () => {
      socket.join("stock");
      console.log(`[WebSocket] Client ${socket.id} subscribed to stock`);
    });

    // Подписка на обновления меню
    socket.on("subscribe:menu", () => {
      socket.join("menu");
      console.log(`[WebSocket] Client ${socket.id} subscribed to menu`);
    });

    // Подписка на все обновления
    socket.on("subscribe:all", () => {
      socket.join("orders");
      socket.join("stock");
      socket.join("menu");
      console.log(`[WebSocket] Client ${socket.id} subscribed to all channels`);
    });

    socket.on("disconnect", () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initSocketServer first.");
  }
  return io;
}

// Утилиты для отправки событий
export const emitOrderUpdate = (order: unknown) => {
  if (io) {
    io.to("orders").emit("order:update", order);
  }
};

export const emitStockUpdate = (item: unknown) => {
  if (io) {
    io.to("stock").emit("stock:update", item);
  }
};

export const emitMenuUpdate = (data: unknown) => {
  if (io) {
    io.to("menu").emit("menu:update", data);
  }
};

// Функция для отправки текущего состояния новым подключениям
export const sendCurrentState = async (socket: unknown) => {
  try {
    const [orders, items, guests, categories] = await Promise.all([
      db.order.findMany({
        where: { status: { notIn: ["DONE", "CANCELLED"] } },
        include: {
          lines: { include: { item: true } },
          guest: true
        },
        orderBy: { createdAt: "desc" }
      }),
      db.item.findMany({
        where: { active: true },
        include: { category: true }
      }),
      db.guest.findMany({ orderBy: { bonuses: "desc" } }),
      db.category.findMany({ where: { active: true }, orderBy: { sort: "asc" } })
    ]);

    return { orders, items, guests, categories };
  } catch (error) {
    console.error("[WebSocket] Error fetching state:", error);
    return null;
  }
};
