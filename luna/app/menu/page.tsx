"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import styles from "./menu.module.css";
import ItemModal from "@/app/components/ItemModal";
import MapModal from "@/app/components/MapModal";
import PromoCarousel from "@/app/components/PromoCarousel";
import { AccountPanel, CartPanel, type GuestTab } from "@/app/components/GuestTabs";
import { CAFE_INFO } from "@/lib/cafe";
import { THEME } from "@/lib/theme";
import { guestFetch } from "@/lib/guest-session";

interface Modifier { id: number; name: string; price: number; }
interface ModifierGroup { id: number; name: string; min: number; max: number; options: Modifier[]; }
interface Item {
  id: number; name: string; description: string; price: number;
  deliveryPrice?: number; photo: string; categoryId: number;
  labels: string; calories?: number; modifiers?: Modifier[]; modifierGroups?: ModifierGroup[];
}
interface Category { id: number; name: string; color: string; }
interface Guest { id: number; name: string; bonuses: number; }

const CAT_ICONS: Record<string, string> = {
  "Запечённые роллы": "🔥", "Классические роллы": "🍱", "Горячие роллы": "♨️",
  "Маки": "🍣", "Бургеры": "🍔", "Салаты": "🥗", "Супы": "🍜",
  "Пицца": "🍕", "Узбекская кухня": "🍲",
  "Кофе и напитки": "☕", "Завтраки": "🍳", "Основные блюда": "🍽️",
  "Десерты": "🍰", "Комбо": "🎁",
};

const ACCENT = THEME.orange;
const BG = THEME.bg;

// Функция генерации градиентов для placeholder изображений
const getPlaceholderGradient = (name: string) => {
  // Тёплые заглушки в тон кремово-оранжевой палитре — для блюд без фото
  const gradients = [
    "linear-gradient(135deg, #F7EFE3 0%, #E9D8BE 100%)",
    "linear-gradient(135deg, #FCE9D2 0%, #F3C99A 100%)",
    "linear-gradient(135deg, #F4EDE2 0%, #DFCBB0 100%)",
    "linear-gradient(135deg, #FBE3C8 0%, #EFBE8C 100%)",
    "linear-gradient(135deg, #F8F1E6 0%, #E4D3BB 100%)",
    "linear-gradient(135deg, #FDEEDC 0%, #F2C79B 100%)",
  ];
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
};

