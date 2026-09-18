"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./GuestTabs.module.css";

export type GuestTab = "menu" | "cart" | "orders" | "profile";
export interface CartLine { itemId: number; name: string; qty: number; price: number; }
interface Guest { name: string; phone: string; email?: string; bonuses: number; }
interface Order { id: number; number: string; status: string; total: number; createdAt: string; }
interface Address { id: number; street: string; building: string; apartment?: string; }
interface Bonus { id: number; reason: string; amount: number; }
const card = { padding: 20, borderRadius: 16, background: "#252525", marginBottom: 12 };
const action = { padding: "12px 18px", borderRadius: 12, border: "none", background: "#E91E63", color: "white", cursor: "pointer", display: "inline-block", textDecoration: "none" };
const statuses: Record<string, string> = { NEW: "Принят", CONFIRMED: "Подтверждён", COOKING: "Готовится", READY: "Готов", DELIVERY_ASSIGNED: "Курьер назначен", IN_DELIVERY: "В пути", DELIVERING: "В пути", DELIVERED: "Доставлен", DONE: "Завершён", CANCELLED: "Отменён" };
const inp = { width: "100%", border: "1px solid #333", borderRadius: 12, padding: "12px 14px", fontSize: 15, outline: "none", background: "#1A1A1A", color: "#fff", boxSizing: "border-box" as const, marginBottom: 10 };

function normalizePhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("8")) return "+7" + digits.slice(1);
  if (digits.length === 11 && digits.startsWith("7")) return "+" + digits;
  if (digits.length === 10) return "+7" + digits;
  return raw.trim();
}

function GuestAuthForm({ onSuccess }: { onSuccess: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const url = mode === "login" ? "/api/auth/guest-login" : "/api/auth/register";
      const body = mode === "login"
        ? { phone: normalizePhone(phone), password }
        : { name, phone: normalizePhone(phone), password, email: email || undefined };
      const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const data = await r.json();
      if (!r.ok) { setError(data.error ?? "Ошибка"); return; }
      localStorage.setItem("guestToken", data.token);
      localStorage.setItem("guestId", String(data.guest.id));
      onSuccess();
    } finally { setLoading(false); }
  }

  return (
    <div style={card}>
      <div style={{ display: "flex", borderRadius: 12, overflow: "hidden", border: "1px solid #333", marginBottom: 16 }}>
        {(["login", "register"] as const).map(t => (
          <button key={t} type="button" onClick={() => { setMode(t); setError(""); }}
            style={{ flex: 1, padding: "10px 0", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer",
              background: mode === t ? "#E91E63" : "#1A1A1A", color: mode === t ? "#fff" : "#bbb" }}>
            {t === "login" ? "Войти" : "Регистрация"}
          </button>
        ))}
      </div>
      <form onSubmit={submit}>
        {mode === "register" && <input style={inp} type="text" placeholder="Ваше имя" value={name} onChange={e => setName(e.target.value)} required />}
        <input style={inp} type="tel" placeholder="Телефон (+7 999 000-00-00)" value={phone} onChange={e => setPhone(e.target.value)} required />
        {mode === "register" && <input style={inp} type="email" placeholder="Email (необязательно)" value={email} onChange={e => setEmail(e.target.value)} />}
        <input style={inp} type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} required />
        {error && <p style={{ color: "#E91E63", fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ ...action, width: "100%", opacity: loading ? 0.7 : 1 }}>
          {loading ? "Подождите…" : mode === "login" ? "Войти" : "Зарегистрироваться"}
        </button>
      </form>
    </div>
  );
}

