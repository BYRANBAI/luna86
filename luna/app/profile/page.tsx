"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Guest {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  bonuses: number;
  segment: string;
  createdAt: string;
}

interface Order {
  id: number;
  number: string;
  status: string;
  total: number;
  createdAt: string;
}

interface Address {
  id: number;
  label: string;
  street: string;
  building: string;
  apartment: string;
  isDefault: boolean;
}

interface BonusTransaction {
  id: number;
  amount: number;
  type: string;
  reason: string;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [guest, setGuest] = useState<Guest | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [bonusHistory, setBonusHistory] = useState<BonusTransaction[]>([]);
  const [activeTab, setActiveTab] = useState<"orders" | "bonuses" | "addresses">("orders");
  const [loading, setLoading] = useState(true);

  async function loadProfile() {
    const token = localStorage.getItem("guestToken");
    const guestId = localStorage.getItem("guestId");

    if (!token || !guestId) {
      router.push("/auth");
      return;
    }

    try {
      const [guestRes, ordersRes, addressesRes, bonusRes] = await Promise.all([
        fetch(`/api/guests/${guestId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/guests/${guestId}/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/guests/${guestId}/addresses`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/guests/${guestId}/bonuses`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (guestRes.ok) setGuest(await guestRes.json());
      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (addressesRes.ok) setAddresses(await addressesRes.json());
      if (bonusRes.ok) setBonusHistory(await bonusRes.json());
    } catch (error) {
      console.error("Ошибка загрузки профиля:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  const logout = () => {
    localStorage.removeItem("guestToken");
    localStorage.removeItem("guestId");
    localStorage.removeItem("cart");
    router.push("/auth");
  };

  const cardS: React.CSSProperties = { background: "#FBF7F1", border: "1px solid #F1E9DC", borderRadius: 20, padding: 24, marginBottom: 12, boxShadow: "0 1px 2px rgba(92,70,46,0.04), 0 6px 16px rgba(92,70,46,0.06)" };

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", background: "#F6F0E8", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", border: "4px solid #E8DFD2", borderTopColor: "#F58220", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ fontSize: 16, color: "#8A8178" }}>Загрузка профиля...</p>
        </div>
      </main>
    );
  }

  if (!guest) return null;

  const statusLabels: Record<string, string> = {
    NEW: "Принят", CONFIRMED: "Подтверждён", COOKING: "Готовится",
    READY: "Готов", DELIVERING: "В пути", DELIVERED: "Доставлен", CANCELLED: "Отменён",
  };

  const statusColors: Record<string, string> = {
    NEW: "#F58220", CONFIRMED: "#F58220", COOKING: "#FF6B00",
    READY: "#22C55E", DELIVERING: "#3B82F6", DELIVERED: "#1C2430", CANCELLED: "#999",
  };

  const tabs = [
    { key: "orders", label: `Мои заказы (${orders.length})` },
    { key: "bonuses", label: "История бонусов" },
    { key: "addresses", label: `Адреса (${addresses.length})` },
  ] as const;

  return (
    <main style={{ minHeight: "100vh", background: "#F6F0E8" }}>
      <header style={{ background: "#FBF7F1", borderBottom: "1px solid #E8DFD2", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ height: 8, background: "#F58220" }} />
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <span style={{ fontSize: 24 }}>🌙</span>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "#3A3A3A", letterSpacing: 2 }}>LUNA</span>
          </Link>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <Link href="/menu" style={{ fontSize: 14, fontWeight: 600, color: "#8A8178", textDecoration: "none" }}>Меню</Link>
            <button onClick={logout} style={{ fontSize: 14, fontWeight: 600, color: "#F58220", background: "none", border: "none", cursor: "pointer" }}>Выйти</button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 16px" }}>
        {/* Шапка */}
        <div style={{ background: "#F58220", borderRadius: 20, padding: "28px 32px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
          <div>
            <h1 style={{ fontWeight: 800, fontSize: 28, color: "#fff", marginBottom: 6 }}>{guest.name}</h1>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.75)", marginBottom: 2 }}>{guest.phone}</p>
            {guest.email && <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>{guest.email}</p>}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ display: "inline-block", background: "rgba(255,255,255,0.2)", borderRadius: 10, padding: "4px 14px", fontSize: 13, color: "#fff", fontWeight: 700, marginBottom: 12 }}>
              {guest.segment}
            </div>
            <div style={{ background: "#fff", borderRadius: 14, padding: "14px 24px", textAlign: "center" }}>
              <p style={{ fontSize: 12, color: "#8A8178", marginBottom: 4 }}>Бонусы</p>
              <p style={{ fontWeight: 800, fontSize: 28, color: "#F58220" }}>{guest.bonuses}</p>
            </div>
          </div>
        </div>

        {/* Табы */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, background: "#FBF7F1", border: "1px solid #F1E9DC", borderRadius: 14, padding: 6, boxShadow: "0 1px 2px rgba(92,70,46,0.04), 0 6px 16px rgba(92,70,46,0.06)" }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap",
                background: activeTab === tab.key ? "#F58220" : "transparent",
                color: activeTab === tab.key ? "#fff" : "#8A8178" }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Заказы */}
        {activeTab === "orders" && (
          <div>
            {orders.length === 0 ? (
              <div style={{ ...cardS, padding: 48, textAlign: "center" }}>
                <p style={{ fontSize: 16, color: "#8A8178", marginBottom: 20 }}>У вас пока нет заказов</p>
                <Link href="/menu" style={{ background: "#F58220", color: "#fff", padding: "12px 28px", borderRadius: 12, textDecoration: "none", fontWeight: 700 }}>
                  Перейти в меню
                </Link>
              </div>
            ) : orders.map(order => (
              <Link key={order.id} href={`/orders/${order.id}`} style={{ ...cardS, display: "flex", alignItems: "center", justifyContent: "space-between", textDecoration: "none", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ background: "#F3ECE1", borderRadius: 10, padding: "8px 14px" }}>
                    <span style={{ fontWeight: 800, fontSize: 15, color: "#F58220" }}>№{order.number}</span>
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 15, color: "#1C2430", marginBottom: 4 }}>
                      <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: statusColors[order.status] ?? "#8A8178", marginRight: 6 }} />
                      {statusLabels[order.status] || order.status}
                    </p>
                    <p style={{ fontSize: 13, color: "#8A8178" }}>
                      {new Date(order.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                <span style={{ fontWeight: 800, fontSize: 20, color: "#1C2430" }}>{order.total} ₽</span>
              </Link>
            ))}
          </div>
        )}

        {/* Бонусы */}
        {activeTab === "bonuses" && (
          <div>
            {bonusHistory.length === 0 ? (
              <div style={{ ...cardS, padding: 48, textAlign: "center" }}>
                <p style={{ fontSize: 16, color: "#8A8178" }}>История бонусов пуста</p>
              </div>
            ) : bonusHistory.map(tx => (
              <div key={tx.id} style={{ ...cardS, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 15, color: "#1C2430", marginBottom: 4 }}>{tx.reason}</p>
                  <p style={{ fontSize: 13, color: "#8A8178" }}>
                    {new Date(tx.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <span style={{ fontWeight: 800, fontSize: 22, color: tx.amount > 0 ? "#22C55E" : "#F58220" }}>
                  {tx.amount > 0 ? "+" : ""}{tx.amount}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Адреса */}
        {activeTab === "addresses" && (
          <div>
            {addresses.length === 0 ? (
              <div style={{ ...cardS, padding: 48, textAlign: "center" }}>
                <p style={{ fontSize: 16, color: "#8A8178", marginBottom: 20 }}>Нет сохранённых адресов</p>
                <Link href="/checkout" style={{ background: "#F58220", color: "#fff", padding: "12px 28px", borderRadius: 12, textDecoration: "none", fontWeight: 700 }}>
                  Добавить адрес
                </Link>
              </div>
            ) : addresses.map(addr => (
              <div key={addr.id} style={cardS}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: "#1C2430" }}>{addr.label}</span>
                  {addr.isDefault && <span style={{ background: "#F58220", color: "#fff", fontSize: 11, padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>По умолчанию</span>}
                </div>
                <p style={{ fontSize: 14, color: "#8A8178" }}>{addr.street}, {addr.building}{addr.apartment && `, кв. ${addr.apartment}`}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
