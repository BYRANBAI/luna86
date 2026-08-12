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

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
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
  };

  const logout = () => {
    localStorage.removeItem("guestToken");
    localStorage.removeItem("guestId");
    localStorage.removeItem("cart");
    router.push("/auth");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F6F1E8]">
        <div className="text-center">
          <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-[#E2D9C8] border-t-[#C8853F]" />
          <p className="text-lg text-[#8A8A80]">Загрузка профиля...</p>
        </div>
      </main>
    );
  }

  if (!guest) {
    return null;
  }

  const statusLabels: Record<string, string> = {
    NEW: "Принят",
    CONFIRMED: "Подтверждён",
    COOKING: "Готовится",
    READY: "Готов",
    DELIVERING: "В пути",
    DELIVERED: "Доставлен",
    CANCELLED: "Отменён",
  };

  return (
    <main className="min-h-screen bg-[#F6F1E8]">
      <nav className="sticky top-0 z-50 border-b border-[#E2D9C8] bg-[#FBF7EF]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-2xl font-bold">
            <span className="text-[#C8853F]">◐</span> ЛУНА
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/menu"
              className="text-sm font-medium text-[#8A8A80] transition hover:text-[#C8853F]"
            >
              Меню
            </Link>
            <button
              onClick={logout}
              className="text-sm font-medium text-[#8A8A80] transition hover:text-[#C8853F]"
            >
              Выйти
            </button>
          </div>
        </div>
      </nav>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-7xl">
          {/* Шапка профиля */}
          <div className="mb-8 rounded-2xl border border-[#E2D9C8] bg-gradient-to-br from-[#FBF7EF] to-[#F0E3D0] p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="mb-2 font-serif text-4xl font-bold text-[#1F2421]">
                  {guest.name}
                </h1>
                <p className="mb-1 text-lg text-[#8A8A80]">{guest.phone}</p>
                {guest.email && <p className="text-[#8A8A80]">{guest.email}</p>}
              </div>
              <div className="text-right">
                <div className="mb-2 rounded-full bg-[#C8853F] px-4 py-1 text-sm font-medium text-white">
                  {guest.segment}
                </div>
                <div className="rounded-2xl border border-[#C8853F] bg-white px-6 py-4">
                  <p className="mb-1 text-sm text-[#8A8A80]">Бонусов</p>
                  <p className="font-serif text-3xl font-bold text-[#C8853F]">
                    {guest.bonuses}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Табы */}
          <div className="mb-6 flex gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab("orders")}
              className={`whitespace-nowrap rounded-full px-6 py-3 text-sm font-medium transition ${
                activeTab === "orders"
                  ? "bg-[#C8853F] text-white"
                  : "bg-white text-[#1F2421] hover:bg-[#F0E3D0]"
              }`}
            >
              Мои заказы ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab("bonuses")}
              className={`whitespace-nowrap rounded-full px-6 py-3 text-sm font-medium transition ${
                activeTab === "bonuses"
                  ? "bg-[#C8853F] text-white"
                  : "bg-white text-[#1F2421] hover:bg-[#F0E3D0]"
              }`}
            >
              История бонусов
            </button>
            <button
              onClick={() => setActiveTab("addresses")}
              className={`whitespace-nowrap rounded-full px-6 py-3 text-sm font-medium transition ${
                activeTab === "addresses"
                  ? "bg-[#C8853F] text-white"
                  : "bg-white text-[#1F2421] hover:bg-[#F0E3D0]"
              }`}
            >
              Адреса ({addresses.length})
            </button>
          </div>

          {/* Контент вкладок */}
          {activeTab === "orders" && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="rounded-2xl border border-[#E2D9C8] bg-white p-12 text-center">
                  <p className="mb-4 text-lg text-[#8A8A80]">У вас пока нет заказов</p>
                  <Link
                    href="/menu"
                    className="inline-block rounded-full bg-[#C8853F] px-6 py-3 font-medium text-white transition hover:bg-[#A86B2C]"
                  >
                    Перейти в меню
                  </Link>
                </div>
              ) : (
                orders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="block rounded-2xl border border-[#E2D9C8] bg-white p-6 transition hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="rounded-full bg-[#F0E3D0] px-4 py-2">
                          <span className="font-serif text-lg font-bold text-[#C8853F]">
                            №{order.number}
                          </span>
                        </div>
                        <div>
                          <p className="mb-1 font-medium text-[#1F2421]">
                            {statusLabels[order.status] || order.status}
                          </p>
                          <p className="text-sm text-[#8A8A80]">
                            {new Date(order.createdAt).toLocaleDateString("ru-RU", {
                              day: "numeric",
                              month: "long",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-serif text-2xl font-bold text-[#1F2421]">
                          {order.total} ₽
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {activeTab === "bonuses" && (
            <div className="space-y-4">
              {bonusHistory.length === 0 ? (
                <div className="rounded-2xl border border-[#E2D9C8] bg-white p-12 text-center">
                  <p className="text-lg text-[#8A8A80]">История бонусов пуста</p>
                </div>
              ) : (
                bonusHistory.map((tx) => (
                  <div
                    key={tx.id}
                    className="rounded-2xl border border-[#E2D9C8] bg-white p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="mb-1 font-medium text-[#1F2421]">{tx.reason}</p>
                        <p className="text-sm text-[#8A8A80]">
                          {new Date(tx.createdAt).toLocaleDateString("ru-RU", {
                            day: "numeric",
                            month: "long",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div>
                        <span
                          className={`font-serif text-2xl font-bold ${
                            tx.amount > 0 ? "text-[#C8853F]" : "text-[#8A8A80]"
                          }`}
                        >
                          {tx.amount > 0 ? "+" : ""}
                          {tx.amount}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "addresses" && (
            <div className="space-y-4">
              {addresses.length === 0 ? (
                <div className="rounded-2xl border border-[#E2D9C8] bg-white p-12 text-center">
                  <p className="mb-4 text-lg text-[#8A8A80]">У вас нет сохранённых адресов</p>
                  <Link
                    href="/checkout"
                    className="inline-block rounded-full bg-[#C8853F] px-6 py-3 font-medium text-white transition hover:bg-[#A86B2C]"
                  >
                    Добавить адрес
                  </Link>
                </div>
              ) : (
                addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="rounded-2xl border border-[#E2D9C8] bg-white p-6"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className="font-medium text-[#1F2421]">{addr.label}</span>
                      {addr.isDefault && (
                        <span className="rounded-full bg-[#C8853F] px-2 py-0.5 text-xs text-white">
                          По умолчанию
                        </span>
                      )}
                    </div>
                    <p className="text-[#8A8A80]">
                      {addr.street}, {addr.building}
                      {addr.apartment && `, кв. ${addr.apartment}`}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