export function CartPanel({ cart, onChange, onMenu }: { cart: CartLine[]; onChange: (cart: CartLine[]) => void; onMenu: () => void }) {
  const quantity = (id: number, delta: number) => onChange(cart.map(line => line.itemId === id ? { ...line, qty: line.qty + delta } : line).filter(line => line.qty > 0));
  return <section className={styles.panel} style={{ color: "#fff", padding: "24px 0" }} aria-label="Корзина">
    <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>Корзина</h1>
    {!cart.length ? <div style={card}><p style={{ marginBottom: 16 }}>Здесь пока пусто. Добавьте любимые блюда.</p><button style={action} onClick={onMenu}>Выбрать блюда</button></div> : <>
      {cart.map(line => <div key={line.itemId} style={{ ...card, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
        <div style={{ flex: "1 1 160px" }}><strong>{line.name}</strong><p style={{ color: "#bbb", marginTop: 6 }}>{line.price * line.qty} ₽</p></div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button style={{ ...action, minWidth: 44 }} aria-label={`Уменьшить ${line.name}`} onClick={() => quantity(line.itemId, -1)}>−</button>
          <span aria-live="polite">{line.qty}</span>
          <button style={{ ...action, minWidth: 44 }} aria-label={`Добавить ${line.name}`} onClick={() => quantity(line.itemId, 1)}>+</button>
          <button style={{ ...action, background: "transparent", color: "#ccc" }} aria-label={`Удалить ${line.name}`} onClick={() => onChange(cart.filter(x => x.itemId !== line.itemId))}>Удалить</button>
        </div>
      </div>)}
      <div style={card}><p style={{ fontWeight: 800, fontSize: 20, marginBottom: 20 }}>Итого: {cart.reduce((sum, line) => sum + line.qty * line.price, 0)} ₽</p><Link style={action} href="/checkout">Оформить заказ</Link></div>
    </>}
  </section>;
}

export function AccountPanel({ tab, onLogout, onLogin }: { tab: "orders" | "profile"; onLogout: () => void; onLogin?: () => void }) {
  const [data, setData] = useState<{ guest: Guest; orders: Order[]; addresses: Address[]; bonuses: Bonus[] } | null>(null);
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      const token = localStorage.getItem("guestToken");
      const id = localStorage.getItem("guestId");
      if (!token || !id) { setNeedsLogin(true); return; }
      setError(""); setNeedsLogin(false); setData(null);
      try {
        const paths = tab === "orders" ? [`/api/guests/${id}`, `/api/guests/${id}/orders`] : [`/api/guests/${id}`, `/api/guests/${id}/addresses`, `/api/guests/${id}/bonuses`];
        const responses = await Promise.all(paths.map(path => fetch(path, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })));
        if (responses.some(r => r.status === 401 || r.status === 403)) { setNeedsLogin(true); return; }
        if (responses.some(r => !r.ok)) throw new Error("Не удалось загрузить данные. Попробуйте ещё раз.");
        const values = await Promise.all(responses.map(r => r.json()));
        if (!controller.signal.aborted) setData({ guest: values[0], orders: tab === "orders" ? values[1] : [], addresses: tab === "profile" ? values[1] : [], bonuses: tab === "profile" ? values[2] : [] });
      } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Ошибка загрузки"); }
    }
    void load();
    return () => controller.abort();
  }, [tab, attempt]);
  return <section className={styles.panel} style={{ color: "white", padding: "24px 0" }} aria-label={tab === "orders" ? "Заказы" : "Профиль"}>
    <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>{tab === "orders" ? "Мои заказы" : "Профиль"}</h1>
    {needsLogin ? <GuestAuthForm onSuccess={() => { setNeedsLogin(false); setAttempt(x => x + 1); onLogin?.(); }} /> : error ? <div style={card} role="alert"><p style={{ marginBottom: 16 }}>{error}</p><button style={action} onClick={() => setAttempt(x => x + 1)}>Повторить</button></div> : !data ? <p role="status">Загрузка…</p> : tab === "orders" ? <>
      {!data.orders.length && <p style={card}>У вас пока нет заказов.</p>}
      {data.orders.map(order => <Link key={order.id} href={`/orders/${order.id}`} style={{ ...card, display: "flex", gap: 16, justifyContent: "space-between", color: "inherit", textDecoration: "none" }}><div><strong>№{order.number}</strong><p>{statuses[order.status] ?? order.status}</p><small style={{ color: "#bbb" }}>{new Date(order.createdAt).toLocaleString("ru-RU")}</small></div><strong style={{ whiteSpace: "nowrap" }}>{order.total} ₽</strong></Link>)}
    </> : <>
      <div style={card}><h2 style={{ fontWeight: 700 }}>{data.guest.name}</h2><p>{data.guest.phone}</p>{data.guest.email && <p>{data.guest.email}</p>}<p style={{ color: "#efd699", marginTop: 12 }}>{data.guest.bonuses} бонусов</p></div>
      <h2 style={{ margin: "24px 0 12px", fontWeight: 700 }}>Адреса</h2>
      {!data.addresses.length && <p style={card}>Адрес можно добавить при оформлении заказа.</p>}
      {data.addresses.map(address => <p key={address.id} style={card}>{address.street}, {address.building}{address.apartment ? `, кв. ${address.apartment}` : ""}</p>)}
      <h2 style={{ margin: "24px 0 12px", fontWeight: 700 }}>История бонусов</h2>
      {!data.bonuses.length && <p style={card}>История бонусов пуста.</p>}
      {data.bonuses.map(bonus => <p key={bonus.id} style={card}>{bonus.reason}: {bonus.amount > 0 ? "+" : ""}{bonus.amount}</p>)}
      <button style={{ ...action, background: "#333", marginTop: 12 }} onClick={() => { localStorage.removeItem("guestToken"); localStorage.removeItem("guestId"); setNeedsLogin(true); setData(null); onLogout(); }}>Выйти</button>
    </>}
  </section>;
}
