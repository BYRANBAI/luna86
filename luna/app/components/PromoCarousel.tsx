"use client";

import { useEffect, useRef, useState } from "react";
import { PROMOS } from "../../lib/promos";
import styles from "../menu/menu.module.css";

interface Props {
  onTab: (tab: "cart" | "orders" | "profile") => void;
  onMap: () => void;
}

export default function PromoCarousel({ onTab, onMap }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  // Автопрокрутка останавливается, как только гость сам взаимодействует с блоком
  useEffect(() => {
    if (paused || PROMOS.length < 2) return;
    const timer = setInterval(() => {
      const track = trackRef.current;
      if (!track) return;
      const next = (Math.round(track.scrollLeft / track.clientWidth) + 1) % PROMOS.length;
      track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
    }, 6000);
    return () => clearInterval(timer);
  }, [paused]);

  function onScroll() {
    const track = trackRef.current;
    if (!track) return;
    const index = Math.round(track.scrollLeft / track.clientWidth);
    if (index !== active) setActive(index);
  }

  function goTo(index: number) {
    setPaused(true);
    const track = trackRef.current;
    if (track) track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
  }

  return (
    <div className={styles.promos}>
      <div
        ref={trackRef}
        className={styles.promoTrack}
        onScroll={onScroll}
        onPointerDown={() => setPaused(true)}
      >
        {PROMOS.map(promo => (
          <article key={promo.id} className={styles.promoSlide}>
            {promo.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className={styles.promoPhoto}
                src={promo.image}
                alt=""
                aria-hidden="true"
                draggable={false}
              />
            )}
            <div className={styles.promoShade} aria-hidden="true" />
            <div className={styles.promoContent}>
              <span className={styles.promoBadge}>{promo.badge}</span>
              <h3 className={styles.promoTitle}>{promo.title}</h3>
              <p className={styles.promoText}>{promo.subtitle}</p>

              {promo.action && (
                promo.action.kind === "tel" ? (
                  <a href={`tel:${promo.action.value}`} className={styles.promoCta}>{promo.action.label}</a>
                ) : (
                  <button
                    className={styles.promoCta}
                    onClick={() => {
                      if (promo.action?.kind === "tab") onTab(promo.action.value);
                      if (promo.action?.kind === "map") onMap();
                    }}
                  >
                    {promo.action.label}
                  </button>
                )
              )}
            </div>
          </article>
        ))}
      </div>

      <div className={styles.promoDots}>
        {PROMOS.map((promo, i) => (
          <button
            key={promo.id}
            className={styles.promoDot}
            data-on={i === active}
            aria-label={`Акция ${i + 1}`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </div>
  );
}
