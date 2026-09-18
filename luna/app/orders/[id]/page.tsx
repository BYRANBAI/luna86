"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Order {
  id: number;
  number: string;
  status: string;
  total: number;
  createdAt: string;
  readyAt: string;
  tableNumber: string;
  lines: {
    id: number;
    qty: number;
    price: number;
    item: {
      id: number;
      name: string;
      photo: string;
    };
  }[];
}

const statusMap: Record<string, { label: string; color: string; step: number }> = {
  NEW: { label: "Принят", color: "#F58220", step: 1 },
  CONFIRMED: { label: "Подтверждён", color: "#F58220", step: 2 },
  COOKING: { label: "Готовится", color: "#F58220", step: 3 },
  READY: { label: "Готов", color: "#F58220", step: 4 },
  DELIVERING: { label: "В пути", color: "#F58220", step: 5 },
  DELIVERED: { label: "Доставлен", color: "#2c3e50", step: 6 },
  CANCELLED: { label: "Отменён", color: "#a0aec0", step: 0 },
};

export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    params.then(p => setOrderId(p.id));
  }, [params]);

  useEffect(() => {
    if (!orderId) return;
    loadOrder();
    const interval = setInterval(loadOrder, 10000);
    return () => clearInterval(interval);
  }, [orderId]);

  const loadOrder = async () => {
    if (!orderId) return;
    const token = localStorage.getItem("guestToken");
    if (!token) {
      router.push("/auth");
      return;
    }

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      } else {
        router.push("/menu");
      }
    } catch (error) {
      console.error("Ошибка загрузки заказа:", error);
    } finally {
      setLoading(false);
    }
  };

  const cardS: React.CSSProperties = { background: "#fff", borderRadius: 16, padding: 24, marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" };

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", background: "#f5f7fa", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", border: "4px solid #e3e8ef", borderTopColor: "#F58220", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ fontSize: 16, color: "#a0aec0" }}>Загрузка заказа...</p>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main style={{ minHeight: "100vh", background: "#f5f7fa", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 20, color: "#a0aec0", marginBottom: 20 }}>Заказ не найден</p>
          <Link href="/menu" style={{ background: "#F58220", color: "#fff", padding: "12px 28px", borderRadius: 12, textDecoration: "none", fontWeight: 700 }}>
            Вернуться в меню
          </Link>
        </div>
      </main>
    );
  }

  const currentStatus = statusMap[order.status] || statusMap.NEW;
  const isActive = order.status !== "DELIVERED" && order.status !== "CANCELLED";
  const estimatedTime = new Date(order.readyAt);

  const stages = [
    { key: "NEW", label: "Принят", icon: "✓" },
    { key: "CONFIRMED", label: "Подтверждён", icon: "✓" },
    { key: "COOKING", label: "Готовится", icon: "🔥" },
    { key: "READY", label: "Готов", icon: "✓" },
    { key: "DELIVERING", label: "В пути", icon: "🚗" },
    { key: "DELIVERED", label: "Доставлен", icon: "🎉" },
  ];

  return (
    <main style={{ minHeight: "100vh", background: "#f5f7fa" }}>
      <header style={{ background: "#fff", borderBottom: "1px solid #EDEDED", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ height: 8, background: "#F58220" }} />
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 16px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <span style={{ fontSize: 24 }}>🌙</span>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "#3A3A3A", letterSpacing: 2 }}>LUNA</span>
          </Link>
          <Link href="/profile" style={{ fontSize: 14, color: "#a0aec0", textDecoration: "none", fontWeight: 600 }}>Мои заказы</Link>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 16px" }}>
        {/* Заголовок */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <span style={{ display: "inline-block", background: "#f0f3f7", color: "#F58220", borderRadius: 20, padding: "4px 16px", fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
            Заказ №{order.number}
          </span>
          <h1 style={{ fontWeight: 800, fontSize: 32, color: "#2c3e50", marginBottom: 8 }}>{currentStatus.label}</h1>
          {isActive && (
            <p style={{ fontSize: 16, color: "#a0aec0" }}>
              Ожидаемое время доставки:{" "}
              <span style={{ fontWeight: 700, color: "#2c3e50" }}>
                {estimatedTime.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </p>
          )}
        </div>

        {/* Трекинг */}
        {order.status !== "CANCELLED" && (
          <div style={cardS}>
            <div style={{ position: "relative", padding: "8px 0" }}>
              <div style={{ position: "absolute", left: 24, right: 24, top: 28, height: 4, background: "#e3e8ef", borderRadius: 4 }}>
                <div style={{ height: "100%", background: "#F58220", borderRadius: 4, transition: "width 0.5s", width: `${((currentStatus.step - 1) / 5) * 100}%` }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
                {stages.map((stage, index) => {
                  const active = currentStatus.step >= index + 1;
                  return (
                    <div key={stage.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 18, marginBottom: 10, fontWeight: 700,
                        background: active ? "#F58220" : "#e3e8ef",
                        color: active ? "#fff" : "#cbd5e0",
                        boxShadow: active ? "0 2px 8px rgba(208,2,27,0.3)" : "none",
                        transition: "all 0.3s",
                      }}>
                        {stage.icon}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: active ? "#2c3e50" : "#cbd5e0", textAlign: "center" }}>
                        {stage.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {order.status === "CANCELLED" && (
          <div style={{ ...cardS, background: "#f0f3f7", textAlign: "center" }}>
            <p style={{ fontSize: 16, color: "#F58220", fontWeight: 600 }}>Заказ отменён. Если есть вопросы — свяжитесь с нами.</p>
          </div>
        )}

        {/* Адрес */}
        <div style={cardS}>
          <h2 style={{ fontWeight: 700, fontSize: 18, color: "#2c3e50", marginBottom: 10 }}>Адрес доставки</h2>
          <p style={{ fontSize: 15, color: "#a0aec0" }}>{order.tableNumber}</p>
        </div>

        {/* Состав */}
        <div style={cardS}>
          <h2 style={{ fontWeight: 700, fontSize: 18, color: "#2c3e50", marginBottom: 16 }}>Состав заказа</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {order.lines.map((line) => (
              <div key={line.id} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 64, height: 64, borderRadius: 12, overflow: "hidden", background: "#f8f9fb", flexShrink: 0 }}>
                  {line.item.photo && <img src={line.item.photo} alt={line.item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: 15, color: "#2c3e50", marginBottom: 4 }}>{line.item.name}</p>
                  <p style={{ fontSize: 13, color: "#a0aec0" }}>{line.qty} × {line.price} ₽</p>
                </div>
                <span style={{ fontWeight: 700, fontSize: 15, color: "#2c3e50" }}>{line.qty * line.price} ₽</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #e3e8ef", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 800, fontSize: 18, color: "#2c3e50" }}>Итого</span>
            <span style={{ fontWeight: 800, fontSize: 18, color: "#2c3e50" }}>{order.total} ₽</span>
          </div>
        </div>

        {/* Кнопки */}
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/menu" style={{ flex: 1, border: "2px solid #F58220", color: "#F58220", padding: "14px 0", borderRadius: 12, textAlign: "center", fontWeight: 700, textDecoration: "none", fontSize: 15 }}>
            Вернуться в меню
          </Link>
          {order.status === "DELIVERED" && (
            <Link href="/menu" style={{ flex: 1, background: "#F58220", color: "#fff", padding: "14px 0", borderRadius: 12, textAlign: "center", fontWeight: 700, textDecoration: "none", fontSize: 15 }}>
              Заказать ещё раз
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
