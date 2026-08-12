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
  NEW: { label: "Принят", color: "bg-[#C8853F]", step: 1 },
  CONFIRMED: { label: "Подтверждён", color: "bg-[#C8853F]", step: 2 },
  COOKING: { label: "Готовится", color: "bg-[#C8853F]", step: 3 },
  READY: { label: "Готов", color: "bg-[#C8853F]", step: 4 },
  DELIVERING: { label: "В пути", color: "bg-[#C8853F]", step: 5 },
  DELIVERED: { label: "Доставлен", color: "bg-[#2A2723]", step: 6 },
  CANCELLED: { label: "Отменён", color: "bg-[#8A8A80]", step: 0 },
};

export default function OrderTrackingPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
    const interval = setInterval(loadOrder, 10000); // Обновляем каждые 10 секунд
    return () => clearInterval(interval);
  }, []);

  const loadOrder = async () => {
    const token = localStorage.getItem("guestToken");
    if (!token) {
      router.push("/auth");
      return;
    }

    try {
      const res = await fetch(`/api/orders/${params.id}`, {
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

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F6F1E8]">
        <div className="text-center">
          <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-[#E2D9C8] border-t-[#C8853F]" />
          <p className="text-lg text-[#8A8A80]">Загрузка заказа...</p>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F6F1E8]">
        <div className="text-center">
          <p className="mb-4 text-xl text-[#8A8A80]">Заказ не найден</p>
          <Link
            href="/menu"
            className="rounded-full bg-[#C8853F] px-6 py-3 font-medium text-white transition hover:bg-[#A86B2C]"
          >
            Вернуться в меню
          </Link>
        </div>
      </main>
    );
  }

  const currentStatus = statusMap[order.status] || statusMap.NEW;
  const isActive = order.status !== "DELIVERED" && order.status !== "CANCELLED";
  const estimatedTime = new Date(order.readyAt);

  return (
    <main className="min-h-screen bg-[#F6F1E8]">
      <nav className="sticky top-0 z-50 border-b border-[#E2D9C8] bg-[#FBF7EF]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-2xl font-bold">
            <span className="text-[#C8853F]">◐</span> ЛУНА
          </Link>
          <Link
            href="/profile"
            className="text-sm font-medium text-[#8A8A80] transition hover:text-[#C8853F]"
          >
            Мои заказы
          </Link>
        </div>
      </nav>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-4xl">
          {/* Заголовок */}
          <div className="mb-8 text-center">
            <div className="mb-2 inline-block rounded-full bg-[#F0E3D0] px-4 py-1 text-sm font-medium text-[#C8853F]">
              Заказ №{order.number}
            </div>
            <h1 className="mb-2 font-serif text-4xl font-bold text-[#1F2421]">
              {currentStatus.label}
            </h1>
            {isActive && (
              <p className="text-lg text-[#8A8A80]">
                Ожидаемое время доставки:{" "}
                <span className="font-medium text-[#1F2421]">
                  {estimatedTime.toLocaleTimeString("ru-RU", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </p>
            )}
          </div>

          {/* Трекинг */}
          {order.status !== "CANCELLED" && (
            <div className="mb-8 rounded-2xl border border-[#E2D9C8] bg-white p-8">
              <div className="relative">
                {/* Линия прогресса */}
                <div className="absolute left-0 top-6 h-1 w-full bg-[#E2D9C8]">
                  <div
                    className="h-full bg-[#C8853F] transition-all duration-500"
                    style={{
                      width: `${(currentStatus.step / 6) * 100}%`,
                    }}
                  />
                </div>

                {/* Этапы */}
                <div className="relative flex justify-between">
                  {[
                    { key: "NEW", label: "Принят", icon: "✓" },
                    { key: "CONFIRMED", label: "Подтверждён", icon: "✓" },
                    { key: "COOKING", label: "Готовится", icon: "🔥" },
                    { key: "READY", label: "Готов", icon: "✓" },
                    { key: "DELIVERING", label: "В пути", icon: "🚗" },
                    { key: "DELIVERED", label: "Доставлен", icon: "🎉" },
                  ].map((stage, index) => {
                    const isPast = currentStatus.step > index + 1;
                    const isCurrent = currentStatus.step === index + 1;
                    const isFuture = currentStatus.step < index + 1;

                    return (
                      <div key={stage.key} className="flex flex-col items-center">
                        <div
                          className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full text-xl transition ${
                            isPast || isCurrent
                              ? "bg-[#C8853F] text-white shadow-lg"
                              : "bg-[#E2D9C8] text-[#8A8A80]"
                          }`}
                        >
                          {stage.icon}
                        </div>
                        <span
                          className={`text-center text-xs font-medium ${
                            isPast || isCurrent ? "text-[#1F2421]" : "text-[#8A8A80]"
                          }`}
                        >
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
            <div className="mb-8 rounded-2xl border border-[#E2D9C8] bg-[#F6F1E8] p-6 text-center">
              <p className="text-lg text-[#8A8A80]">
                Заказ отменён. Если у вас есть вопросы, свяжитесь с нами.
              </p>
            </div>
          )}

          {/* Адрес доставки */}
          <div className="mb-8 rounded-2xl border border-[#E2D9C8] bg-white p-6">
            <h2 className="mb-3 font-serif text-xl font-bold text-[#1F2421]">
              Адрес доставки
            </h2>
            <p className="text-[#8A8A80]">{order.tableNumber}</p>
          </div>

          {/* Состав заказа */}
          <div className="mb-8 rounded-2xl border border-[#E2D9C8] bg-white p-6">
            <h2 className="mb-4 font-serif text-xl font-bold text-[#1F2421]">
              Состав заказа
            </h2>
            <div className="space-y-4">
              {order.lines.map((line) => (
                <div key={line.id} className="flex items-center gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-lg bg-[#F6F1E8]">
                    {line.item.photo && (
                      <img
                        src={line.item.photo}
                        alt={line.item.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[#1F2421]">{line.item.name}</p>
                    <p className="text-sm text-[#8A8A80]">
                      {line.qty} × {line.price} ₽
                    </p>
                  </div>
                  <span className="font-medium text-[#1F2421]">
                    {line.qty * line.price} ₽
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-[#E2D9C8] pt-4">
              <div className="flex justify-between">
                <span className="font-serif text-xl font-bold text-[#1F2421]">Итого</span>
                <span className="font-serif text-xl font-bold text-[#1F2421]">
                  {order.total} ₽
                </span>
              </div>
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex gap-4">
            <Link
              href="/menu"
              className="flex-1 rounded-full border border-[#C8853F] px-6 py-4 text-center font-medium text-[#C8853F] transition hover:bg-[#F0E3D0]"
            >
              Вернуться в меню
            </Link>
            {order.status === "DELIVERED" && (
              <Link
                href="/menu"
                className="flex-1 rounded-full bg-[#C8853F] px-6 py-4 text-center font-medium text-white transition hover:bg-[#A86B2C]"
              >
                Заказать ещё раз
              </Link>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
