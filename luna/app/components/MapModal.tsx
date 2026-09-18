"use client";

/**
 * Вкладка «Карта»: как проехать, часы работы, телефон кафе.
 * Данные кафе — в CAFE_INFO ниже (адрес, координаты для Яндекс.Карт, телефон, часы).
 */

const CAFE_INFO = {
  name: "Кафе «Луна»",
  address: "Ул. Примерная, 1", // TODO: реальный адрес
  lat: 56.8389, // TODO: реальные координаты
  lon: 60.6057,
  phone: "+7 900 000-00-01", // TODO: реальный телефон
  hours: "Ежедневно 10:00–22:00", // TODO: реальные часы
};

const PINK = "#E91E63";
const GRAY = "#888";
const DARK = "#1a1a1a";

export default function MapModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  const { lat, lon } = CAFE_INFO;
  const mapSrc = `https://yandex.ru/map-widget/v1/?ll=${lon}%2C${lat}&z=17&pt=${lon}%2C${lat},pm2rdm`;
  const routeUrl = `https://yandex.ru/maps/?rtext=~${lat}%2C${lon}&rtt=auto`;

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
        {/* Заголовок */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: DARK }}>Как нас найти</div>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "#F5F5F5", cursor: "pointer", fontSize: 16, color: GRAY }}
            aria-label="Закрыть"
          >✕</button>
        </div>

        {/* Адрес */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "12px 0" }}>
          <span style={{ fontSize: 18 }}>📍</span>
          <div>
            <div style={{ fontSize: 12, color: GRAY }}>{CAFE_INFO.name}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: DARK }}>{CAFE_INFO.address}</div>
          </div>
        </div>

        {/* Яндекс.Карта */}
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

        {/* Как проехать */}
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

        {/* Часы и телефон */}
        <div style={{ marginTop: 16, borderTop: "1px solid #F0F0F0", paddingTop: 14, display: "grid", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16 }}>🕐</span>
            <div>
              <div style={{ fontSize: 12, color: GRAY }}>Часы работы</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: DARK }}>{CAFE_INFO.hours}</div>
            </div>
          </div>
          <a href={`tel:${CAFE_INFO.phone.replace(/[^+\d]/g, "")}`} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <span style={{ fontSize: 16 }}>📞</span>
            <div>
              <div style={{ fontSize: 12, color: GRAY }}>Телефон</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: PINK }}>{CAFE_INFO.phone}</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
