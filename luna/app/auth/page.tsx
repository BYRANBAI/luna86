"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AuthPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function normalizePhone(raw: string) {
    const digits = raw.replace(/\D/g, "");
    if (digits.length === 11 && digits.startsWith("8")) return "+7" + digits.slice(1);
    if (digits.length === 11 && digits.startsWith("7")) return "+" + digits;
    if (digits.length === 10) return "+7" + digits;
    return raw.trim();
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const r = await fetch("/api/auth/guest-login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: normalizePhone(phone), password }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error ?? "Ошибка входа"); return; }
      localStorage.setItem("guestToken", data.token);
      localStorage.setItem("guestId", String(data.guest.id));
      router.push("/profile");
    } finally { setLoading(false); }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, phone: normalizePhone(phone), password, email: email || undefined }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error ?? "Ошибка регистрации"); return; }
      localStorage.setItem("guestToken", data.token);
      localStorage.setItem("guestId", String(data.guest.id));
      router.push("/profile");
    } finally { setLoading(false); }
  }

  const inp = { style: { width: "100%", border: "1.5px solid #e3e8ef", borderRadius: 10, padding: "12px 16px", fontSize: 15, outline: "none", background: "#f8f9fb", color: "#2c3e50", boxSizing: "border-box" as const, marginBottom: 12 } };

  return (
    <div style={{ background: "#f5f7fa", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ background: "#8b9dc3", color: "#fff", fontSize: 12, padding: "6px 16px", display: "flex", justifyContent: "space-between" }}>
        <span>Приём заказов с 9:00 до 23:00</span>
        <span style={{ fontWeight: 700 }}>8 (999) 000-99-99</span>
      </div>
      <header style={{ background: "#fff", borderBottom: "1px solid #e3e8ef", padding: "0 16px", height: 56, display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/menu" style={{ fontWeight: 900, fontSize: 22, color: "#8b9dc3", textDecoration: "none" }}>ЛУНА</Link>
        <Link href="/menu" style={{ marginLeft: "auto", color: "#666", fontSize: 14, textDecoration: "none" }}>← Меню</Link>
      </header>

      <div style={{ maxWidth: 420, margin: "40px auto", padding: "0 16px" }}>
        <div style={{ background: "#fff", borderRadius: 20, padding: 32, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
          <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", border: "1.5px solid #e3e8ef", marginBottom: 24 }}>
            {(["login", "register"] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setError(""); }}
                style={{ flex: 1, padding: "11px 0", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer",
                  background: tab === t ? "#8b9dc3" : "#fff", color: tab === t ? "#fff" : "#666", transition: "all .15s" }}>
                {t === "login" ? "Войти" : "Регистрация"}
              </button>
            ))}
          </div>

          {tab === "login" ? (
            <form onSubmit={handleLogin}>
              <input {...inp} type="tel" placeholder="Телефон (+7 999 000-00-00)" value={phone} onChange={e => setPhone(e.target.value)} required />
              <input {...inp} type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} required />
              {error && <p style={{ color: "#8b9dc3", fontSize: 13, marginBottom: 12 }}>{error}</p>}
              <button type="submit" disabled={loading}
                style={{ width: "100%", background: "#8b9dc3", color: "#fff", border: "none", borderRadius: 10, padding: "13px 0", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
                {loading ? "Входим…" : "Войти"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <input {...inp} type="text" placeholder="Ваше имя" value={name} onChange={e => setName(e.target.value)} required />
              <input {...inp} type="tel" placeholder="Телефон (+7 999 000-00-00)" value={phone} onChange={e => setPhone(e.target.value)} required />
              <input {...inp} type="email" placeholder="Email (необязательно)" value={email} onChange={e => setEmail(e.target.value)} />
              <input {...inp} type="password" placeholder="Пароль (минимум 6 символов)" value={password} onChange={e => setPassword(e.target.value)} required />
              {error && <p style={{ color: "#8b9dc3", fontSize: 13, marginBottom: 12 }}>{error}</p>}
              <button type="submit" disabled={loading}
                style={{ width: "100%", background: "#8b9dc3", color: "#fff", border: "none", borderRadius: 10, padding: "13px 0", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
                {loading ? "Регистрируем…" : "Зарегистрироваться"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
