"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Item {
  id: number; name: string; description: string; price: number;
  deliveryPrice?: number; photo: string; categoryId: number;
  labels: string; calories?: number;
}
interface Category { id: number; name: string; color: string; }

// Палитра из макета Figma (Homescreen 1:3)
const GREEN = "#14261F";      // фон
const GREEN_DARK = "#1C332B"; // карточки
const GREEN_NAV = "#0F1D18";  // нижняя навигация
const YELLOW = "#FFC01D";     // акцент
const WHITE = "#FFFFFF";
const GRAY = "#8FA89F";       // вторичный текст на зелёном

const CAT_FILTERS = ["All", "Burger", "Pizza", "Sandwich", "Drinks", "Dessert"];

export default function FigmaMenuPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [cart, setCart] = useState<{ itemId: number; qty: number; price: number }[]>([]);

  useEffect(() => {
    Promise.all([fetch("/api/categories"), fetch("/api/items")])
      .then(async ([cr, ir]) => {
        setCategories((await cr.json()).filter((c: Category) => c.name));
        setItems((await ir.json()).filter((i: Item) => i.name));
      })
      .catch(() => {});
    const saved = localStorage.getItem("cart");
    if (saved) setCart(JSON.parse(saved));
  }, []);

  const saveCart = (c: typeof cart) => { setCart(c); localStorage.setItem("cart", JSON.stringify(c)); };
  const addToCart = (item: Item) => {
    const ex = cart.find(c => c.itemId === item.id);
    if (ex) saveCart(cart.map(c => c.itemId === item.id ? { ...c, qty: c.qty + 1 } : c));
    else saveCart([...cart, { itemId: item.id, qty: 1, price: item.deliveryPrice ?? item.price }]);
  };

  const cartCount = cart.reduce((s, c) => s + c.qty, 0);
  const featured = items.slice(0, 4);
  const popular = items.slice(4, 8);

  return (
    <div style={{ background: GREEN, minHeight: "100vh", fontFamily: "'Inter', -apple-system, sans-serif", color: WHITE, paddingBottom: 96 }}>
      {/* Статус-бар */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 24px 0", fontSize: 13, fontWeight: 600 }}>
        <span>9:41</span>
        <span style={{ letterSpacing: 2 }}>●●●</span>
      </div>

      {/* Шапка */}
      <header style={{ padding: "18px 24px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, color: GRAY }}>Привет, гость 👋</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>Что закажем сегодня?</div>
          </div>
          <Link href="/profile" style={{ width: 44, height: 44, borderRadius: "50%", background: GREEN_DARK, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, textDecoration: "none", border: `1px solid rgba(255,255,255,0.08)` }}>
            👤
          </Link>
        </div>

        {/* Поиск */}
        <div style={{ marginTop: 18, position: "relative" }}>
          <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 15, opacity: 0.7 }}>🔍</span>
          <input
            placeholder="Найти блюдо..."
            style={{ width: "100%", boxSizing: "border-box", background: GREEN_DARK, border: `1px solid rgba(255,255,255,0.08)`, borderRadius: 14, padding: "13px 16px 13px 42px", fontSize: 14, color: WHITE, outline: "none" }}
          />
        </div>

        {/* Фильтры */}
        <div style={{ display: "flex", gap: 8, marginTop: 16, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 2 }}>
          {CAT_FILTERS.map(f => (
            <button key={f} onClick={() => setActiveFilter(f)} style={{
              flexShrink: 0, padding: "8px 18px", borderRadius: 20, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 700,
              background: activeFilter === f ? YELLOW : GREEN_DARK,
              color: activeFilter === f ? "#1A1A1A" : GRAY,
            }}>{f}</button>
          ))}
        </div>
      </header>

      {/* Карточки блюд */}
      <section style={{ padding: "20px 24px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {featured.map(item => (
            <div key={item.id} style={{ background: GREEN_DARK, borderRadius: 20, overflow: "hidden", border: `1px solid rgba(255,255,255,0.05)` }}>
              <div style={{ aspectRatio: "1", background: "#0E1C17", overflow: "hidden" }}>
                {item.photo
                  ? <img src={item.photo} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44 }}>🍽️</div>}
              </div>
              <div style={{ padding: "12px 14px 14px" }}>
                <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3, minHeight: 36, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>{item.name}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: YELLOW }}>{item.deliveryPrice ?? item.price} ₽</span>
                  <button onClick={() => addToCart(item)} style={{ width: 32, height: 32, borderRadius: 11, border: "none", background: YELLOW, color: "#1A1A1A", fontSize: 18, fontWeight: 800, cursor: "pointer" }}>+</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Popular */}
      <section style={{ padding: "26px 24px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Популярное</h2>
          <Link href="/menu" style={{ fontSize: 13, fontWeight: 600, color: YELLOW, textDecoration: "none" }}>Все →</Link>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {popular.map(item => (
            <div key={item.id} style={{ display: "flex", gap: 12, background: GREEN_DARK, borderRadius: 16, padding: 10, border: `1px solid rgba(255,255,255,0.06)`, alignItems: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: "#0f1f1b" }}>
                {item.photo
                  ? <img src={item.photo} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>🍽️</div>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
                <div style={{ fontSize: 12, color: GRAY, marginTop: 2 }}>{item.calories ? `${item.calories} ккал` : categories.find(c => c.id === item.categoryId)?.name ?? ""}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: YELLOW }}>{item.deliveryPrice ?? item.price} ₽</div>
                <button onClick={() => addToCart(item)} style={{ marginTop: 6, width: 28, height: 28, borderRadius: 9, border: "none", background: YELLOW, color: "#1A1A1A", fontSize: 16, fontWeight: 800, cursor: "pointer" }}>+</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Нижняя навигация */}
      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: GREEN_NAV, borderTop: `1px solid rgba(255,255,255,0.06)`, height: 68, display: "flex", alignItems: "center", zIndex: 100 }}>
        {[
          { icon: "🏠", label: "Главная", href: "/menu/figma", active: true },
          { icon: "🔍", label: "Поиск", href: "/menu", active: false },
          { icon: "🛒", label: `Корзина${cartCount ? ` (${cartCount})` : ""}`, href: "/menu?tab=cart", active: false },
          { icon: "👤", label: "Профиль", href: "/profile", active: false },
        ].map(n => (
          <Link key={n.label} href={n.href} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, textDecoration: "none", padding: "8px 0" }}>
            <span style={{ fontSize: 20 }}>{n.icon}</span>
            <span style={{ fontSize: 10, fontWeight: n.active ? 800 : 500, color: n.active ? YELLOW : GRAY }}>{n.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
