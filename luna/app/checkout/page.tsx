"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface CartItem {
  itemId: number;
  qty: number;
  price: number;
}

interface Item {
  id: number;
  name: string;
  price: number;
  photo: string;
}

interface Guest {
  id: number;
  name: string;
  phone: string;
  bonuses: number;
}

interface Address {
  id: number;
  label: string;
  street: string;
  building: string;
  apartment: string;
  entrance: string;
  floor: string;
  intercom: string;
  comment: string;
  isDefault: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [bonusesToUse, setBonusesToUse] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [comment, setComment] = useState("");
  const [newAddress, setNewAddress] = useState({
    label: "Дом",
    street: "",
    building: "",
    apartment: "",
    entrance: "",
    floor: "",
    intercom: "",
    comment: "",
  });
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCart();
    loadGuest();
  }, []);

  useEffect(() => {
    if (cart.length > 0) {
      loadItems();
    }
  }, [cart]);

  const loadCart = () => {
    const saved = localStorage.getItem("cart");
    if (saved) {
      const parsed = JSON.parse(saved);
      setCart(parsed);
      if (parsed.length === 0) {
        router.push("/menu");
      }
    } else {
      router.push("/menu");
    }
  };

  const loadGuest = async () => {
    const token = localStorage.getItem("guestToken");
    const guestId = localStorage.getItem("guestId");
    if (!token || !guestId) {
      router.push("/auth?redirect=/checkout");
      return;
    }

    try {
      const res = await fetch(`/api/guests/${guestId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setGuest(data);
        loadAddresses(parseInt(guestId), token);
      } else {
        router.push("/auth?redirect=/checkout");
      }
    } catch (error) {
      console.error("Ошибка загрузки данных гостя:", error);
      router.push("/auth?redirect=/checkout");
    }
  };

  const loadAddresses = async (guestId: number, token: string) => {
    try {
      const res = await fetch(`/api/guests/${guestId}/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses(data);
        const defaultAddr = data.find((a: Address) => a.isDefault);
        if (defaultAddr) setSelectedAddress(defaultAddr.id);
      }
    } catch (error) {
      console.error("Ошибка загрузки адресов:", error);
    }
  };

  const loadItems = async () => {
    try {
      const res = await fetch("/api/items");
      const data = await res.json();
      setItems(data.filter((i: Item) => cart.some((c) => c.itemId === i.id)));
    } catch (error) {
      console.error("Ошибка загрузки товаров:", error);
    }
  };

  const saveNewAddress = async () => {
    if (!newAddress.street || !newAddress.building) {
      alert("Заполните улицу и номер дома");
      return;
    }

    const token = localStorage.getItem("guestToken");
    const guestId = localStorage.getItem("guestId");
    if (!token || !guestId) return;

    try {
      const res = await fetch(`/api/guests/${guestId}/addresses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newAddress),
      });

      if (res.ok) {
        const saved = await res.json();
        setAddresses([...addresses, saved]);
        setSelectedAddress(saved.id);
        setShowNewAddress(false);
        setNewAddress({
          label: "Дом",
          street: "",
          building: "",
          apartment: "",
          entrance: "",
          floor: "",
          intercom: "",
          comment: "",
        });
      }
    } catch (error) {
      console.error("Ошибка сохранения адреса:", error);
    }
  };

  const placeOrder = async () => {
    if (!selectedAddress) {
      alert("Выберите адрес доставки");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("guestToken");
    const guestId = localStorage.getItem("guestId");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          guestId: parseInt(guestId!),
          items: cart,
          addressId: selectedAddress,
          bonusesToUse,
          paymentMethod,
          comment,
          source: "Сайт",
        }),
      });

      if (res.ok) {
        const order = await res.json();
        localStorage.removeItem("cart");
        router.push(`/orders/${order.id}`);
      } else {
        const err = await res.json();
        alert(err.error || "Ошибка оформления заказа");
      }
    } catch (error) {
      console.error("Ошибка оформления заказа:", error);
      alert("Ошибка оформления заказа");
    } finally {
      setLoading(false);
    }
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const maxBonusUse = guest ? Math.min(guest.bonuses, Math.floor(cartTotal * 0.5)) : 0;
  const finalTotal = cartTotal - bonusesToUse;

  return (
    <main className="min-h-screen bg-[#F6F1E8]">
      <nav className="sticky top-0 z-50 border-b border-[#E2D9C8] bg-[#FBF7EF]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-2xl font-bold">
            <span className="text-[#C8853F]">◐</span> ЛУНА
          </Link>
          <Link
            href="/menu"
            className="text-sm font-medium text-[#8A8A80] transition hover:text-[#C8853F]"
          >
            ← Вернуться в меню
          </Link>
        </div>
      </nav>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-8 font-serif text-4xl font-bold text-[#1F2421]">
            Оформление <span className="italic text-[#C8853F]">заказа</span>
          </h1>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Основная форма */}
            <div className="lg:col-span-2 space-y-6">
              {/* Адрес доставки */}
              <div className="rounded-2xl border border-[#E2D9C8] bg-white p-6">
                <h2 className="mb-4 font-serif text-2xl font-bold text-[#1F2421]">
                  Адрес доставки
                </h2>

                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition ${
                        selectedAddress === addr.id
                          ? "border-[#C8853F] bg-[#F0E3D0]"
                          : "border-[#E2D9C8] hover:border-[#C8853F]/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddress === addr.id}
                        onChange={() => setSelectedAddress(addr.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="font-medium text-[#1F2421]">{addr.label}</span>
                          {addr.isDefault && (
                            <span className="rounded-full bg-[#C8853F] px-2 py-0.5 text-xs text-white">
                              По умолчанию
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[#8A8A80]">
                          {addr.street}, {addr.building}
                          {addr.apartment && `, кв. ${addr.apartment}`}
                        </p>
                      </div>
                    </label>
                  ))}

                  {!showNewAddress ? (
                    <button
                      onClick={() => setShowNewAddress(true)}
                      className="w-full rounded-xl border-2 border-dashed border-[#E2D9C8] p-4 text-sm font-medium text-[#8A8A80] transition hover:border-[#C8853F] hover:text-[#C8853F]"
                    >
                      + Добавить новый адрес
                    </button>
                  ) : (
                    <div className="space-y-3 rounded-xl border-2 border-[#C8853F] bg-[#F0E3D0]/30 p-4">
                      <input
                        type="text"
                        placeholder="Улица"
                        value={newAddress.street}
                        onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                        className="w-full rounded-lg border border-[#E2D9C8] bg-white px-4 py-2 text-[#1F2421] outline-none focus:border-[#C8853F]"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Дом"
                          value={newAddress.building}
                          onChange={(e) => setNewAddress({ ...newAddress, building: e.target.value })}
                          className="rounded-lg border border-[#E2D9C8] bg-white px-4 py-2 text-[#1F2421] outline-none focus:border-[#C8853F]"
                        />
                        <input
                          type="text"
                          placeholder="Квартира"
                          value={newAddress.apartment}
                          onChange={(e) => setNewAddress({ ...newAddress, apartment: e.target.value })}
                          className="rounded-lg border border-[#E2D9C8] bg-white px-4 py-2 text-[#1F2421] outline-none focus:border-[#C8853F]"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={saveNewAddress}
                          className="flex-1 rounded-lg bg-[#C8853F] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#A86B2C]"
                        >
                          Сохранить
                        </button>
                        <button
                          onClick={() => setShowNewAddress(false)}
                          className="rounded-lg border border-[#E2D9C8] px-4 py-2 text-sm font-medium text-[#8A8A80] transition hover:bg-[#F6F1E8]"
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Бонусы */}
              {guest && guest.bonuses > 0 && (
                <div className="rounded-2xl border border-[#E2D9C8] bg-white p-6">
                  <h2 className="mb-4 font-serif text-2xl font-bold text-[#1F2421]">
                    Бонусы
                  </h2>
                  <p className="mb-3 text-sm text-[#8A8A80]">
                    Доступно: <span className="font-medium text-[#C8853F]">{guest.bonuses}</span> бонусов
                    (можно списать до {maxBonusUse} ₽)
                  </p>
                  <input
                    type="number"
                    min="0"
                    max={maxBonusUse}
                    value={bonusesToUse}
                    onChange={(e) => setBonusesToUse(Math.min(maxBonusUse, parseInt(e.target.value) || 0))}
                    className="w-full rounded-lg border border-[#E2D9C8] bg-white px-4 py-2 text-[#1F2421] outline-none focus:border-[#C8853F]"
                    placeholder="Сколько бонусов использовать?"
                  />
                </div>
              )}

              {/* Оплата */}
              <div className="rounded-2xl border border-[#E2D9C8] bg-white p-6">
                <h2 className="mb-4 font-serif text-2xl font-bold text-[#1F2421]">
                  Способ оплаты
                </h2>
                <div className="space-y-3">
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-[#E2D9C8] p-4 transition hover:border-[#C8853F]">
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={paymentMethod === "card"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span className="font-medium text-[#1F2421]">Картой онлайн</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-[#E2D9C8] p-4 transition hover:border-[#C8853F]">
                    <input
                      type="radio"
                      name="payment"
                      value="cash"
                      checked={paymentMethod === "cash"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span className="font-medium text-[#1F2421]">Наличными курьеру</span>
                  </label>
                </div>
              </div>

              {/* Комментарий */}
              <div className="rounded-2xl border border-[#E2D9C8] bg-white p-6">
                <h2 className="mb-4 font-serif text-2xl font-bold text-[#1F2421]">
                  Комментарий к заказу
                </h2>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Укажите дополнительные пожелания..."
                  className="w-full rounded-lg border border-[#E2D9C8] bg-white px-4 py-3 text-[#1F2421] outline-none focus:border-[#C8853F]"
                  rows={3}
                />
              </div>
            </div>

            {/* Итоговая карточка */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-2xl border border-[#E2D9C8] bg-white p-6 shadow-lg">
                <h2 className="mb-4 font-serif text-2xl font-bold text-[#1F2421]">
                  Ваш заказ
                </h2>

                <div className="mb-4 space-y-3">
                  {cart.map((cartItem) => {
                    const item = items.find((i) => i.id === cartItem.itemId);
                    if (!item) return null;

                    return (
                      <div key={cartItem.itemId} className="flex items-center gap-3">
                        <div className="h-12 w-12 overflow-hidden rounded-lg bg-[#F6F1E8]">
                          {item.photo && (
                            <img
                              src={item.photo}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#1F2421]">{item.name}</p>
                          <p className="text-xs text-[#8A8A80]">
                            {cartItem.qty} × {cartItem.price} ₽
                          </p>
                        </div>
                        <span className="font-medium text-[#1F2421]">
                          {cartItem.qty * cartItem.price} ₽
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mb-4 space-y-2 border-t border-[#E2D9C8] pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#8A8A80]">Сумма</span>
                    <span className="font-medium text-[#1F2421]">{cartTotal} ₽</span>
                  </div>
                  {bonusesToUse > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#8A8A80]">Списано бонусов</span>
                      <span className="font-medium text-[#C8853F]">−{bonusesToUse} ₽</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-[#E2D9C8] pt-2">
                    <span className="font-serif text-lg font-bold text-[#1F2421]">Итого</span>
                    <span className="font-serif text-lg font-bold text-[#1F2421]">
                      {finalTotal} ₽
                    </span>
                  </div>
                </div>

                <button
                  onClick={placeOrder}
                  disabled={loading || !selectedAddress}
                  className="w-full rounded-full bg-[#C8853F] px-6 py-4 font-medium text-white transition hover:bg-[#A86B2C] disabled:bg-[#8A8A80]"
                >
                  {loading ? "Оформление..." : "Оформить заказ"}
                </button>

                <p className="mt-3 text-center text-xs text-[#8A8A80]">
                  Время доставки: 45–60 минут
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
