"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "../pos/pos.module.css";

type Any = any;
const WORKSHOPS = ["Все", "бар", "горячий", "холодный", "кондитерский"];

export default function KDS() {
  const [data, setData] = useState<Any>({ orders: [] });
  const [workshop, setWorkshop] = useState("Все");

  const load = () => fetch("/api/state").then((r) => r.json()).then(setData).catch(() => {});

  useEffect(() => {
    document.title = "Луна · KDS";
    load();
    const t = setInterval(load, 2500);
    return () => clearInterval(t);
  }, []);

  const patch = (body: Any) =>
    fetch("/api/orders", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }).then(load);

  const tickets = (data.orders || []).filter((o: Any) => ["NEW", "COOKING"].includes(o.status));

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/pos">
          <span className={styles.moon}>◐</span> ЛУНА · KDS
        </Link>
        <nav className={styles.nav}>
          <Link className="btn secondary min-h-11 px-4" href="/pos">POS</Link>
          <Link className="btn secondary min-h-11 px-4" href="/queue">Экран выдачи</Link>
        </nav>
      </header>

      <div className={styles.tabs}>
        {WORKSHOPS.map((x) => (
          <button
            key={x}
            className={`${styles.tab} ${workshop === x ? styles.tabActive : ""}`}
            onClick={() => setWorkshop(x)}
          >
            {x}
          </button>
        ))}
      </div>

      <div className={styles.stage}>
        {tickets.length === 0 && (
          <p className={`${styles.muted} pt-10 text-center text-lg`}>На кухне пока пусто</p>
        )}
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {tickets.map((o: Any) => (
            <Tile key={o.id} order={o} workshop={workshop} patch={patch} styles={styles} />
          ))}
        </div>
      </div>
    </main>
  );
}

function Tile({ order, workshop, patch, styles }: { order: Any; workshop: string; patch: (x: Any) => void; styles: Any }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const startedAt =
    order.statusHistory?.filter((h: Any) => h.status === "COOKING").sort(
      (a: Any, b: Any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0]?.createdAt || order.createdAt;
  const minutes = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 60000));
  const sla = Math.max(8, ...(order.lines || []).map((l: Any) => l.item?.cookingMinutes || 12));
  const color = minutes > sla ? "text-red-700" : minutes > sla * 0.7 ? "text-amber-700" : "text-emerald-700";
  const lines = (order.lines || []).filter((l: Any) => workshop === "Все" || l.item?.workshop === workshop);

  if (workshop !== "Все" && !lines.length) return null;

  return (
    <div className={styles.card}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <b className="text-2xl">№ {order.number}</b>
          <p className={styles.muted}>
            {order.tableNumber ? `Стол ${order.tableNumber}` : order.source}
          </p>
        </div>
        <span className={`${color} text-sm font-semibold`}>
          {minutes} мин · SLA {sla}
        </span>
      </div>
      {lines.map((l: Any) => (
        <div className={styles.ticket} key={l.id}>
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold">{l.item?.name} × {l.qty}</span>
            <button
              className={styles.price}
              onClick={() =>
                alert(
                  (l.item?.ingredients || [])
                    .map((r: Any) => `${r.ingredient.name}: ${r.grams}${r.ingredient.unit}`)
                    .join("\n") || "Техкарта пуста"
                )
              }
            >
              Техкарта
            </button>
          </div>
          <p className={styles.muted}>
            {l.item?.workshop} · {l.status === "READY" ? "Готово" : "Готовится"}
          </p>
          <button
            className="btn secondary mt-2 min-h-11 w-full text-sm"
            onClick={() => patch({ lineId: l.id, status: l.status === "READY" ? "COOKING" : "READY" })}
          >
            {l.status === "READY" ? "Вернуть в работу" : "Готово по позиции"}
          </button>
        </div>
      ))}
      <div className="mt-4 flex gap-2">
        {order.status === "NEW" && (
          <button className="btn min-h-12 flex-1" onClick={() => patch({ id: order.id, status: "COOKING" })}>
            Начать готовить
          </button>
        )}
        {order.status === "COOKING" && (
          <button className="btn min-h-12 flex-1" onClick={() => patch({ id: order.id, status: "READY" })}>
            Готово
          </button>
        )}
      </div>
    </div>
  );
}
