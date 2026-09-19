"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./pos.module.css";

type Any = any;
type Tab = "tables" | "reservations" | "queue" | "orders";

const money = (n: number) => new Intl.NumberFormat("ru-RU").format(n) + " ₽";
const ACTIVE = ["NEW", "COOKING", "READY", "DELIVERED"];
const OPEN_RES = ["Новая", "Подтверждена"];

const STATUS_RU: Record<string, string> = {
  NEW: "На кухне",
  COOKING: "Готовится",
  READY: "Готов",
  DELIVERED: "Подано",
  DONE: "Оплачен",
  CANCELLED: "Отменён",
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toLocalInput(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function sortTables(tables: Any[]) {
  return [...tables].sort((a, b) => Number(a.number) - Number(b.number) || String(a.number).localeCompare(String(b.number)));
}

function tableOrders(orders: Any[], number: string) {
  return (orders || []).filter((o: Any) => o.tableNumber === number && ACTIVE.includes(o.status));
}

export default function POS() {
  const [data, setData] = useState<Any>({ items: [], orders: [], guests: [], categories: [], reservations: [], halls: [] });
  const [table, setTable] = useState("");
  const [cart, setCart] = useState<Any[]>([]);
  const [guest, setGuest] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [payment, setPayment] = useState("Карта");
  const [receipt, setReceipt] = useState<Any>(null);
  const [menuQuery, setMenuQuery] = useState("");
  const [feedFilter, setFeedFilter] = useState("Все");
  const [activeTab, setActiveTab] = useState<Tab>("tables");
  const [guestSearch, setGuestSearch] = useState("");
  const [showNewGuest, setShowNewGuest] = useState(false);
  const [newGuest, setNewGuest] = useState({ name: "", phone: "" });
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [resFormOpen, setResFormOpen] = useState(false);
  const [resForm, setResForm] = useState({ guestName: "", phone: "", guests: 2, date: toLocalInput(), tableNumber: "", note: "" });
  const [queueFormOpen, setQueueFormOpen] = useState(false);
  const [queueForm, setQueueForm] = useState({ guestName: "", phone: "", guests: 2, note: "" });
  const [seatPick, setSeatPick] = useState<Any>(null);
  const [payOpen, setPayOpen] = useState(false);

  const load = () => fetch("/api/state").then((r) => r.json()).then(setData).catch(() => {});

  useEffect(() => {
    document.title = "Луна · POS";
    load();
    const t = setInterval(load, 2500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => setNote(""), 2800);
    return () => clearTimeout(t);
  }, [note]);

  const halls: Any[] = data.halls?.length
    ? data.halls
    : [{ id: 0, name: "Зал", tables: Array.from({ length: 8 }, (_, i) => ({ id: i + 1, number: String(i + 1), seats: 4 })) }];

  const allTables = useMemo(
    () => sortTables(halls.flatMap((h: Any) => (h.tables || []).map((t: Any) => ({ ...t, hallName: h.name })))),
    [halls]
  );

  const openOrders = table ? tableOrders(data.orders, table) : [];
  const kitchenTotal = openOrders.reduce((s: number, o: Any) => s + (o.total || 0), 0);
  const cartTotal = cart.reduce((s, x) => s + x.price * x.qty, 0);
  const due = Math.max(0, kitchenTotal + cartTotal - bonus);
  const currentInfo = table ? getTableInfo(table) : null;

  function getTableInfo(num: string) {
    const orders = tableOrders(data.orders, num);
    const res = (data.reservations || []).find((r: Any) =>
      r.table?.number === num && OPEN_RES.includes(r.status) && isSameDay(new Date(r.date), new Date())
    );
    if (!orders.length) {
      return {
        status: res ? `бронь · ${res.guestName}` : "свободен",
        occupied: false,
        reserved: Boolean(res),
        reservation: res,
        total: 0,
        orderStatus: "",
        startTime: null as string | null,
      };
    }
    const latest = orders[0];
    const rank = ["READY", "COOKING", "NEW", "DELIVERED"];
    const hottest = [...orders].sort((a, b) => rank.indexOf(a.status) - rank.indexOf(b.status))[0];
    return {
      status: hottest.status === "READY" ? "готов к подаче" : hottest.status === "DELIVERED" ? "за столом" : "занят",
      occupied: true,
      reserved: false,
      reservation: res,
      total: orders.reduce((s, o) => s + (o.total || 0), 0),
      orderStatus: hottest.status,
      startTime: latest.createdAt as string,
      guests: res?.guests || 0,
    };
  }

  const add = (item: Any) => setCart((c) => {
    const old = c.find((x) => x.id === item.id);
    return old ? c.map((x) => x.id === item.id ? { ...x, qty: x.qty + 1 } : x) : [...c, { ...item, qty: 1 }];
  });
  const updateQty = (id: number, delta: number) => setCart((c) =>
    c.map((x) => x.id === id ? { ...x, qty: x.qty + delta } : x).filter((x) => x.qty > 0)
  );

  const openTable = (num: string) => {
    setTable(num);
    setCart([]);
    setGuest(0);
    setBonus(0);
    setPayOpen(false);
    setActiveTab("tables");
  };

  const closeTable = () => {
    setTable("");
    setCart([]);
    setGuest(0);
    setBonus(0);
    setPayOpen(false);
  };

  async function patchOrder(id: number, status: string, noteText = "") {
    const r = await fetch("/api/orders", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status, note: noteText }),
    });
    const body = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(body.error || "Не удалось обновить заказ");
  }

  async function sendToKitchen() {
    if (!cart.length) return;
    setBusy(true);
    try {
      const isQuick = table === "quick";
      const r = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          source: isQuick ? "Касса" : "Зал",
          tableNumber: isQuick ? undefined : table,
          guestId: guest || undefined,
          paymentType: "Открытый счёт",
          lines: cart.map((x) => ({ itemId: x.id, qty: x.qty })),
        }),
      });
      const order = await r.json();
      if (!r.ok) throw new Error(order.error || "Не удалось отправить на кухню");
      setCart([]);
      setNote(isQuick ? `Заказ №${order.number} в очереди выдачи` : `Стол ${table}: отправлено на кухню · №${order.number}`);
      load();
    } catch (e: Any) {
      alert(e.message || "Ошибка отправки");
    } finally {
      setBusy(false);
    }
  }

  async function payTable() {
    setBusy(true);
    try {
      let created: Any = null;
      if (cart.length) {
        const isQuick = table === "quick";
        const r = await fetch("/api/orders", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            source: isQuick ? "Касса" : "Зал",
            tableNumber: isQuick ? undefined : table,
            guestId: guest || undefined,
            bonus: bonus || undefined,
            paymentType: payment,
            lines: cart.map((x) => ({ itemId: x.id, qty: x.qty })),
          }),
        });
        created = await r.json();
        if (!r.ok) throw new Error(created.error || "Не удалось оформить заказ");
      }

      const closing = [
        ...openOrders,
        ...(created?.id ? [created] : []),
      ];
      for (const o of closing) {
        if (o.status !== "DONE") await patchOrder(o.id, "DONE", `Оплата: ${payment}`);
      }

      setReceipt({
        number: closing.map((o: Any) => o.number).filter(Boolean).join(", ") || "—",
        createdAt: new Date().toISOString(),
        source: table === "quick" ? "Касса" : "Зал",
        tableNumber: table === "quick" ? "" : table,
        lines: [
          ...openOrders.flatMap((o: Any) => o.lines || []),
          ...cart.map((x) => ({ name: x.name, qty: x.qty, price: x.price })),
        ],
        total: due,
        payments: [{ type: payment, amount: due }],
        bonus,
      });
      closeTable();
      load();
    } catch (e: Any) {
      alert(e.message || "Не удалось закрыть стол");
    } finally {
      setBusy(false);
      setPayOpen(false);
    }
  }

  async function markServed(orderId: number) {
    try {
      await patchOrder(orderId, "DELIVERED", "Подано гостю");
      load();
    } catch (e: Any) {
      alert(e.message);
    }
  }

  async function cancelOpen() {
    if (!confirm("Отменить открытые заказы этого стола?")) return;
    setBusy(true);
    try {
      for (const o of openOrders) await patchOrder(o.id, "CANCELLED", "Отмена официантом");
      closeTable();
      load();
    } catch (e: Any) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function createGuest(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/pos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ entity: "guest", ...newGuest }),
    });
    const g = await r.json();
    if (!r.ok) return alert(g.error || "Не удалось создать гостя");
    setGuest(g.id);
    setShowNewGuest(false);
    setNewGuest({ name: "", phone: "" });
    setNote("Гость сохранён");
    load();
  }

  async function createReservation(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/pos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        entity: "reservation",
        ...resForm,
        guests: Number(resForm.guests),
        hallId: halls[0]?.id,
        tableNumber: resForm.tableNumber || undefined,
      }),
    });
    const body = await r.json();
    if (!r.ok) return alert(body.error || "Не удалось создать бронь");
    setResFormOpen(false);
    setResForm({ guestName: "", phone: "", guests: 2, date: toLocalInput(), tableNumber: "", note: "" });
    setNote("Бронь создана");
    load();
  }

  async function createWaitlist(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/pos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        entity: "waitlist",
        ...queueForm,
        guests: Number(queueForm.guests),
        hallId: halls[0]?.id,
      }),
    });
    const body = await r.json();
    if (!r.ok) return alert(body.error || "Не удалось добавить в очередь");
    setQueueFormOpen(false);
    setQueueForm({ guestName: "", phone: "", guests: 2, note: "" });
    setNote("Гость в очереди");
    load();
  }

  async function setReservationStatus(id: number, status: string) {
    const r = await fetch("/api/pos", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const body = await r.json();
    if (!r.ok) return alert(body.error || "Не удалось обновить бронь");
    load();
  }

  async function seatGuest(reservation: Any, tableNumber?: string) {
    const num = tableNumber || reservation.table?.number;
    if (!num) {
      setSeatPick(reservation);
      return;
    }
    const r = await fetch("/api/pos", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: reservation.id, action: "seat", tableNumber: num }),
    });
    const body = await r.json();
    if (!r.ok) return alert(body.error || "Не удалось посадить");
    setSeatPick(null);
    openTable(body.seatedTable || num);
    setNote(`${reservation.guestName} за столом ${body.seatedTable || num}`);
    load();
  }

  async function removeReservation(id: number) {
    if (!confirm("Удалить запись?")) return;
    await fetch("/api/pos", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  const menuItems = (data.items || []).filter((i: Any) => {
    if (i.stock <= 0) return false;
    if (categoryId && i.categoryId !== categoryId) return false;
    if (menuQuery && !i.name.toLowerCase().includes(menuQuery.toLowerCase())) return false;
    return true;
  });

  const upcomingRes = (data.reservations || [])
    .filter((r: Any) => r.status !== "Очередь" && r.status !== "Отменена" && r.status !== "Не пришёл")
    .sort((a: Any, b: Any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const waitlist = (data.reservations || []).filter((r: Any) => r.status === "Очередь");
  const deliverySources = ["Сайт", "Доставка", "Киоск"];
  const pickup = (data.orders || []).filter((o: Any) =>
    ["NEW", "COOKING", "READY"].includes(o.status) &&
    (deliverySources.includes(o.source) || !o.tableNumber)
  );
  const liveOrders = (data.orders || []).filter((o: Any) =>
    !["DONE", "CANCELLED"].includes(o.status) && (feedFilter === "Все" || o.source === feedFilter)
  );

  const inputCls = styles.input;
  const tabBtn = (id: Tab, label: string) => (
    <button
      key={id}
      className={`${styles.tab} ${activeTab === id ? styles.tabActive : ""}`}
      onClick={() => { setActiveTab(id); if (id !== "tables") setTable(""); }}
    >
      {label}
    </button>
  );

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <Link href="/admin">
            <span className={styles.moon}>◐</span> ЛУНА · POS
          </Link>
          {note && <span className={styles.note}>{note}</span>}
        </div>
        <nav className={styles.nav}>
          <Link className="btn secondary min-h-11 px-4" href="/kds">KDS</Link>
          <Link className="btn secondary min-h-11 px-4" href="/queue">Экран выдачи</Link>
        </nav>
      </header>

      <div className={styles.tabs}>
        {tabBtn("tables", "Столы")}
        {tabBtn("reservations", "Брони")}
        {tabBtn("queue", "Очередь")}
        {tabBtn("orders", "Заказы")}
        <button
          className={styles.takeaway}
          onClick={() => { setTable("quick"); setCart([]); setActiveTab("tables"); }}
        >
          Навынос
        </button>
      </div>

      <div className={styles.stage}>
        {activeTab === "tables" && !table && (
          <div className={styles.scroll}>
            {halls.map((hall: Any) => (
              <section key={hall.id || hall.name} className={`${styles.card} mb-4`}>
                <h2 className="mb-3 text-lg font-bold">{hall.name || "Схема зала"}</h2>
                <div className={styles.tables}>
                  {sortTables(hall.tables || allTables).map((t: Any) => {
                    const info = getTableInfo(t.number);
                    const elapsed = info.startTime ? Math.floor((Date.now() - new Date(info.startTime).getTime()) / 60000) : 0;
                    let bg = styles.free;
                    if (info.orderStatus === "READY") bg = styles.ready;
                    else if (info.orderStatus === "DELIVERED") bg = styles.served;
                    else if (info.occupied) bg = styles.busy;
                    else if (info.reserved) bg = styles.reserved;
                    return (
                      <button
                        key={t.id || t.number}
                        onClick={() => openTable(t.number)}
                        className={`${styles.table} ${bg}`}
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-2xl font-bold">Стол {t.number}</span>
                          <span className="text-sm opacity-80">{t.seats} мест</span>
                        </div>
                        <p className="mt-1 text-sm opacity-90">{info.status}</p>
                        {info.occupied && (
                          <p className="mt-2 text-sm font-semibold">
                            {money(info.total)} · {elapsed} мин
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        {activeTab === "tables" && table && (
          <div className={styles.split}>
            <section className={styles.pane}>
              <div className={styles.paneHead}>
                <button className="btn secondary min-h-11" onClick={closeTable}>← К столам</button>
                <h2 className="text-xl font-bold">{table === "quick" ? "Навынос" : `Стол ${table}`}</h2>
                <span className={styles.muted}>{currentInfo?.status}</span>
              </div>
              <div className={styles.cats}>
                <button
                  className={`${styles.chip} ${categoryId === null ? styles.chipOn : ""}`}
                  onClick={() => setCategoryId(null)}
                >
                  Все
                </button>
                {(data.categories || []).map((cat: Any) => (
                  <button
                    key={cat.id}
                    className={`${styles.chip} ${categoryId === cat.id ? styles.chipOn : ""}`}
                    onClick={() => setCategoryId(cat.id)}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
              <input
                className={`${inputCls} mb-3`}
                placeholder="Поиск блюда"
                value={menuQuery}
                onChange={(e) => setMenuQuery(e.target.value)}
              />
              <div className={styles.menuGrid}>
                {menuItems.map((i: Any) => (
                  <button
                    key={i.id}
                    className={styles.dish}
                    onClick={() => add(i)}
                  >
                    {i.photo ? (
                      <img className={styles.dishPhoto} src={i.photo} alt="" />
                    ) : (
                      <span className={styles.dishPhoto} />
                    )}
                    <div className={styles.dishBody}>
                      <div className="font-semibold leading-tight">{i.name}</div>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span className={styles.price}>{money(i.price)}</span>
                        {i.cookingMinutes ? <span className={styles.muted}>{i.cookingMinutes} мин</span> : null}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <aside className={styles.pane}>
              <h2 className="mb-3 text-xl font-bold">Счёт</h2>
              <div className={styles.bill}>
                {openOrders.length > 0 && (
                  <div>
                    <p className={`mb-2 font-semibold ${styles.muted}`}>Уже на кухне</p>
                    {openOrders.map((o: Any) => (
                      <div key={o.id} className={styles.ticket}>
                        <div className="flex items-center justify-between">
                          <b>№ {o.number}</b>
                          <span className={`${styles.badge} ${
                            o.status === "READY" ? styles.bReady : o.status === "COOKING" ? styles.bCook : o.status === "DELIVERED" ? styles.bServed : styles.bNew
                          }`}>
                            {STATUS_RU[o.status] || o.status}
                          </span>
                        </div>
                        {(o.lines || []).map((l: Any) => (
                          <p key={l.id} className="mt-1 flex justify-between text-sm">
                            <span>{l.item?.name || l.name} × {l.qty}</span>
                            <span>{money(l.price * l.qty)}</span>
                          </p>
                        ))}
                        {o.status === "READY" && (
                          <button className="btn mt-2 min-h-11 w-full bg-green-600" onClick={() => markServed(o.id)}>
                            Подано гостю
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <p className={`mb-2 font-semibold ${styles.muted}`}>Новые позиции</p>
                  {cart.length === 0 && <p className={styles.muted}>Нажмите блюдо слева — оно попадёт в счёт</p>}
                  {cart.map((x) => (
                    <div key={x.id} className={styles.line}>
                      <span className="pr-2">{x.name}</span>
                      <div className="flex items-center gap-2">
                        <button className={styles.qty} onClick={() => updateQty(x.id, -1)}>−</button>
                        <span className="w-6 text-center font-bold">{x.qty}</span>
                        <button className={styles.qty} onClick={() => updateQty(x.id, 1)}>+</button>
                        <span className="w-20 text-right font-semibold">{money(x.price * x.qty)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.footer}>
                <div className={styles.total}>
                  <span>К оплате</span>
                  <b className={styles.price}>{money(due)}</b>
                </div>
                <div className={styles.actions}>
                  <button className="btn min-h-12" disabled={!cart.length || busy} onClick={sendToKitchen}>
                    На кухню
                  </button>
                  <button
                    className="btn secondary min-h-12"
                    disabled={busy || (!openOrders.length && !cart.length)}
                    onClick={() => setPayOpen(true)}
                  >
                    Оплатить
                  </button>
                </div>
                {table !== "quick" && openOrders.length > 0 && (
                  <button className={styles.danger} onClick={cancelOpen}>
                    Отменить заказ стола
                  </button>
                )}
              </div>
            </aside>
          </div>
        )}

        {activeTab === "reservations" && (
          <section className={`${styles.card} ${styles.scroll}`}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Брони на сегодня и дальше</h2>
              <button className="btn min-h-11" onClick={() => setResFormOpen(true)}>+ Бронь</button>
            </div>
            {upcomingRes.length === 0 && <p className={styles.muted}>Броней нет — создайте первую</p>}
            <div className="grid gap-3">
              {upcomingRes.map((r: Any) => (
                <div key={r.id} className={styles.item}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold">{r.guestName}</p>
                      <p className={styles.muted}>
                        {new Date(r.date).toLocaleString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        {" · "}стол {r.table?.number ?? "любой"} · {r.guests} гостей
                      </p>
                      {r.phone && <p className="text-sm">{r.phone}</p>}
                      {r.note && <p className={styles.muted}>{r.note}</p>}
                    </div>
                    <span className={`rounded-full px-3 py-1 text-sm text-white ${
                      r.status === "Подтверждена" ? "bg-green-600" :
                      r.status === "Посажен" ? "bg-emerald-800" :
                      r.status === "Новая" ? "bg-blue-600" : "bg-gray-500"
                    }`}>{r.status}</span>
                  </div>
                  {r.status !== "Посажен" && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {r.status === "Новая" && (
                        <button className="btn secondary min-h-11" onClick={() => setReservationStatus(r.id, "Подтверждена")}>Подтвердить</button>
                      )}
                      <button className="btn min-h-11" onClick={() => seatGuest(r)}>Посадить</button>
                      <button className="btn secondary min-h-11" onClick={() => setReservationStatus(r.id, "Отменена")}>Отменить</button>
                      <button className="btn secondary min-h-11" onClick={() => setReservationStatus(r.id, "Не пришёл")}>Не пришёл</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "queue" && (
          <div className={styles.queueGrid}>
            <section className={styles.card}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">Ждут стол</h2>
                <button className="btn min-h-11" onClick={() => setQueueFormOpen(true)}>+ В очередь</button>
              </div>
              {waitlist.length === 0 && <p className={styles.muted}>Живой очереди нет</p>}
              {waitlist.map((r: Any, i: number) => {
                const waitMin = Math.max(0, Math.floor((Date.now() - new Date(r.date).getTime()) / 60000));
                return (
                  <div key={r.id} className={styles.item}>
                    <div className="flex justify-between gap-2">
                      <div>
                        <p className="text-lg font-bold">№{i + 1} · {r.guestName}</p>
                        <p className={styles.muted}>{r.guests} гостей · ждут {waitMin} мин{r.phone ? ` · ${r.phone}` : ""}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button className="btn min-h-11 flex-1" onClick={() => seatGuest(r)}>Посадить</button>
                      <button className="btn secondary min-h-11" onClick={() => removeReservation(r.id)}>Убрать</button>
                    </div>
                  </div>
                );
              })}
            </section>
            <section className={styles.card}>
              <h2 className="mb-4 text-xl font-bold">Выдача навынос</h2>
              {pickup.length === 0 && <p className={styles.muted}>Нет заказов без стола</p>}
              {pickup.map((o: Any) => (
                <div key={o.id} className={styles.item}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-lg font-bold">№ {o.number} · {o.source}</p>
                      {(o.tableNumber || o.statusHistory?.[0]?.note) && (
                        <p className="text-sm text-amber-800">{o.tableNumber || o.statusHistory?.[0]?.note}</p>
                      )}
                      <p className="text-sm">
                        {(o.lines || []).map((l: Any) => `${l.item?.name || l.name} × ${l.qty}`).join(", ")}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs text-white ${o.status === "READY" ? "bg-green-600" : "bg-amber-600"}`}>
                      {STATUS_RU[o.status] || o.status}
                    </span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    {o.status === "READY" && (
                      <button className="btn min-h-11 flex-1" onClick={() => patchOrder(o.id, "DONE", "Выдано").then(load)}>
                        Выдать
                      </button>
                    )}
                    <button className="btn secondary min-h-11" onClick={() => patchOrder(o.id, "CANCELLED", "Снят с выдачи").then(load)}>
                      Отмена
                    </button>
                  </div>
                </div>
              ))}
            </section>
          </div>
        )}

        {activeTab === "orders" && (
          <section className={`${styles.card} ${styles.scroll}`}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold">Лента заказов</h2>
              <select className={inputCls + " max-w-48"} value={feedFilter} onChange={(e) => setFeedFilter(e.target.value)}>
                <option>Все</option>
                <option>Зал</option>
                <option>Касса</option>
                <option>Сайт</option>
                <option>Киоск</option>
                <option>Доставка</option>
              </select>
            </div>
            {liveOrders.map((o: Any) => (
              <div key={o.id} className="flex flex-wrap items-start justify-between gap-3 border-b border-[#2a425c] py-3">
                <div>
                  <p className="font-bold">
                    № {o.number} · {o.source}
                    {o.tableNumber ? ` · стол ${o.tableNumber}` : ""}
                  </p>
                  <p className={styles.muted}>
                    {(o.lines || []).map((l: Any) => `${l.item?.name || l.name} × ${l.qty}`).join(", ")}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-block rounded-full px-2 py-1 text-xs text-white ${
                    o.status === "READY" ? "bg-green-600" : o.status === "COOKING" ? "bg-amber-600" : "bg-blue-600"
                  }`}>{STATUS_RU[o.status] || o.status}</span>
                  <div className="mt-1 font-bold">{money(o.total)}</div>
                  {o.tableNumber && (
                    <button className="mt-2 text-sm underline" onClick={() => openTable(o.tableNumber)}>Открыть стол</button>
                  )}
                </div>
              </div>
            ))}
          </section>
        )}
      </div>

      {showNewGuest && (
        <Modal title="Новый гость" onClose={() => setShowNewGuest(false)}>
          <form onSubmit={createGuest} className="space-y-3">
            <input className={inputCls} placeholder="Имя" value={newGuest.name} onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })} required />
            <input className={inputCls} placeholder="Телефон" value={newGuest.phone} onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })} required />
            <button className="btn min-h-12 w-full" type="submit">Сохранить</button>
          </form>
        </Modal>
      )}

      {resFormOpen && (
        <Modal title="Новая бронь" onClose={() => setResFormOpen(false)}>
          <form onSubmit={createReservation} className="space-y-3">
            <input className={inputCls} placeholder="Имя гостя" value={resForm.guestName} onChange={(e) => setResForm({ ...resForm, guestName: e.target.value })} required />
            <input className={inputCls} placeholder="Телефон" value={resForm.phone} onChange={(e) => setResForm({ ...resForm, phone: e.target.value })} />
            <input className={inputCls} type="datetime-local" value={resForm.date} onChange={(e) => setResForm({ ...resForm, date: e.target.value })} required />
            <input className={inputCls} type="number" min={1} value={resForm.guests} onChange={(e) => setResForm({ ...resForm, guests: Number(e.target.value) })} />
            <select className={inputCls} value={resForm.tableNumber} onChange={(e) => setResForm({ ...resForm, tableNumber: e.target.value })}>
              <option value="">Любой стол</option>
              {allTables.map((t: Any) => (
                <option key={t.id || t.number} value={t.number}>Стол {t.number} · {t.seats} мест</option>
              ))}
            </select>
            <textarea className={inputCls} placeholder="Примечание" rows={2} value={resForm.note} onChange={(e) => setResForm({ ...resForm, note: e.target.value })} />
            <button className="btn min-h-12 w-full" type="submit">Создать бронь</button>
          </form>
        </Modal>
      )}

      {queueFormOpen && (
        <Modal title="В очередь на стол" onClose={() => setQueueFormOpen(false)}>
          <form onSubmit={createWaitlist} className="space-y-3">
            <input className={inputCls} placeholder="Имя гостя" value={queueForm.guestName} onChange={(e) => setQueueForm({ ...queueForm, guestName: e.target.value })} required />
            <input className={inputCls} placeholder="Телефон" value={queueForm.phone} onChange={(e) => setQueueForm({ ...queueForm, phone: e.target.value })} />
            <input className={inputCls} type="number" min={1} value={queueForm.guests} onChange={(e) => setQueueForm({ ...queueForm, guests: Number(e.target.value) })} />
            <textarea className={inputCls} placeholder="Примечание" rows={2} value={queueForm.note} onChange={(e) => setQueueForm({ ...queueForm, note: e.target.value })} />
            <button className="btn min-h-12 w-full" type="submit">Добавить</button>
          </form>
        </Modal>
      )}

      {seatPick && (
        <Modal title={`Посадить · ${seatPick.guestName}`} onClose={() => setSeatPick(null)}>
          <p className={`mb-3 ${styles.muted}`}>Выберите свободный стол</p>
          <div className={styles.seatGrid}>
            {allTables.map((t: Any) => {
              const occupied = tableOrders(data.orders, t.number).length > 0;
              return (
                <button
                  key={t.id || t.number}
                  disabled={occupied}
                  className={occupied ? styles.seatOff : styles.seat}
                  onClick={() => seatGuest(seatPick, t.number)}
                >
                  Стол {t.number}{occupied ? " · занят" : ""}
                </button>
              );
            })}
          </div>
        </Modal>
      )}

      {payOpen && (
        <Modal title={table === "quick" ? "Оплата навынос" : `Оплата · стол ${table}`} onClose={() => setPayOpen(false)}>
          <div className="mb-4 flex justify-between text-xl">
            <span>К оплате</span>
            <b>{money(due)}</b>
          </div>
          <div className="mb-3 flex gap-2">
            <input
              className={inputCls}
              placeholder="Гость по телефону"
              value={guestSearch}
              onChange={(e) => setGuestSearch(e.target.value)}
            />
            <button className="btn secondary min-h-12 px-4" type="button" onClick={() => setShowNewGuest(true)}>+</button>
          </div>
          <select className={`${inputCls} mb-3`} value={guest} onChange={(e) => setGuest(Number(e.target.value))}>
            <option value={0}>Без гостя</option>
            {(data.guests || [])
              .filter((g: Any) => !guestSearch || g.phone?.includes(guestSearch) || g.name?.toLowerCase().includes(guestSearch.toLowerCase()))
              .map((g: Any) => (
                <option key={g.id} value={g.id}>{g.name} · {g.phone} · {g.bonuses} бон.</option>
              ))}
          </select>
          <input
            className={`${inputCls} mb-3`}
            type="number"
            min={0}
            max={(data.guests || []).find((g: Any) => g.id === guest)?.bonuses || 0}
            value={bonus}
            onChange={(e) => setBonus(Number(e.target.value))}
            placeholder="Списать бонусы"
          />
          <select className={`${inputCls} mb-4`} value={payment} onChange={(e) => setPayment(e.target.value)}>
            <option>Наличные</option>
            <option>Карта</option>
            <option>QR/СБП</option>
          </select>
          <button className="btn min-h-12 w-full" disabled={busy || due < 0} onClick={payTable}>Закрыть стол</button>
        </Modal>
      )}

      {receipt && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-black/70 p-5">
          <div className={styles.receipt}>
            <div className="mb-2 flex justify-between">
              <b>КАФЕ «ЛУНА»</b>
              <button onClick={() => setReceipt(null)}>×</button>
            </div>
            <p>Заказ №{receipt.number}</p>
            <p>{receipt.source}{receipt.tableNumber ? ` · стол ${receipt.tableNumber}` : ""}</p>
            <hr className="my-3" />
            {(receipt.lines || []).map((l: Any) => (
              <p className="flex justify-between" key={l.id || l.itemId}>
                <span>{l.item?.name || l.name} × {l.qty}</span>
                <span>{money((l.price || 0) * l.qty)}</span>
              </p>
            ))}
            <hr className="my-3" />
            <p className="flex justify-between font-bold">
              <span>Итого</span>
              <span>{money(receipt.total || 0)}</span>
            </p>
            <p className="mt-2 text-sm">Оплата: {payment}</p>
            <button className="btn mt-4 min-h-12 w-full" onClick={() => setReceipt(null)}>Готово</button>
          </div>
        </div>
      )}
    </main>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold">{title}</h3>
          <button className="text-3xl leading-none" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
