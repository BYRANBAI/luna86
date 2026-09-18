"use client";
import { useState, useEffect } from "react";

interface Modifier { id: number; name: string; price: number; }
interface Review {
  id: number; rating: number; comment?: string; createdAt: string;
  guest: { id: number; name: string; };
}
interface Item {
  id: number; name: string; description: string; price: number;
  photo: string; modifiers?: Modifier[];
}
interface ItemModalProps {
  item: Item | null; isOpen: boolean;
  onClose: () => void;
  onAddToCart: (itemId: number, qty: number, modifiers: number[], totalPrice: number) => void;
}

const PINK = "#F58220";

export default function ItemModal({ item, isOpen, onClose, onAddToCart }: ItemModalProps) {
  const [qty, setQty] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<number[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    if (item && isOpen) {
      setQty(1);
      setSelectedModifiers([]);
      fetch(`/api/reviews?itemId=${item.id}`)
        .then(r => r.json())
        .then(d => { setReviews(d.reviews || []); setAvgRating(d.avgRating || 0); setTotalReviews(d.totalCount || 0); })
        .catch(() => {});
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const toggleModifier = (id: number) =>
    setSelectedModifiers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const totalPrice = (() => {
    let t = item.price;
    item.modifiers?.forEach(m => { if (selectedModifiers.includes(m.id)) t += m.price; });
    return t * qty;
  })();

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 560, maxHeight: "92vh", overflowY: "auto",
          background: "#fff", borderRadius: "24px 24px 0 0",
          fontFamily: "'Inter', -apple-system, sans-serif",
        }}
      >
        {/* Фото */}
        <div style={{ position: "relative", width: "100%", height: 260, background: "#F5F5F5", flexShrink: 0 }}>
          {item.photo
            ? <img src={item.photo} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64 }}>🍜</div>
          }
          {/* Закрыть */}
          <button onClick={onClose} style={{
            position: "absolute", top: 12, left: 12,
            width: 36, height: 36, borderRadius: "50%", border: "none",
            background: "rgba(255,255,255,0.95)", cursor: "pointer", fontSize: 16,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}>✕</button>
          {/* Рейтинг */}
          {totalReviews > 0 && (
            <div style={{
              position: "absolute", top: 12, right: 12,
              background: "rgba(255,255,255,0.95)", borderRadius: 20, padding: "4px 10px",
              display: "flex", alignItems: "center", gap: 4,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}>
              <span style={{ color: "#FFC107", fontSize: 13 }}>★</span>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{avgRating.toFixed(1)}</span>
            </div>
          )}
          {/* Drag handle */}
          <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.6)" }} />
        </div>

        {/* Контент */}
        <div style={{ padding: "20px 20px 24px" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#212121", margin: "0 0 6px" }}>{item.name}</h2>

          {totalReviews > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              {[1,2,3,4,5].map(s => (
                <span key={s} style={{ fontSize: 14, color: s <= Math.round(avgRating) ? "#FFC107" : "#E0E0E0" }}>★</span>
              ))}
              <span style={{ fontSize: 13, color: "#757575" }}>{avgRating.toFixed(1)} ({totalReviews})</span>
            </div>
          )}

          <p style={{ fontSize: 14, color: "#757575", lineHeight: 1.6, margin: "0 0 20px" }}>{item.description}</p>

          {/* Модификаторы */}
          {item.modifiers && item.modifiers.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#212121", marginBottom: 10 }}>Добавить к заказу</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {item.modifiers.map(mod => {
                  const active = selectedModifiers.includes(mod.id);
                  return (
                    <div key={mod.id} onClick={() => toggleModifier(mod.id)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "12px 14px", borderRadius: 14, cursor: "pointer",
                        border: `2px solid ${active ? PINK : "#F0F0F0"}`,
                        background: active ? "#FFF0F5" : "#FAFAFA",
                        transition: "all 0.15s",
                      }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: "#212121" }}>{mod.name}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: PINK }}>+{mod.price} ₽</span>
                        <div style={{
                          width: 22, height: 22, borderRadius: 6, border: `2px solid ${active ? PINK : "#DDD"}`,
                          background: active ? PINK : "#fff",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 0.15s",
                        }}>
                          {active && <span style={{ color: "#fff", fontSize: 12, fontWeight: 800 }}>✓</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Количество */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, padding: "14px 16px", background: "#F9F9F9", borderRadius: 14 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#212121" }}>Количество</span>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => setQty(Math.max(1, qty - 1))} style={{
                width: 36, height: 36, borderRadius: "50%", border: "none", cursor: "pointer",
                background: "#F0F0F0", color: PINK, fontSize: 20, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>−</button>
              <span style={{ fontWeight: 800, fontSize: 18, color: "#212121", minWidth: 24, textAlign: "center" }}>{qty}</span>
              <button onClick={() => setQty(qty + 1)} style={{
                width: 36, height: 36, borderRadius: "50%", border: "none", cursor: "pointer",
                background: PINK, color: "#fff", fontSize: 20, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>+</button>
            </div>
          </div>

          {/* Отзывы */}
          {reviews.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#212121", marginBottom: 10 }}>Отзывы</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 200, overflowY: "auto" }}>
                {reviews.slice(0, 4).map(r => (
                  <div key={r.id} style={{ padding: "12px 14px", background: "#F9F9F9", borderRadius: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: "#212121" }}>{r.guest.name}</span>
                      <div style={{ display: "flex", gap: 2 }}>
                        {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 12, color: s <= r.rating ? "#FFC107" : "#E0E0E0" }}>★</span>)}
                      </div>
                    </div>
                    {r.comment && <p style={{ fontSize: 13, color: "#757575", margin: 0, lineHeight: 1.5 }}>{r.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Кнопка */}
          <button
            onClick={() => { onAddToCart(item.id, qty, selectedModifiers, totalPrice); onClose(); }}
            style={{
              width: "100%", padding: "16px 0", background: PINK, color: "#fff",
              border: "none", borderRadius: 16, fontSize: 16, fontWeight: 800, cursor: "pointer",
              boxShadow: "0 4px 20px rgba(233,30,99,0.35)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              paddingLeft: 20, paddingRight: 20, boxSizing: "border-box",
            }}>
            <span>Добавить в корзину</span>
            <span style={{ background: "rgba(255,255,255,0.25)", borderRadius: 10, padding: "4px 12px" }}>{totalPrice} ₽</span>
          </button>
        </div>
      </div>
    </div>
  );
}
