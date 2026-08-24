"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ItemModal from "@/app/components/ItemModal";

interface Modifier { id: number; name: string; price: number; }
interface Item {
  id: number; name: string; description: string; price: number;
  deliveryPrice?: number; photo: string; categoryId: number;
  labels: string; calories?: number; modifiers?: Modifier[];
}
interface Category { id: number; name: string; color: string; }
interface Guest { id: number; name: string; bonuses: number; }

const CAT_ICONS: Record<string, string> = {
  "Запечённые роллы": "🔥", "Классические роллы": "🍱", "Горячие роллы": "♨️",
  "Маки": "🍣", "Бургеры": "🍔", "Салаты": "🥗", "Супы": "🍜",
  "Кофе и напитки": "☕", "Завтраки": "🍳", "Основные блюда": "🍽️",
  "Десерты": "🍰", "Комбо": "🎁",
};

const PINK = "#E91E63";
const PINK_LIGHT = "#FCE4EC";
const DARK = "#212121";
const GRAY = "#757575";
const BG = "#1A1A1A"; // Темный фон

export default function MenuPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [activeCat, setActiveCat] = useState<number | null>(null);
  const [cart, setCart] = useState<{itemId:number;qty:number;price:number;name:string}[]>([]);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [search, setSearch] = useState("");
  const [modalItem, setModalItem] = useState<Item | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deliveryType, setDeliveryType] = useState<"delivery"|"pickup">("delivery");
  const sectionRefs = useRef<Record<number, HTMLElement | null>>({});
  const catBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData(); loadGuest();
    const saved = localStorage.getItem("cart");
    if (saved) setCart(JSON.parse(saved));
  }, []);

  const loadData = async () => {
    try {
      const [cr, ir] = await Promise.all([fetch("/api/categories"), fetch("/api/items")]);
      setCategories((await cr.json()).filter((c: Category) => c.name));
      setItems((await ir.json()).filter((i: Item) => i.name));
    } catch {}
  };

  const loadGuest = () => {
    const token = localStorage.getItem("guestToken");
    const guestId = localStorage.getItem("guestId");
    if (token && guestId)
      fetch(`/api/guests/${guestId}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(setGuest).catch(() => {});
  };

  const saveCart = (c: typeof cart) => { setCart(c); localStorage.setItem("cart", JSON.stringify(c)); };
  const addToCart = (item: Item) => {
    const ex = cart.find(c => c.itemId === item.id);
    if (ex) saveCart(cart.map(c => c.itemId === item.id ? {...c, qty: c.qty+1} : c));
    else saveCart([...cart, {itemId: item.id, qty: 1, price: item.deliveryPrice ?? item.price, name: item.name}]);
  };
  const removeFromCart = (itemId: number) => {
    const ex = cart.find(c => c.itemId === itemId);
    if (ex && ex.qty > 1) saveCart(cart.map(c => c.itemId === itemId ? {...c, qty: c.qty-1} : c));
    else saveCart(cart.filter(c => c.itemId !== itemId));
  };
  const handleAddToCartFromModal = (itemId: number, qty: number, _modifiers: number[], totalPrice: number) => {
    const existing = cart.findIndex(c => c.itemId === itemId);
    if (existing >= 0) {
      const updated = [...cart];
      updated[existing] = { ...updated[existing], qty: updated[existing].qty + qty };
      saveCart(updated);
    } else {
      const item = items.find(i => i.id === itemId);
      if (item) saveCart([...cart, { itemId, qty, price: totalPrice / qty, name: item.name }]);
    }
  };

  const scrollToCat = (catId: number) => {
    setActiveCat(catId);
    sectionRefs.current[catId]?.scrollIntoView({ behavior: "smooth", block: "start" });
    // Прокрутить кнопку в видимую область
    const btn = catBarRef.current?.querySelector(`[data-cat="${catId}"]`) as HTMLElement;
    btn?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  const openModal = async (item: Item) => {
    try {
      const modRes = await fetch(`/api/items/${item.id}/modifiers`);
      if (modRes.ok) {
        const modifiers = await modRes.json();
        setModalItem({ ...item, modifiers });
      } else setModalItem(item);
    } catch { setModalItem(item); }
    setModalOpen(true);
  };

  const cartTotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);
  const promoItems = items.filter(i => i.labels.includes("hit") || i.labels.includes("new")).slice(0, 10);
  const filteredItems = search ? items.filter(i => i.name.toLowerCase().includes(search.toLowerCase())) : null;

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: "'Inter', -apple-system, sans-serif", paddingBottom: 80 }}>

      {/* HEADER */}
      <header style={{ background: "#fff", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 0 #F0F0F0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "12px 16px" }}>

          {/* Logo + Top row */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
            {/* Logo */}
            <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <span style={{ fontSize: 24 }}>🌙</span>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: PINK, letterSpacing: 2 }}>LUNA</span>
            </Link>

            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12 }}>
            {/* Address */}
            <button style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0, flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 16 }}>📍</span>
              <div style={{ textAlign: "left", minWidth: 0 }}>
                <div style={{ fontSize: 12, color: GRAY }}>Доставка</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: DARK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  Укажите адрес ▾
                </div>
              </div>
            </button>

            {/* Profile / Auth */}
            {guest ? (
              <Link href="/profile" style={{ display: "flex", alignItems: "center", gap: 8, background: PINK_LIGHT, borderRadius: 12, padding: "6px 12px", textDecoration: "none" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: PINK, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13 }}>
                  {guest.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 12, color: GRAY }}>Профиль</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: PINK }}>🎁 {guest.bonuses} бонусов</div>
                </div>
              </Link>
            ) : (
              <Link href="/auth" style={{ background: PINK, color: "#fff", borderRadius: 12, padding: "8px 16px", fontSize: 13, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>
                Войти
              </Link>
            )}
            </div>
          </div>

          {/* Delivery / Pickup toggle */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button onClick={() => setDeliveryType("delivery")} style={{
              flex: 1, padding: "8px 0", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14,
              background: deliveryType === "delivery" ? PINK : "#F5F5F5",
              color: deliveryType === "delivery" ? "#fff" : GRAY,
            }}>🛵 Доставка</button>
            <button onClick={() => setDeliveryType("pickup")} style={{
              flex: 1, padding: "8px 0", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14,
              background: deliveryType === "pickup" ? PINK : "#F5F5F5",
              color: deliveryType === "pickup" ? "#fff" : GRAY,
            }}>🏃 Самовывоз</button>
          </div>

          {/* Search */}
          <div style={{ position: "relative" }}>
            <input
              type="text" placeholder="🔍 Найти блюдо..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", border: "none", borderRadius: 12, padding: "10px 16px", fontSize: 14, background: "#F5F5F5", color: DARK, outline: "none", boxSizing: "border-box" }}
            />
          </div>
        </div>

        {/* Category tabs */}
        {!search && (
          <div ref={catBarRef} style={{ overflowX: "auto", scrollbarWidth: "none", borderTop: "1px solid #F0F0F0" }}>
            <div style={{ display: "flex", gap: 0, padding: "0 8px", height: 44, alignItems: "center", width: "max-content" }}>
              {categories.map(cat => (
                <button key={cat.id} data-cat={cat.id} onClick={() => scrollToCat(cat.id)}
                  style={{
                    padding: "6px 16px", border: "none", background: "none", cursor: "pointer",
                    fontSize: 13, fontWeight: activeCat === cat.id ? 700 : 500,
                    color: activeCat === cat.id ? PINK : GRAY,
                    borderBottom: "none",
                    whiteSpace: "nowrap", transition: "all 0.2s",
                  }}>
                  {CAT_ICONS[cat.name] ?? "🍴"} {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px" }}>

        {/* Баннер */}
        {!search && (
          <div style={{
            borderRadius: 20, margin: "16px 0",
            background: "linear-gradient(135deg, #E91E63 0%, #C2185B 100%)",
            padding: "24px 20px", position: "relative", overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ zIndex: 1 }}>
              <div style={{ background: "rgba(255,255,255,0.25)", display: "inline-block", padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
                АКЦИЯ
              </div>
              <div style={{ color: "#fff", fontSize: 22, fontWeight: 900, lineHeight: 1.2, marginBottom: 4 }}>
                Бесплатная доставка<br />от 1 000 ₽
              </div>
              <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>Заказывайте онлайн</div>
            </div>
            <div style={{ fontSize: 70, flexShrink: 0, marginLeft: 16 }}>🛵</div>
            {/* декоративные круги */}
            <div style={{ position: "absolute", right: -30, top: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
            <div style={{ position: "absolute", right: 40, bottom: -40, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
          </div>
        )}

        {/* Хиты и новинки */}
        {!search && promoItems.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 18, color: "#fff" }}>🔥 Хиты и новинки</div>
            </div>
            <div style={{ display: "flex", gap: 12, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 4 }}>
              {promoItems.map(item => (
                <div key={item.id} onClick={() => openModal(item)}
                  style={{ flexShrink: 0, width: 140, borderRadius: 16, overflow: "hidden", background: "#252525", boxShadow: "0 2px 12px rgba(0,0,0,0.3)", cursor: "pointer" }}>
                  <div style={{ height: 100, background: "#1A1A1A", overflow: "hidden", position: "relative" }}>
                    {item.photo
                      ? <img src={item.photo} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>🍱</div>
                    }
                    {item.labels.includes("hit") && (
                      <span style={{ position: "absolute", top: 6, left: 6, background: PINK, color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4 }}>ХИТ</span>
                    )}
                    {item.labels.includes("new") && (
                      <span style={{ position: "absolute", top: 6, left: item.labels.includes("hit") ? 42 : 6, background: "#4CAF50", color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4 }}>NEW</span>
                    )}
                  </div>
                  <div style={{ padding: "8px 10px 10px" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 4, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>{item.name}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: PINK }}>{item.deliveryPrice ?? item.price} ₽</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Поиск */}
        {filteredItems && (
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#fff", marginBottom: 16 }}>Результаты поиска</div>
            {filteredItems.length === 0
              ? <div style={{ textAlign: "center", color: "#AAA", padding: "40px 0" }}>Ничего не найдено</div>
              : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                  {filteredItems.map(item => <ItemCard key={item.id} item={item} cart={cart} addToCart={addToCart} removeFromCart={removeFromCart} onOpenModal={() => openModal(item)} />)}
                </div>
            }
          </div>
        )}

        {/* Меню по категориям */}
        {!filteredItems && categories.map(cat => {
          const catItems = items.filter(i => i.categoryId === cat.id);
          if (!catItems.length) return null;
          return (
            <section key={cat.id} ref={el => { sectionRefs.current[cat.id] = el; }} style={{ marginBottom: 32, scrollMarginTop: 130 }}>
              <h2 style={{ fontWeight: 800, fontSize: 20, color: "#fff", margin: "0 0 14px" }}>
                {CAT_ICONS[cat.name] ?? "🍴"} {cat.name}
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                {catItems.map(item => <ItemCard key={item.id} item={item} cart={cart} addToCart={addToCart} removeFromCart={removeFromCart} onOpenModal={() => openModal(item)} />)}
              </div>
            </section>
          );
        })}
      </div>

      {/* BOTTOM CART BAR */}
      {cartCount > 0 && (
        <div style={{ position: "fixed", bottom: 70, left: 0, right: 0, zIndex: 90, padding: "0 16px", display: "block" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <button onClick={() => router.push("/checkout")}
              style={{
                width: "100%", maxWidth: 400, margin: "0 auto", display: "flex",
                background: PINK, color: "#fff", border: "none", borderRadius: 16,
                padding: "16px 20px", fontSize: 16, fontWeight: 700, cursor: "pointer",
                alignItems: "center", justifyContent: "space-between",
                boxShadow: "0 4px 24px rgba(233,30,99,0.4)",
              }}>
              <span style={{ background: "rgba(255,255,255,0.25)", borderRadius: 8, padding: "2px 10px", fontSize: 14, fontWeight: 800 }}>{cartCount}</span>
              <span>Перейти в корзину</span>
              <span style={{ fontWeight: 800 }}>{cartTotal} ₽</span>
            </button>
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#252525", borderTop: "1px solid #333", zIndex: 100, height: 60 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", height: "100%", display: "flex", alignItems: "center" }}>
          {[
            { icon: "🏠", label: "Меню", href: "/menu", active: true },
            { icon: "🛒", label: "Корзина", href: "/checkout", active: false },
            { icon: "📋", label: "Заказы", href: "/orders/history", active: false },
            { icon: "👤", label: "Профиль", href: guest ? "/profile" : "/auth", active: false },
          ].map(nav => (
            <Link key={nav.label} href={nav.href} style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              textDecoration: "none", gap: 2, padding: "8px 0",
            }}>
              <span style={{ fontSize: 20 }}>{nav.icon}</span>
              <span style={{ fontSize: 10, fontWeight: nav.active ? 700 : 500, color: nav.active ? PINK : "#AAA" }}>{nav.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* MODAL */}
      <ItemModal item={modalItem} isOpen={modalOpen} onClose={() => { setModalItem(null); setModalOpen(false); }} onAddToCart={handleAddToCartFromModal} />
    </div>
  );
}

function ItemCard({ item, cart, addToCart, removeFromCart, onOpenModal }: {
  item: Item; cart: {itemId:number;qty:number}[]; addToCart: (i: Item) => void; removeFromCart: (id: number) => void; onOpenModal: () => void;
}) {
  const inCart = cart.find(c => c.itemId === item.id);

  return (
    <div onClick={onOpenModal} style={{
      background: "#252525", borderRadius: 16, overflow: "hidden",
      boxShadow: "0 2px 12px rgba(0,0,0,0.3)", cursor: "pointer",
      display: "flex", flexDirection: "column",
      transition: "transform 0.15s, box-shadow 0.15s",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.5)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.3)"; }}
    >
      {/* Фото */}
      <div style={{ position: "relative", aspectRatio: "4/3", background: "#1A1A1A", overflow: "hidden" }}>
        {item.photo
          ? <img src={item.photo} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>🍱</div>
        }
        {/* Бейджи */}
        <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
          {item.labels.includes("hit") && <span style={{ background: PINK, color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4 }}>ХИТ</span>}
          {item.labels.includes("new") && <span style={{ background: "#4CAF50", color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4 }}>NEW</span>}
          {item.labels.includes("spicy") && <span style={{ background: "#FF5722", color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4 }}>🌶</span>}
        </div>
      </div>

      {/* Контент */}
      <div style={{ padding: "10px 12px 12px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "#fff", marginBottom: 4, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>
          {item.name}
        </div>
        <div style={{ fontSize: 11, color: "#AAA", marginBottom: 8, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>
          {item.description}
        </div>
        {item.calories && <div style={{ fontSize: 10, color: "#777", marginBottom: 8 }}>{item.calories} ккал</div>}

        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 800, fontSize: 16, color: "#fff" }}>{item.deliveryPrice ?? item.price} ₽</span>

          {inCart ? (
            <div onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(233,30,99,0.15)", borderRadius: 10, padding: "3px 6px" }}>
              <button onClick={e => { e.stopPropagation(); removeFromCart(item.id); }}
                style={{ width: 26, height: 26, borderRadius: 7, border: "none", background: "#333", color: PINK, fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }}>−</button>
              <span style={{ fontWeight: 800, fontSize: 14, minWidth: 18, textAlign: "center", color: "#fff" }}>{inCart.qty}</span>
              <button onClick={e => { e.stopPropagation(); addToCart(item); }}
                style={{ width: 26, height: 26, borderRadius: 7, border: "none", background: PINK, color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
            </div>
          ) : (
            <button onClick={e => { e.stopPropagation(); addToCart(item); }}
              style={{ width: 32, height: 32, borderRadius: 10, border: "none", background: PINK, color: "#fff", fontSize: 18, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(233,30,99,0.3)" }}>
              +
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
