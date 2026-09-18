"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { guestFetch } from "@/lib/guest-session";

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
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [comment, setComment] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState("");
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
    if (loadCart()) loadGuest();
  }, []);

  useEffect(() => {
    if (cart.length > 0) {
      loadItems();
    }
  }, [cart]);

  const loadCart = () => {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem("cart") ?? "[]");
      const safe = Array.isArray(parsed) ? parsed.filter((item): item is CartItem =>
        item && typeof item === "object" && Number.isInteger((item as CartItem).itemId) &&
        Number.isInteger((item as CartItem).qty) && (item as CartItem).qty > 0 &&
        Number.isFinite((item as CartItem).price) && (item as CartItem).price >= 0
      ) : [];
      setCart(safe);
      return safe.length > 0;
    } catch {
      localStorage.removeItem("cart");
      setCart([]);
      return false;
    }
  };

  const loadGuest = async () => {
    const guestId = localStorage.getItem("guestId");
    if (!guestId) {
      router.push("/menu?tab=profile");
      return;
    }

    try {
      const res = await guestFetch(`/api/guests/${guestId}`);
      if (res.ok) {
        const data = await res.json();
        setGuest(data);
        loadAddresses(parseInt(guestId));
      } else {
        router.push("/menu?tab=profile");
      }
    } catch (error) {
      console.error("Ошибка загрузки данных гостя:", error);
      router.push("/menu?tab=profile");
    }
  };

  const loadAddresses = async (guestId: number) => {
    try {
      const res = await guestFetch(`/api/guests/${guestId}/addresses`);
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

    const guestId = localStorage.getItem("guestId");
    if (!guestId) return;

    try {
      const res = await guestFetch(`/api/guests/${guestId}/addresses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  const updateCartQty = (itemId: number, delta: number) => {
    const updated = cart.map((item) => item.itemId === itemId ? { ...item, qty: item.qty + delta } : item)
      .filter((item) => item.qty > 0);
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
    if (updated.length === 0) router.push("/menu");
  };

  const applyPromoCode = () => {
    setPromoDiscount(0);
    setPromoError("Промокоды для доставки пока недоступны");
  };

  const placeOrder = async () => {
    if (!selectedAddress) {
      alert("Выберите адрес доставки");
      return;
    }

    setLoading(true);
    const guestId = localStorage.getItem("guestId");

    try {
      const res = await guestFetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
  const promoAmount = Math.floor(cartTotal * promoDiscount / 100);
  const finalTotal = cartTotal - bonusesToUse - promoAmount;

  const card: React.CSSProperties = { background: "#fff", borderRadius: 16, padding: 24, marginBottom: 16, boxShadow: "0 1px 4px rgba(139, 157, 195, 0.12)" };
  const inp2 = "w-full rounded-xl border border-[#e3e8ef] bg-[#f8f9fb] px-4 py-2 text-[#2c3e50] outline-none focus:border-[#8b9dc3] focus:bg-white";
  const sectionTitle: React.CSSProperties = { fontWeight: 800, fontSize: 18, color: "#2c3e50", marginBottom: 16 };

  if (cart.length === 0) return (
    <main style={{ minHeight: "100vh", background: "#f5f7fa", padding: "48px 24px", color: "#2c3e50", textAlign: "center" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Корзина пока пуста</h1>
      <p style={{ margin: "16px 0 24px" }}>Добавьте блюда из меню, чтобы оформить заказ.</p>
      <Link href="/menu" style={{ display: "inline-block", padding: "14px 24px", background: "#E91E63", color: "white", borderRadius: 12 }}>Выбрать блюда</Link>
    </main>
  );

  return (
    <main style={{ minHeight: "100vh", background: "#f5f7fa" }}>
      <header style={{ background: "#fff", borderBottom: "1px solid #e3e8ef", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <span style={{ fontSize: 24 }}>🌙</span>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "#E91E63", letterSpacing: 2 }}>LUNA</span>
          </Link>
          <Link href="/menu" style={{ fontSize: 14, color: "#a0aec0", textDecoration: "none", fontWeight: 600 }}>← Вернуться в меню</Link>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 16px" }}>
        <h1 style={{ fontWeight: 800, fontSize: 28, color: "#2c3e50", marginBottom: 24 }}>Оформление заказа</h1>

        <div className="grid grid-cols-1 gap-6 items-start lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            {/* Адрес */}
            <div style={card}>
              <div style={sectionTitle}>Адрес доставки</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {addresses.map((addr) => (
                  <label key={addr.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: 16, borderRadius: 12, border: `2px solid ${selectedAddress === addr.id ? "#8b9dc3" : "#e3e8ef"}`, background: selectedAddress === addr.id ? "#f0f3f7" : "#fff", cursor: "pointer" }}>
                    <input type="radio" name="address" checked={selectedAddress === addr.id} onChange={() => setSelectedAddress(addr.id)} style={{ marginTop: 2 }} />
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: "#2c3e50" }}>{addr.label}</span>
                        {addr.isDefault && <span style={{ background: "#8b9dc3", color: "#fff", fontSize: 11, padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>По умолчанию</span>}
                      </div>
                      <p style={{ fontSize: 13, color: "#a0aec0" }}>{addr.street}, {addr.building}{addr.apartment && `, кв. ${addr.apartment}`}</p>
                    </div>
                  </label>
                ))}

                {!showNewAddress ? (
                  <button onClick={() => setShowNewAddress(true)} style={{ padding: 16, borderRadius: 12, border: "2px dashed #e3e8ef", background: "#fff", color: "#a0aec0", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                    + Добавить новый адрес
                  </button>
                ) : (
                  <div style={{ padding: 16, borderRadius: 12, border: "2px solid #8b9dc3", background: "#f0f3f7", display: "flex", flexDirection: "column", gap: 10 }}>
                    <input type="text" placeholder="Улица" value={newAddress.street} onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })} className={inp2} />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <input type="text" placeholder="Дом" value={newAddress.building} onChange={(e) => setNewAddress({ ...newAddress, building: e.target.value })} className={inp2} />
                      <input type="text" placeholder="Квартира" value={newAddress.apartment} onChange={(e) => setNewAddress({ ...newAddress, apartment: e.target.value })} className={inp2} />
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={saveNewAddress} style={{ flex: 1, background: "#8b9dc3", color: "#fff", border: "none", borderRadius: 10, padding: "10px 0", fontWeight: 700, cursor: "pointer" }}>Сохранить</button>
                      <button onClick={() => setShowNewAddress(false)} style={{ padding: "10px 20px", border: "1.5px solid #e3e8ef", borderRadius: 10, background: "#fff", color: "#a0aec0", fontWeight: 600, cursor: "pointer" }}>Отмена</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Бонусы */}
            {guest && guest.bonuses > 0 && (
              <div style={card}>
                <div style={sectionTitle}>Бонусы</div>
                <p style={{ fontSize: 14, color: "#a0aec0", marginBottom: 12 }}>
                  Доступно: <span style={{ color: "#8b9dc3", fontWeight: 700 }}>{guest.bonuses}</span> бонусов (можно списать до {maxBonusUse} ₽)
                </p>
                <input type="number" min="0" max={maxBonusUse} value={bonusesToUse}
                  onChange={(e) => setBonusesToUse(Math.min(maxBonusUse, parseInt(e.target.value) || 0))}
                  className={inp2} placeholder="Сколько бонусов использовать?" />
              </div>
            )}

            {/* Оплата */}
            <div style={card}>
              <div style={sectionTitle}>Способ оплаты</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[{ val: "card_delivery", label: "💳 Картой курьеру" }, { val: "cash", label: "💵 Наличными курьеру" }].map(opt => (
                  <label key={opt.val} style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, borderRadius: 12, border: `2px solid ${paymentMethod === opt.val ? "#8b9dc3" : "#e3e8ef"}`, background: paymentMethod === opt.val ? "#f0f3f7" : "#fff", cursor: "pointer" }}>
                    <input type="radio" name="payment" value={opt.val} checked={paymentMethod === opt.val} onChange={(e) => setPaymentMethod(e.target.value)} />
                    <span style={{ fontWeight: 600, fontSize: 15, color: "#2c3e50" }}>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Комментарий */}
            <div style={card}>
              <div style={sectionTitle}>Комментарий к заказу</div>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)}
                placeholder="Укажите дополнительные пожелания..."
                className={inp2} rows={3} style={{ resize: "none", width: "100%", boxSizing: "border-box" }} />
            </div>

            {/* Промокод */}
            <div style={card}>
              <div style={sectionTitle}>Промокод</div>
              <div style={{display: "flex", gap: 10, marginBottom: 8}}>
                <input type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Введите промокод" className={inp2} style={{flex: 1}} />
                <button onClick={applyPromoCode} style={{background: "#8b9dc3", color: "#fff", border: "none", borderRadius: 10, padding: "0 24px", fontWeight: 700, cursor: "pointer"}}>
                  Применить
                </button>
              </div>
              {promoDiscount > 0 && <p style={{fontSize: 14, color: "#22C55E", fontWeight: 600}}>✓ Скидка {promoDiscount}% применена</p>}
              {promoError && <p style={{fontSize: 14, color: "#8b9dc3"}}>{promoError}</p>}
              <p style={{fontSize: 12, color: "#AAA", marginTop: 8}}>Например: WELCOME15, SALE10</p>
            </div>
          </div>

          {/* Итог */}
          <div style={{ position: "sticky", top: 80 }}>
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.09)" }}>
              <div style={sectionTitle}>Ваш заказ</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                {cart.map((cartItem) => {
                  const item = items.find((i) => i.id === cartItem.itemId);
                  if (!item) return null;
                  return (
                    <div key={cartItem.itemId} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 10, overflow: "hidden", background: "#F8F8F8", flexShrink: 0 }}>
                        {item.photo && <img src={item.photo} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "#2c3e50", marginBottom: 2 }}>{item.name}</p>
                        <p style={{ fontSize: 12, color: "#a0aec0" }}>{cartItem.qty} × {cartItem.price} ₽</p>
                        <div className="flex items-center gap-3">
                          <button disabled={loading} aria-label={`Уменьшить ${item.name}`} className="min-h-11 min-w-11 rounded-lg border" onClick={() => updateCartQty(item.id, -1)}>−</button>
                          <span>{cartItem.qty}</span>
                          <button disabled={loading} aria-label={`Добавить ${item.name}`} className="min-h-11 min-w-11 rounded-lg border" onClick={() => updateCartQty(item.id, 1)}>+</button>
                        </div>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 14, color: "#2c3e50" }}>{cartItem.qty * cartItem.price} ₽</span>
                    </div>
                  );
                })}
              </div>

              <div style={{ borderTop: "1px solid #F0F0F0", paddingTop: 16, display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#a0aec0" }}>
                  <span>Сумма</span><span style={{ fontWeight: 600, color: "#2c3e50" }}>{cartTotal} ₽</span>
                </div>
                {bonusesToUse > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span style={{ color: "#a0aec0" }}>Списано бонусов</span><span style={{ fontWeight: 700, color: "#8b9dc3" }}>−{bonusesToUse} ₽</span>
                  </div>
                )}
                {promoDiscount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span style={{ color: "#a0aec0" }}>Промокод ({promoCode})</span><span style={{ fontWeight: 700, color: "#22C55E" }}>−{promoAmount} ₽</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid #F0F0F0" }}>
                  <span style={{ fontWeight: 800, fontSize: 18, color: "#2c3e50" }}>Итого</span>
                  <span style={{ fontWeight: 800, fontSize: 18, color: "#2c3e50" }}>{finalTotal} ₽</span>
                </div>
              </div>

              <button onClick={placeOrder} disabled={loading || !selectedAddress} style={{
                width: "100%", background: loading || !selectedAddress ? "#ccc" : "#8b9dc3",
                color: "#fff", border: "none", borderRadius: 12, padding: "14px 0",
                fontWeight: 800, fontSize: 16, cursor: loading || !selectedAddress ? "not-allowed" : "pointer"
              }}>
                {loading ? "Оформление..." : "Оформить заказ"}
              </button>
              <p style={{ marginTop: 10, textAlign: "center", fontSize: 12, color: "#AAA" }}>Время доставки: 45–60 минут</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
