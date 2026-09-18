"use client";
import { useState, useEffect } from "react";

interface Modifier { id: number; name: string; price: number; }
interface ModifierOption { id: number; name: string; price: number; }
interface ModifierGroup { id: number; name: string; min: number; max: number; options: ModifierOption[]; }
interface Review {
  id: number; rating: number; comment?: string; createdAt: string;
  guest: { id: number; name: string; };
}
interface Item {
  id: number; name: string; description: string; price: number;
  photo: string; modifiers?: Modifier[]; modifierGroups?: ModifierGroup[];
}
interface ItemModalProps {
  item: Item | null; isOpen: boolean;
  onClose: () => void;
  onAddToCart: (itemId: number, qty: number, modifiers: number[], totalPrice: number) => void;
}

const ACCENT = "#F58220";
const ACCENT_SOFT = "#FDE6D0";
const TEXT = "#1C2430";
const MUTED = "#8A8178";
const CARD = "#FBF7F1";
const WELL = "#F3ECE1";
const BORDER = "#E8DFD2";

export default function ItemModal({ item, isOpen, onClose, onAddToCart }: ItemModalProps) {
  const [qty, setQty] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<number[]>([]);
  // Для групп с одиночным выбором (например, размер порции) — по опции на группу
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    if (item && isOpen) {
      setQty(1);
      setSelectedModifiers([]);
      setSelectedOptions(Object.fromEntries(
        (item.modifierGroups ?? [])
          .filter(g => g.options.length > 0)
          .map(g => [g.id, g.options[0].id])
      ));
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
    item.modifierGroups?.forEach(g => {
      const picked = g.options.find(o => o.id === selectedOptions[g.id]);
      if (picked) t += picked.price;
    });
    return t * qty;
  })();

  // Выбранные опции groups уходят в корзину вместе с обычными добавками
  const chosenIds = [...selectedModifiers, ...Object.values(selectedOptions)];

  return (
    <div
      className="animate-fade-in"
      style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(40,28,16,0.5)", backdropFilter: "blur(3px)" }}
      onClick={onClose}
    >
      <div
        className="animate-sheet-up"
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 560, maxHeight: "92vh", overflowY: "auto",
          background: CARD, borderRadius: "24px 24px 0 0",
          boxShadow: "0 -20px 60px rgba(60,42,24,0.28)",
          fontFamily: "'Inter', -apple-system, sans-serif",
        }}
      >
        {/* Фото */}
        <div style={{ position: "relative", width: "100%", height: 260, background: WELL, flexShrink: 0 }}>
          {item.photo
            ? <img src={item.photo} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64 }}>🍜</div>
          }
          {/* Закрыть */}
          <button onClick={onClose} aria-label="Закрыть" style={{
            position: "absolute", top: 12, left: 12,
            width: 36, height: 36, borderRadius: "50%", border: "none",
            background: "rgba(251,247,241,0.95)", cursor: "pointer", fontSize: 16, color: TEXT,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 10px rgba(60,42,24,0.2)",
          }}>✕</button>
          {/* Рейтинг */}
          {totalReviews > 0 && (
            <div style={{
              position: "absolute", top: 12, right: 12,
              background: "rgba(251,247,241,0.95)", borderRadius: 20, padding: "4px 10px",
              display: "flex", alignItems: "center", gap: 4,
              boxShadow: "0 2px 10px rgba(60,42,24,0.2)",
            }}>
              <span style={{ color: "#F5A623", fontSize: 13 }}>★</span>
              <span style={{ fontWeight: 700, fontSize: 13, color: TEXT }}>{avgRating.toFixed(1)}</span>
            </div>
          )}
          {/* Drag handle */}
          <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.6)" }} />
        </div>

        {/* Контент */}
        <div style={{ padding: "20px 20px 24px" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: TEXT, margin: "0 0 6px" }}>{item.name}</h2>

          {totalReviews > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              {[1,2,3,4,5].map(s => (
                <span key={s} style={{ fontSize: 14, color: s <= Math.round(avgRating) ? "#F5A623" : BORDER }}>★</span>
              ))}
              <span style={{ fontSize: 13, color: MUTED }}>{avgRating.toFixed(1)} ({totalReviews})</span>
            </div>
          )}

          <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6, margin: "0 0 20px" }}>{item.description}</p>

          {/* Группы с одиночным выбором: размер порции и т.п. */}
          {item.modifierGroups?.filter(g => g.options.length > 0).map(group => (
            <div key={group.id} style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: TEXT, marginBottom: 10 }}>{group.name}</div>
              <div role="radiogroup" aria-label={group.name} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {group.options.map(opt => {
                  const active = selectedOptions[group.id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setSelectedOptions(prev => ({ ...prev, [group.id]: opt.id }))}
                      style={{
                        flex: "1 1 120px", minWidth: 0, textAlign: "left", cursor: "pointer",
                        padding: "12px 14px", borderRadius: 14,
                        border: `2px solid ${active ? ACCENT : BORDER}`,
                        background: active ? ACCENT_SOFT : WELL,
                        transition: "border-color 180ms ease, background 180ms ease",
                      }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: TEXT }}>{opt.name}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: active ? ACCENT : MUTED, marginTop: 2 }}>
                        {item.price + opt.price} ₽
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Модификаторы */}
          {item.modifiers && item.modifiers.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: TEXT, marginBottom: 10 }}>Добавить к заказу</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {item.modifiers.map(mod => {
                  const active = selectedModifiers.includes(mod.id);
                  return (
                    <div key={mod.id} onClick={() => toggleModifier(mod.id)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "12px 14px", borderRadius: 14, cursor: "pointer",
                        border: `2px solid ${active ? ACCENT : BORDER}`,
                        background: active ? ACCENT_SOFT : WELL,
                        transition: "border-color 180ms ease, background 180ms ease",
                      }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: TEXT }}>{mod.name}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: ACCENT }}>+{mod.price} ₽</span>
                        <div style={{
                          width: 22, height: 22, borderRadius: 6, border: `2px solid ${active ? ACCENT : "#D8CDBC"}`,
                          background: active ? ACCENT : CARD,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "background 180ms ease, border-color 180ms ease",
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
          {item.price > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, padding: "14px 16px", background: WELL, borderRadius: 14 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: TEXT }}>Количество</span>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Уменьшить количество" style={{
                width: 36, height: 36, borderRadius: "50%", border: "none", cursor: "pointer",
                background: CARD, color: ACCENT, fontSize: 20, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 1px 4px rgba(92,70,46,0.12)",
              }}>−</button>
              <span style={{ fontWeight: 800, fontSize: 18, color: TEXT, minWidth: 24, textAlign: "center" }}>{qty}</span>
              <button onClick={() => setQty(qty + 1)} aria-label="Увеличить количество" style={{
                width: 36, height: 36, borderRadius: "50%", border: "none", cursor: "pointer",
                background: ACCENT, color: "#fff", fontSize: 20, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 14px rgba(245,130,32,0.28)",
              }}>+</button>
            </div>
          </div>
          )}

          {/* Отзывы */}
          {reviews.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: TEXT, marginBottom: 10 }}>Отзывы</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 200, overflowY: "auto" }}>
                {reviews.slice(0, 4).map(r => (
                  <div key={r.id} style={{ padding: "12px 14px", background: WELL, borderRadius: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: TEXT }}>{r.guest.name}</span>
                      <div style={{ display: "flex", gap: 2 }}>
                        {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 12, color: s <= r.rating ? "#F5A623" : BORDER }}>★</span>)}
                      </div>
                    </div>
                    {r.comment && <p style={{ fontSize: 13, color: MUTED, margin: 0, lineHeight: 1.5 }}>{r.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Кнопка */}
          {item.price === 0 ? (
            <div style={{
              width: "100%", padding: "16px 20px", background: WELL, color: MUTED,
              borderRadius: 16, fontSize: 14, fontWeight: 700, textAlign: "center",
              border: `1px solid ${BORDER}`, boxSizing: "border-box",
            }}>
              Цена уточняется — спросите у официанта
            </div>
          ) : (
          <button
            onClick={() => { onAddToCart(item.id, qty, chosenIds, totalPrice); onClose(); }}
            style={{
              width: "100%", padding: "16px 0", background: ACCENT, color: "#fff",
              border: "none", borderRadius: 16, fontSize: 16, fontWeight: 800, cursor: "pointer",
              boxShadow: "0 8px 22px rgba(245,130,32,0.36)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              paddingLeft: 20, paddingRight: 20, boxSizing: "border-box",
              transition: "background 200ms ease, transform 180ms ease",
            }}>
            <span>Добавить в корзину</span>
            <span style={{ background: "rgba(255,255,255,0.25)", borderRadius: 10, padding: "4px 12px" }}>{totalPrice} ₽</span>
          </button>
          )}
        </div>
      </div>
    </div>
  );
}