export default function MenuPage() {
  const [tab, setTab] = useState<GuestTab>("menu");
  const currentTab = useRef<GuestTab>("menu");
  const scrollPositions = useRef<Record<GuestTab, number>>({ menu: 0, cart: 0, orders: 0, profile: 0 });
  function activateTab(next: GuestTab) {
    scrollPositions.current[currentTab.current] = window.scrollY;
    currentTab.current = next;
    setTab(next);
    requestAnimationFrame(() => window.scrollTo(0, scrollPositions.current[next]));
  }
  function selectTab(next: GuestTab) {
    if (next === currentTab.current) return;
    window.history.pushState(null, "", next === "menu" ? "/menu" : `/menu?tab=${next}`);
    activateTab(next);
  }
  useEffect(() => {
    function syncTab() {
      const value = new URLSearchParams(window.location.search).get("tab");
      activateTab(value === "cart" || value === "orders" || value === "profile" ? value : "menu");
    }
    syncTab();
    window.addEventListener("popstate", syncTab);
    return () => window.removeEventListener("popstate", syncTab);
  }, []);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [activeCat, setActiveCat] = useState<number | null>(null);
  const [cart, setCart] = useState<{itemId:number;qty:number;price:number;name:string}[]>([]);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [search, setSearch] = useState("");
  const [modalItem, setModalItem] = useState<Item | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const sectionRefs = useRef<Record<number, HTMLElement | null>>({});
  const catBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData(); loadGuest();
    const saved = localStorage.getItem("cart");
    if (saved) setCart(JSON.parse(saved));
  }, []);

  async function loadData() {
    try {
      const [cr, ir] = await Promise.all([fetch("/api/categories"), fetch("/api/items")]);
      setCategories((await cr.json()).filter((c: Category) => c.name));
      setItems((await ir.json()).filter((i: Item) => i.name));
    } catch {} finally {
      setLoading(false);
    }
  }

  function loadGuest() {
    const guestId = localStorage.getItem("guestId");
    if (!guestId) return;
    guestFetch(`/api/guests/${guestId}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setGuest)
      .catch(() => setGuest(null));
  }

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
        const { modifiers, groups } = await modRes.json();
        setModalItem({ ...item, modifiers, modifierGroups: groups });
      } else setModalItem(item);
    } catch { setModalItem(item); }
    setModalOpen(true);
  };

  const cartTotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);
  const promoItems = items.filter(i => i.labels.includes("hit") || i.labels.includes("new")).slice(0, 10);
  // Категории без доступных гостю позиций не показываем
  const visibleCats = categories.filter(c => items.some(i => i.categoryId === c.id));
  const filteredItems = search ? items.filter(i => i.name.toLowerCase().includes(search.toLowerCase())) : null;

  return (
    <div className={styles.page} style={{ background: BG, minHeight: "100vh", fontFamily: "'Inter', -apple-system, sans-serif" }}>

      <header className={styles.header}>
        <div className={styles.hoursBar}>
          <span className={styles.hoursFull}>{CAFE_INFO.hoursShort}</span>
          <span className={styles.hoursMobile}>
            <span>{CAFE_INFO.hoursWeekday}</span>
            <span>{CAFE_INFO.hoursWeekend}</span>
          </span>
        </div>
        <div className={styles.headerInner}>
          <div className={styles.headerTop}>
            <Link href="/" className={styles.logo}>
              <span className={styles.logoMark}>🌙</span>
              <span className={styles.logoText}>LUNA</span>
            </Link>
            <div className={styles.contactFrame}>
              <button type="button" className={styles.placeBtn} onClick={() => setShowMap(true)} aria-label={`Мы здесь, ${CAFE_INFO.address}`}>
                <span className={styles.placePin} aria-hidden="true">📍</span>
                <span className={styles.placeText}>
                  <b>{CAFE_INFO.address.replace(", г. Покачи", "")}</b>
                </span>
              </button>
              <a href={`tel:${CAFE_INFO.phoneHref}`} className={styles.phoneBtn} aria-label={`Позвонить ${CAFE_INFO.phone}`}>
                <span className={styles.placePin} aria-hidden="true">📞</span>
                <span className={styles.placeText}>
                  <b>{CAFE_INFO.phone}</b>
                </span>
              </a>
            </div>
            {!guest && (
              <button type="button" className={styles.loginTab} onClick={() => selectTab("profile")}>
                <span className={styles.placePin} aria-hidden="true">👤</span>
                <span className={styles.placeText}>
                  <b>Вход</b>
                </span>
              </button>
            )}
          </div>
          <div className={styles.modeSearch}>
            <input className={styles.search} type="text" placeholder="🔍 Найти блюдо..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        {!search && (
          <div ref={catBarRef} className={styles.cats}>
            {visibleCats.map(cat => (
              <button key={cat.id} type="button" data-cat={cat.id} data-on={activeCat === cat.id} onClick={() => scrollToCat(cat.id)}>
                {CAT_ICONS[cat.name] ?? "🍴"} {cat.name}
              </button>
            ))}
          </div>
        )}
      </header>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px" }}>
        <div inert={tab !== "menu"}>
        {/* Акции */}
        {!search && <PromoCarousel onTab={selectTab} onMap={() => setShowMap(true)} />}

        {/* Хиты и новинки */}
        {!search && promoItems.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 20, color: THEME.text, letterSpacing: "-0.03em" }}>Хиты и новинки</div>
            </div>
            <div className={styles.productGrid}>
              {promoItems.map((item, index) => (
                <div key={item.id} className={styles.card} onClick={() => openModal(item)} style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}>
                  <div style={{ height: 100, background: THEME.well, overflow: "hidden", position: "relative" }}>
                    {item.photo ? (
                      <img src={item.photo} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{
                        width: "100%",
                        height: "100%",
                        background: getPlaceholderGradient(item.name),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <span style={{ fontSize: 36, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}>🍱</span>
                      </div>
                    )}
                    {item.labels.includes("hit") && (
                      <span style={{ position: "absolute", top: 6, left: 6, background: ACCENT, color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4 }}>ХИТ</span>
                    )}
                    {item.labels.includes("new") && (
                      <span style={{ position: "absolute", top: 6, left: item.labels.includes("hit") ? 42 : 6, background: "#4CAF50", color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4 }}>NEW</span>
                    )}
                  </div>
                  <div style={{ padding: "8px 10px 10px" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: THEME.text, marginBottom: 4, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>{item.name}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: THEME.text }}>{item.deliveryPrice ?? item.price} ₽</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Поиск */}
        {filteredItems && (
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: THEME.text, marginBottom: 16 }}>Результаты поиска</div>
            {filteredItems.length === 0
              ? <div style={{ textAlign: "center", color: THEME.muted, padding: "40px 0" }}>Ничего не найдено</div>
              : <div className={styles.productGrid}>
                  {filteredItems.map((item, index) => <ItemCard key={item.id} item={item} index={index} cart={cart} addToCart={addToCart} removeFromCart={removeFromCart} onOpenModal={() => openModal(item)} />)}
                </div>
            }
          </div>
        )}

        {/* Скелетоны на время загрузки */}
        {loading && !filteredItems && (
          <div className={styles.productGrid} aria-hidden="true" style={{ marginTop: 24 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={styles.skeletonCard}>
                <div className={styles.skeletonPhoto} />
                <div className={styles.skeletonBody}>
                  <div className={styles.skeletonLine} />
                  <div className={styles.skeletonLine} />
                  <div className={styles.skeletonLine} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Меню по категориям */}
        {!filteredItems && visibleCats.map(cat => {
          const catItems = items.filter(i => i.categoryId === cat.id);
          if (!catItems.length) return null;
          return (
            <section key={cat.id} ref={el => { sectionRefs.current[cat.id] = el; }} style={{ marginBottom: 32, scrollMarginTop: 130 }}>
              <h2 style={{ fontWeight: 800, fontSize: 22, color: THEME.text, margin: "0 0 14px", letterSpacing: "-0.03em" }}>
                {CAT_ICONS[cat.name] ?? "🍴"} {cat.name}
              </h2>
              <div className={styles.productGrid}>
                {catItems.map((item, index) => <ItemCard key={item.id} item={item} index={index} cart={cart} addToCart={addToCart} removeFromCart={removeFromCart} onOpenModal={() => openModal(item)} />)}
              </div>
            </section>
          );
        })}
        </div>
        {tab !== "menu" && <div role="region" aria-label="Панель вкладки" style={{ position: "fixed", left: 12, right: 12, bottom: 60, maxHeight: "70dvh", overflowY: "auto", zIndex: 110, maxWidth: 760, margin: "0 auto", padding: "0 20px 20px", borderRadius: "24px 24px 0 0", background: THEME.card, border: `1px solid ${THEME.border}`, boxShadow: "0 -12px 40px rgba(0,0,0,0.12)" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", position: "sticky", top: 0, background: THEME.card, paddingTop: 12 }}><button aria-label="Закрыть панель" onClick={() => selectTab("menu")} style={{ width: 44, height: 44, border: "none", borderRadius: 12, background: THEME.bg, color: THEME.text, cursor: "pointer", fontSize: 24 }}>×</button></div>
          {tab === "cart" ? <CartPanel cart={cart} onChange={saveCart} onMenu={() => selectTab("menu")} /> : <AccountPanel key={tab} tab={tab} onLogout={() => setGuest(null)} onLogin={loadGuest} />}
        </div>}
      </div>

      {/* BOTTOM CART BAR */}
      {tab === "menu" && cartCount > 0 && (
        <div style={{ position: "fixed", bottom: 70, left: 0, right: 0, zIndex: 90, padding: "0 16px", display: "block" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <button className={styles.cartBtn} onClick={() => selectTab("cart")}>
              <span className={styles.cartCount}>{cartCount}</span>
              <span>Перейти в корзину</span>
              <span style={{ fontWeight: 800 }}>{cartTotal} ₽</span>
            </button>
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: THEME.card, borderTop: `1px solid ${THEME.border}`, zIndex: 100, height: 60 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", height: "100%", display: "flex", alignItems: "center" }}>
          {([
            { icon: "🏠", label: "Меню", key: "menu" },
            { icon: "🛒", label: "Корзина", key: "cart" },
            { icon: "📋", label: "Заказы", key: "orders" },
            { icon: "👤", label: "Профиль", key: "profile" },
          ] as const).map(nav => (
            <button key={nav.key} className={styles.navBtn} aria-pressed={tab === nav.key} onClick={() => selectTab(nav.key)}>
              <span aria-hidden="true" style={{ fontSize: 20 }}>{nav.icon}</span>
              <span style={{ fontSize: 10, fontWeight: tab === nav.key ? 700 : 500, color: tab === nav.key ? ACCENT : THEME.muted }}>{nav.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* MODAL */}
      <ItemModal item={modalItem} isOpen={modalOpen} onClose={() => { setModalItem(null); setModalOpen(false); }} onAddToCart={handleAddToCartFromModal} />
      <MapModal isOpen={showMap} onClose={() => setShowMap(false)} />
    </div>
  );
}

function ItemCard({ item, index = 0, cart, addToCart, removeFromCart, onOpenModal }: {
  item: Item; index?: number; cart: {itemId:number;qty:number}[]; addToCart: (i: Item) => void; removeFromCart: (id: number) => void; onOpenModal: () => void;
}) {
  const inCart = cart.find(c => c.itemId === item.id);
  const price = item.deliveryPrice ?? item.price;

  return (
    <div
      className={styles.card}
      role="button"
      tabIndex={0}
      aria-label={item.name}
      onClick={onOpenModal}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpenModal(); } }}
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      {/* Фото */}
      <div className={styles.cardPhoto}>
        {item.photo ? (
          <img src={item.photo} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{
            width: "100%",
            height: "100%",
            background: getPlaceholderGradient(item.name),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative"
          }}>
            <span style={{ fontSize: 48, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}>🍱</span>
            <div style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15) 0%, transparent 60%)"
            }} />
          </div>
        )}
        {/* Бейджи */}
        <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
          {item.labels.includes("hit") && <span style={{ background: ACCENT, color: "#fff", fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 6 }}>ХИТ</span>}
          {item.labels.includes("new") && <span style={{ background: "#4CAF50", color: "#fff", fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 6 }}>NEW</span>}
          {item.labels.includes("spicy") && <span style={{ background: "#FF5722", color: "#fff", fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 6 }}>🌶</span>}
        </div>
      </div>

      {/* Контент */}
      <div style={{ padding: "14px 14px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: THEME.text, marginBottom: 6, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>
          {item.name}
        </div>
        <div style={{ fontSize: 13, color: THEME.muted, marginBottom: 10, lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>
          {item.description}
        </div>
        {item.calories && <div style={{ fontSize: 12, color: THEME.muted, marginBottom: 10 }}>{item.calories} ккал</div>}

        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          {price > 0
            ? <span style={{ fontWeight: 800, fontSize: 19, color: THEME.text }}>{price} ₽</span>
            : <span style={{ fontWeight: 700, fontSize: 13, color: THEME.muted }}>Цена уточняется</span>}

          {price === 0 ? null : inCart ? (
            <div className={styles.qtyBox} onClick={e => e.stopPropagation()}>
              <button className={styles.qtyBtn} aria-label={`Убрать ${item.name}`} onClick={e => { e.stopPropagation(); removeFromCart(item.id); }}
                style={{ background: THEME.card, color: ACCENT, boxShadow: "0 1px 4px rgba(92,70,46,0.12)" }}>−</button>
              <span style={{ fontWeight: 800, fontSize: 16, minWidth: 22, textAlign: "center", color: THEME.text }}>{inCart.qty}</span>
              <button className={styles.qtyBtn} aria-label={`Добавить ${item.name}`} onClick={e => { e.stopPropagation(); addToCart(item); }}
                style={{ background: ACCENT, color: "#fff" }}>+</button>
            </div>
          ) : (
            <button className={styles.addBtn} aria-label={`Добавить ${item.name} в корзину`} onClick={e => { e.stopPropagation(); addToCart(item); }}>
              +
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
