"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "../pos/pos.module.css";

type Any = any;

const cooking = (status: string) => status === "NEW" || status === "COOKING";
const ready = (status: string) => status === "READY";

export default function QueueBoard() {
  const [data, setData] = useState<Any>({ orders: [], reservations: [] });

  useEffect(() => {
    document.title = "Луна · Очередь";
    const load = () => fetch("/api/state").then((r) => r.json()).then(setData).catch(() => {});
    load();
    const t = setInterval(load, 2500);
    return () => clearInterval(t);
  }, []);

  const tickets = (data.orders || []).filter((o: Any) => cooking(o.status) || ready(o.status));
  const waitlist = (data.reservations || []).filter((r: Any) => r.status === "Очередь");

  return (
    <main className={styles.shell} style={{ height: "auto", minHeight: "100dvh" }}>
      <header className={styles.header}>
        <h1 className={styles.brand}>
          <span className={styles.moon}>◐</span> ЛУНА · очередь
        </h1>
        <nav className={styles.nav}>
          <Link className="btn secondary min-h-11 px-4" href="/pos">POS</Link>
          <Link className="btn secondary min-h-11 px-4" href="/kds">KDS</Link>
        </nav>
      </header>
      <div className={styles.stage} style={{ overflow: "auto" }}>
        <div className={styles.queueGrid} style={{ height: "auto" }}>
          <section className={styles.card}>
            <h2 className="mb-4 text-2xl font-bold">Готовится</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {tickets.filter((o: Any) => cooking(o.status)).map((o: Any) => (
                <div key={o.id} className={`${styles.table} ${styles.free} text-center`}>
                  <div className="text-5xl font-bold">№ {o.number}</div>
                  <p className="mt-2 text-sm opacity-90">
                    {o.tableNumber ? `Стол ${o.tableNumber}` : o.source}
                  </p>
                </div>
              ))}
              {!tickets.some((o: Any) => cooking(o.status)) && (
                <p className={styles.muted}>Пока пусто</p>
              )}
            </div>
          </section>
          <section className={styles.card}>
            <h2 className="mb-4 text-2xl font-bold">Готово, заберите</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {tickets.filter((o: Any) => ready(o.status)).map((o: Any) => (
                <div key={o.id} className={`${styles.table} ${styles.ready} text-center`}>
                  <div className="text-5xl font-bold">№ {o.number}</div>
                  <p className="mt-2 text-sm opacity-90">
                    {o.tableNumber ? `Стол ${o.tableNumber}` : o.source}
                  </p>
                </div>
              ))}
              {!tickets.some((o: Any) => ready(o.status)) && (
                <p className={styles.muted}>Ждём готовность</p>
              )}
            </div>
          </section>
        </div>
        {waitlist.length > 0 && (
          <section className={`${styles.card} mt-4`}>
            <h2 className="mb-4 text-2xl font-bold">Ждут стол</h2>
            <div className="flex flex-wrap gap-3">
              {waitlist.map((r: Any, i: number) => (
                <div key={r.id} className={styles.item}>
                  <b>№{i + 1} · {r.guestName}</b>
                  <p className={styles.muted}>{r.guests} гостей</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
