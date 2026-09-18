"use client";
import { CAFE_INFO } from "@/lib/cafe";

const PINK = "#F58220";
const GRAY = "#888";
const DARK = "#1a1a1a";
const GIS_GREEN = "#00B341";

export default function MapModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  const q = encodeURIComponent(CAFE_INFO.query);
  const mapSrc = `https://yandex.ru/map-widget/v1/?mode=search&text=${q}&z=18`;
  const routeUrl = `https://yandex.ru/maps/?rtext=~${q}&rtt=auto`;

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
          padding: "20px 20px 28px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: DARK }}>Как нас найти</div>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "#F5F5F5", cursor: "pointer", fontSize: 16, color: GRAY }}
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

        <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid #F0F0F0" }}>
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
            background: PINK, color: "#fff", borderRadius: 12, padding: "12px 0",
            fontSize: 14, fontWeight: 700, textDecoration: "none",
          }}
        >
          🚗 Как проехать
        </a>

        <div style={{ marginTop: 16, borderTop: "1px solid #F0F0F0", paddingTop: 14, display: "grid", gap: 10 }}>
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
              <div style={{ fontSize: 14, fontWeight: 600, color: PINK }}>{CAFE_INFO.phone}</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
