"use client";
import { CAFE_INFO } from "@/lib/cafe";

const ACCENT = "#F58220";
const GRAY = "#8A8178";
const DARK = "#1C2430";
const CARD = "#FBF7F1";
const WELL = "#F3ECE1";
const BORDER = "#E8DFD2";
const GIS_GREEN = "#00B341";

export default function MapModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  const q = encodeURIComponent(CAFE_INFO.query);
  const mapSrc = `https://yandex.ru/map-widget/v1/?mode=search&text=${q}&z=18`;
  const routeUrl = `https://yandex.ru/maps/?rtext=~${q}&rtt=auto`;

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
          padding: "20px 20px 28px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: DARK }}>Как нас найти</div>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: WELL, cursor: "pointer", fontSize: 16, color: GRAY }}
            aria-label="Закрыть"
          >✕</button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "12px 0" }}>
          <span style={{ fontSize: 18 }}>📍</span>
          <div>
            <div style={{ fontSize: 12, color: GRAY }}>{CAFE_INFO.name} · {CAFE_INFO.city}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: DARK }}>{CAFE_INFO.address}</div>
          </div>
        </div>

        {/* Карточка 2ГИС */}
        <a
          href={CAFE_INFO.gisUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex", alignItems: "center", gap: 12, marginBottom: 12,
            padding: "12px 14px", borderRadius: 16, textDecoration: "none",
            background: "#F4FBF6", border: `1px solid ${GIS_GREEN}33`,
          }}
        >
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: GIS_GREEN, color: "#fff", fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, letterSpacing: -0.4,
          }}>2ГИС</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: DARK }}>Луна · кафе</div>
            <div style={{ fontSize: 13, color: DARK, marginTop: 2 }}>
              ★ {CAFE_INFO.gisRating} · {CAFE_INFO.gisReviews} оценок
            </div>
            <div style={{ fontSize: 12, color: GRAY, marginTop: 2 }}>Открыть карточку в 2ГИС →</div>
          </div>
        </a>

        <div style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${BORDER}`, boxShadow: "0 6px 16px rgba(92,70,46,0.06)" }}>
          <iframe
            title="Карта проезда"
            src={mapSrc}
            width="100%"
            height="260"
            frameBorder="0"
            allowFullScreen
            style={{ display: "block" }}
          />
        </div>

        <a
          href={routeUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block", textAlign: "center", marginTop: 14,
            background: ACCENT, color: "#fff", borderRadius: 12, padding: "12px 0",
            fontSize: 14, fontWeight: 700, textDecoration: "none",
            boxShadow: "0 4px 14px rgba(245,130,32,0.28)",
          }}
        >
          🚗 Как проехать
        </a>

        <div style={{ marginTop: 16, borderTop: `1px solid ${BORDER}`, paddingTop: 14, display: "grid", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16 }}>🕐</span>
            <div>
              <div style={{ fontSize: 12, color: GRAY }}>Часы работы</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: DARK }}>{CAFE_INFO.hours}</div>
            </div>
          </div>
          <a href={`tel:${CAFE_INFO.phoneHref}`} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <span style={{ fontSize: 16 }}>📞</span>
            <div>
              <div style={{ fontSize: 12, color: GRAY }}>Телефон · бронь столика</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: ACCENT }}>{CAFE_INFO.phone}</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
