"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import Link from "next/link";

const labels: Record<string, string> = { dashboard: "Дашборд", menu: "Меню", recipes: "Техкарты", stock: "Склад", suppliers: "Поставщики", orders: "Заказы", delivery: "Доставка", guests: "Гости", clients: "Клиенты", loyalty: "Лояльность", hall: "Зал и брони", staff: "Сотрудники", reports: "Отчёты", finance: "Финансы", settings: "Настройки", audit: "Журнал действий" };
const input = "w-full rounded-lg bg-[#15263c] p-3 text-sm";
function Card({ children }: { children: React.ReactNode }) { return <section className="panel p-5">{children}</section>; }
function Form({ children, onSubmit }: { children: React.ReactNode; onSubmit: (e: React.FormEvent) => void }) { return <form onSubmit={onSubmit} className="space-y-3">{children}<button className="btn">Сохранить</button></form>; }
function downloadCsv(filename: string, rows: Array<Array<string | number | boolean>>) {
  const escape = (value: string | number | boolean) => String(value ?? "").replace(/"/g, '""');
  const text = rows.map(row => row.map(cell => `"${escape(cell)}"`).join(",")).join("\n");
  const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
function formatMoney(value: number) { return new Intl.NumberFormat("ru-RU").format(value) + " ₽"; }
export default function AdminSection({ section }: { section: string }) {
  const [data, setData] = useState<any>({}), [message, setMessage] = useState(""), [collapsed, setCollapsed] = useState(false);
  const load = () => fetch(`/api/admin/control?section=${section}`).then(async r => { if (!r.ok) throw new Error((await r.json()).error); return r.json(); }).then(setData).catch(e => setMessage(e.message));
  useEffect(() => { load(); setCollapsed(false); }, [section]);
  async function save(body: any) { const r = await fetch("/api/admin/control", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); const result = await r.json(); if (!r.ok) setMessage(result.error); else { setMessage("Изменения сохранены"); load(); } }
  const title = labels[section] ?? "Раздел";
  if (message.startsWith("Недостаточно") || message === "Не авторизован") return <Card><h1 className="text-2xl font-bold">Нет доступа</h1><p className="muted mt-2">{message}</p></Card>;
  return <div><div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="muted text-sm">Админ-панель / {title}</p><h1 className="text-3xl font-bold">{title}</h1></div><div className="flex items-center gap-2">{message && <p className="accent text-sm">{message}</p>}<button type="button" className="btn secondary text-xs" onClick={() => setCollapsed((prev) => !prev)}>{collapsed ? "Показать блоки" : "Скрыть блоки"}</button></div></div>{!collapsed && <>{section === "dashboard" && <Dashboard data={data} />}{section === "menu" && <Menu data={data} save={save} />}{section === "site" && <SiteEditor data={data} save={save} />}{section === "stock" && <Stock data={data} save={save} />}{section === "suppliers" && <Suppliers data={data} save={save} />}{section === "orders" && <Orders data={data} save={save} />}{section === "delivery" && <Delivery data={data} save={save} />}{section === "clients" && <Clients data={data} save={save} />}{section === "guests" && <Guests data={data} save={save} />}{section === "loyalty" && <Loyalty data={data} save={save} />}{section === "hall" && <Hall data={data} save={save} />}{section === "staff" && <Staff data={data} save={save} />}{section === "reports" && <Reports data={data} />}{section === "finance" && <Finance data={data} save={save} />}{section === "settings" && <Settings data={data} save={save} />}{section === "audit" && <Audit data={data} />}{section === "recipes" && <Recipes data={data} />}</>}</div>;
}
function Dashboard({ data }: any) { 
  const m = data.metrics ?? {};
  const [showQuickOrder, setShowQuickOrder] = useState(false);
  const exportSummary = () => downloadCsv("crm-summary.csv", [
    ["метрика", "значение"],
    ["выручка сегодня", m.revenue ?? 0],
    ["выручка 7 дней", (m.revenue7 ?? []).reduce((s: number, x: any) => s + x.revenue, 0)],
    ["активные заказы", m.active ?? 0],
    ["столики заняты", `${m.occupied ?? 0}/${m.tables ?? 0}`],
    ["низкие остатки", (m.lowStock ?? []).length],
  ]);
  
  return (
    <div className="space-y-6">
      {/* Быстрые действия */}
      <Card>
        <h2 className="mb-4 text-xl font-bold">⚡ Быстрые действия</h2>
        <div className="flex gap-3 flex-wrap">
          <button 
            className="btn bg-[#2d5a3d]"
            onClick={() => setShowQuickOrder(!showQuickOrder)}
          >
            🛒 Быстрый заказ
          </button>
          <button className="btn secondary" onClick={exportSummary}>📥 CSV сводки</button>
          <a href="/pos" className="btn secondary">🪑 POS (Столики)</a>
          <a href="/kds" className="btn secondary">👨‍🍳 KDS (Кухня)</a>
          <a href="/crm" className="btn secondary">📊 CRM</a>
        </div>
        
        {showQuickOrder && (
          <div className="mt-4 p-4 bg-[#15263c] rounded-lg">
            <p className="muted text-sm mb-3">Создать быстрый заказ без привязки к столу</p>
            <a href="/pos" className="btn">Открыть POS для быстрого заказа</a>
          </div>
        )}
      </Card>

      {/* Основные метрики */}
      <div className="grid gap-5 md:grid-cols-4">
        <Card>
          <p className="muted">Выручка сегодня</p>
          <b className="text-2xl accent">{m.revenue ?? 0} ₽</b>
        </Card>
        <Card>
          <p className="muted">Выручка за 7 дней</p>
          <b className="text-2xl">{(m.revenue7 ?? []).reduce((s: number, x: any) => s + x.revenue, 0)} ₽</b>
        </Card>
        <Card>
          <p className="muted">Активные заказы</p>
          <b className="text-2xl">{m.active ?? 0}</b>
        </Card>
        <Card>
          <p className="muted">Фудкост</p>
          <b className="text-2xl">{m.foodCost ?? 0}%</b>
        </Card>
      </div>

      {/* Детальная информация */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <h2 className="font-bold">Выручка по дням</h2>
          {(m.revenue7 ?? []).map((x: any) => (
            <p className="mt-2 flex justify-between text-sm" key={x.date}>
              <span>{x.date.slice(5)}</span>
              <b>{x.revenue} ₽</b>
            </p>
          ))}
        </Card>
        <Card>
          <h2 className="font-bold">Топ блюд за 7 дней</h2>
          {(m.topItems ?? []).map((x: any) => (
            <p className="mt-2 flex justify-between text-sm" key={x.name}>
              <span>{x.name} · {x.qty} порц.</span>
              <b>{x.revenue} ₽</b>
            </p>
          ))}
        </Card>
        <Card>
          <h2 className="font-bold">Загрузка зала</h2>
          <p className="mt-3 text-3xl accent">{m.occupied ?? 0}/{m.tables ?? 0}</p>
          <p className="muted">занятые столы / всего</p>
          <h2 className="mt-5 font-bold">Ближайшие брони</h2>
          {(data.reservations ?? []).slice(0, 3).map((r: any) => (
            <p className="mt-2 text-sm" key={r.id}>{new Date(r.date).toLocaleString("ru-RU")} · {r.guestName}</p>
          ))}
        </Card>
        <Card>
          <h2 className="font-bold">Стоп-лист · {m.stop ?? 0}</h2>
          {(m.stopItems ?? []).map((i: any) => (
            <p className="mt-2 text-sm text-red-300" key={i.id}>{i.name}</p>
          ))}
          <h2 className="mt-5 font-bold">Низкие остатки</h2>
          {(m.lowStock ?? []).map((i: any) => (
            <p className="mt-2 text-sm text-yellow-300" key={i.id}>{i.name}: {i.stock} {i.unit} / минимум {i.minStock}</p>
          ))}
        </Card>
      </div>
    </div>
  );
}
function Menu({ data, save }: any) { const [categoryForm, setCategoryForm] = useState<any>({ name: "", color: "#d8b45b" }); const [itemForm, setItemForm] = useState<any>({ name: "", description: "", price: 390, cost: 180, categoryId: 0, workshop: "бар", dailyLimit: 30 }); const [expandedCategories, setExpandedCategories] = useState<number[]>([]); const [showCategoryBlock, setShowCategoryBlock] = useState(false); const [showItemBlock, setShowItemBlock] = useState(false); useEffect(() => { const fallback = data.categories?.[0]?.id ?? 0; if (!itemForm.categoryId && fallback) setItemForm((prev: any) => ({ ...prev, categoryId: fallback })); else if (itemForm.categoryId && !data.categories?.some((c: any) => c.id === itemForm.categoryId)) setItemForm((prev: any) => ({ ...prev, categoryId: fallback })); }, [data.categories]); useEffect(() => { if ((data.categories ?? []).length && expandedCategories.length === 0) setExpandedCategories((data.categories ?? []).map((c: any) => c.id)); }, [data.categories]); const remove = async (entity: string, id: number) => { if (!confirm(entity === "category" ? "Удалить категорию? Категория с блюдами не удаляется." : "Удалить блюдо?")) return; const r = await fetch("/api/admin/control", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ entity, id }) }); if (!r.ok) alert((await r.json()).error || "Не удалось удалить"); else location.reload(); }; const available = (i: any) => { const portions = i.ingredients?.length ? Math.min(...i.ingredients.map((r: any) => Math.floor(r.ingredient.stock / r.grams))) : i.stock; return Math.max(0, Math.min(i.dailyLimit ?? 999999, portions)); }; const isExpanded = (id: number) => expandedCategories.includes(id); const toggleCategory = (id: number) => setExpandedCategories((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]); const exportMenu = () => downloadCsv("menu.csv", [["название", "категория", "цена", "себестоимость", "доступно", "статус"], ...((data.items ?? []).map((i: any) => [i.name, (data.categories ?? []).find((c: any) => c.id === i.categoryId)?.name ?? "", i.price, i.cost, available(i), i.active ? "активно" : "в стоп-листе"]))]); return <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]"><Card><div className="mb-4 rounded-2xl border border-[#30425a] bg-[#14253b] p-3 shadow-[0_2px_12px_rgba(0,0,0,0.22)]"><button type="button" className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left transition hover:bg-[#1b3046]" onClick={() => setShowCategoryBlock((prev) => !prev)}><div><h3 className="font-semibold text-slate-100">Новая категория</h3><p className="mt-1 text-xs text-slate-400">Добавьте новую категорию меню</p></div><span className={`inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#3a5168] bg-[#172a3f] text-sm ${showCategoryBlock ? "text-emerald-300" : "text-slate-300"}`}>{showCategoryBlock ? "▾" : "▸"}</span></button>{showCategoryBlock && <div className="mt-3"><Form onSubmit={e => { e.preventDefault(); save({ entity: "category", name: categoryForm.name, color: categoryForm.color }); setCategoryForm({ name: "", color: "#d8b45b" }); }}><div className="flex items-center gap-2"><input className={input} placeholder="Название категории" required value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} /><label className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[#2d4b66] bg-[#15263c] p-1" title="Выбрать цвет категории"><input className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent p-0" type="color" value={categoryForm.color} onChange={e => setCategoryForm({ ...categoryForm, color: e.target.value })} /><span className="sr-only">Выбрать цвет</span></label></div></Form></div>}</div><div className="rounded-2xl border border-[#30425a] bg-[#14253b] p-3 shadow-[0_2px_12px_rgba(0,0,0,0.22)]"><button type="button" className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left transition hover:bg-[#1b3046]" onClick={() => setShowItemBlock((prev) => !prev)}><div><h3 className="font-semibold text-slate-100">Новое блюдо</h3><p className="mt-1 text-xs text-slate-400">Создайте новое блюдо с параметрами</p></div><span className={`inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#3a5168] bg-[#172a3f] text-sm ${showItemBlock ? "text-emerald-300" : "text-slate-300"}`}>{showItemBlock ? "▾" : "▸"}</span></button>{showItemBlock && <div className="mt-3"><Form onSubmit={e => { e.preventDefault(); const categoryId = Number(itemForm.categoryId || data.categories?.[0]?.id || 0); save({ entity: "item", ...itemForm, categoryId, price: Number(itemForm.price), cost: Number(itemForm.cost || 0), dailyLimit: itemForm.dailyLimit ? Number(itemForm.dailyLimit) : null, workshop: itemForm.workshop || "бар" }); setItemForm({ name: "", description: "", price: 390, cost: 180, categoryId, workshop: "бар", dailyLimit: 30 }); }}><input className={input} placeholder="Название блюда" required value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })} /><textarea className={input} placeholder="Короткое описание" value={itemForm.description} onChange={e => setItemForm({ ...itemForm, description: e.target.value })} /><div className="grid gap-3 sm:grid-cols-2"><input className={input} type="number" placeholder="Цена" value={itemForm.price} onChange={e => setItemForm({ ...itemForm, price: Number(e.target.value) })} /><input className={input} type="number" placeholder="Себестоимость" value={itemForm.cost} onChange={e => setItemForm({ ...itemForm, cost: Number(e.target.value) })} /></div><div className="grid gap-3 sm:grid-cols-2"><input className={input} type="number" placeholder="Лимит порций" value={itemForm.dailyLimit} onChange={e => setItemForm({ ...itemForm, dailyLimit: Number(e.target.value) })} /><select className={input} value={itemForm.workshop} onChange={e => setItemForm({ ...itemForm, workshop: e.target.value })}><option value="бар">Бар</option><option value="кухня">Кухня</option><option value="пекарня">Пекарня</option></select></div><select className={input} value={itemForm.categoryId} onChange={e => setItemForm({ ...itemForm, categoryId: Number(e.target.value) })}>{(data.categories ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Form></div>}</div></Card><Card><div className="mb-4 flex items-center justify-between gap-2"><h2 className="text-xl font-bold">Категории и блюда</h2><button className="btn secondary text-xs" onClick={exportMenu}>📥 CSV меню</button></div><div className="mb-4 rounded-lg border border-[#2d4b66] bg-[#14253b] p-3"><p className="text-sm font-semibold">Список меню</p><p className="mt-1 text-xs text-slate-300">Скрывайте и разворачивайте категории, чтобы быстро ориентироваться по структуре.</p></div>{(data.categories ?? []).map((c: any) => { const expanded = isExpanded(c.id); return <div className="mb-3 rounded-2xl border border-[#30425a] bg-[#14253b] p-3 shadow-[0_2px_12px_rgba(0,0,0,0.22)]" key={c.id}><div className="flex items-center justify-between gap-3"><button type="button" className="flex flex-1 items-center gap-2 rounded-lg px-2 py-2 text-left transition hover:bg-[#1b3046]" onClick={() => toggleCategory(c.id)}><span className={`inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#3a5168] bg-[#172a3f] text-sm ${expanded ? "text-emerald-300" : "text-slate-300"}`}>{expanded ? "▾" : "▸"}</span><span className="font-semibold text-slate-100">{c.name}</span></button><button type="button" className="btn secondary text-xs" onClick={() => remove("category", c.id)}>Удалить</button></div>{expanded && <div className="mt-3 space-y-2">{(data.items ?? []).filter((i: any) => i.categoryId === c.id).length === 0 ? <div className="rounded-lg border border-dashed border-[#30425a] bg-[#101d30] px-3 py-2 text-sm text-slate-400">Пока пусто — добавьте блюдо в эту категорию.</div> : (data.items ?? []).filter((i: any) => i.categoryId === c.id).map((i: any) => <div className="rounded-lg border border-[#2d4b66] bg-[#10213a] px-3 py-3" key={i.id}><div className="flex flex-wrap items-center justify-between gap-2"><div className="min-w-0"><a className="font-semibold text-[#7dd3fc]" href={`/admin/menu/${i.id}`}>{i.name}</a>{i.description ? <div className="mt-1 text-xs text-slate-400">{i.description}</div> : null}</div><div className="flex items-center gap-2"><span className="rounded-full bg-[#1c3146] px-2.5 py-1 text-xs font-medium text-slate-200">{i.price} ₽</span><span className={available(i) <= 0 ? "rounded-full bg-red-500/15 px-2.5 py-1 text-xs text-red-300" : "rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs text-emerald-300"}>Остаток: {available(i)}</span></div></div><div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#233650] pt-2 text-xs text-slate-400"><span>Лимит: {i.dailyLimit ?? "без лимита"} · {i.workshop ?? "бар"}</span><div className="flex gap-2"><button type="button" className="btn secondary text-xs" onClick={() => save({ entity: "item", id: i.id, ...i, active: !i.active })}>{i.active ? "В стоп-лист" : "Снять со стопа"}</button><button type="button" className="btn secondary text-xs" onClick={() => remove("item", i.id)}>Удалить</button></div></div></div>)}</div>}</div>; })}</Card></div>; }
function Stock({ data, save }: any) { const [form, setForm] = useState<any>({ ingredientId: data.ingredients?.[0]?.id ?? 0, type: "Приход", quantity: 100, reason: "" }); const lowStockItems = (data.ingredients ?? []).filter((i: any) => i.stock <= i.minStock); const exportStock = () => downloadCsv("stock.csv", [["ингредиент", "остаток", "единица", "минимум", "статус"], ...lowStockItems.map((i: any) => [i.name, i.stock, i.unit, i.minStock, i.stock <= i.minStock ? "дефицит" : "норма"])]); return <div className="grid gap-5 lg:grid-cols-[1fr_360px]"><Card><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold">Остатки и движения</h2><div className="flex gap-2"><button className="btn secondary text-xs" onClick={exportStock}>📥 CSV остатков</button><button className="btn secondary text-xs" onClick={() => lowStockItems.forEach((i: any) => save({ entity: "purchaseRequest", ingredientId: i.id, quantity: Math.max(0, i.minStock * 2 - i.stock) }))}>Создать заявки</button></div></div>{lowStockItems.length > 0 && <div className="mb-3 rounded-lg border border-yellow-600/40 bg-[#243143] p-3 text-sm text-yellow-200">⚠ Требуют внимания: {lowStockItems.map((i: any) => i.name).join(", ")}</div>} {(data.ingredients ?? []).map((i: any) => <p className={`flex justify-between border-b border-[#30425a] py-2 text-sm ${i.stock <= i.minStock ? "text-yellow-300" : "text-emerald-300"}`} key={i.id}><span>{i.name}</span><b>{i.stock} {i.unit} · мин. {i.minStock}</b></p>)}<h2 className="mb-3 mt-6 font-bold">Последние движения</h2>{(data.movements ?? []).slice(0, 20).map((m: any) => <p className="border-b border-[#233650] py-2 text-xs" key={m.id}>{new Date(m.createdAt).toLocaleString("ru-RU")} · {m.type} · {m.ingredient.name} · {m.reason}</p>)}</Card><Card><h2 className="mb-4 text-xl font-bold">Документ</h2><Form onSubmit={e => { e.preventDefault(); save({ entity: "movement", ...form }); }}><select className={input} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option>Приход</option><option>Списание</option></select><select className={input} value={form.ingredientId} onChange={e => setForm({ ...form, ingredientId: Number(e.target.value) })}>{(data.ingredients ?? []).map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}</select><input className={input} type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} /><select className={input} value={form.supplierId ?? 0} onChange={e => setForm({ ...form, supplierId: Number(e.target.value) })}><option value={0}>Поставщик</option>{(data.suppliers ?? []).map((x: any) => <option key={x.id} value={x.id}>{x.name}</option>)}</select><input className={input} type="number" placeholder="Стоимость" value={form.price ?? ""} onChange={e => setForm({ ...form, price: Number(e.target.value) })} /><input className={input} placeholder="Причина" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} /></Form></Card></div>; }
function Suppliers({ data, save }: any) { const [form, setForm] = useState<any>({ name: "", phone: "", email: "", priceList: "" }); return <div className="grid gap-5 lg:grid-cols-[1fr_360px]"><Card><h2 className="mb-3 font-bold">Поставщики и прайсы</h2>{(data.suppliers ?? []).map((s: any) => <div className="flex justify-between border-b border-[#30425a] py-3 text-sm" key={s.id}><span>{s.name}<small className="muted block">{s.phone} · {s.email} · прайс: {s.priceList || "не задан"}</small></span><button className="text-xs text-red-300" onClick={() => fetch("/api/admin/control", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ entity: "supplier", id: s.id }) }).then(() => location.reload())}>Удалить</button></div>)}</Card><Card><h2 className="mb-4 text-xl font-bold">Новый поставщик</h2><Form onSubmit={e => { e.preventDefault(); save({ entity: "supplier", ...form }); }}><input className={input} placeholder="Название" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /><input className={input} placeholder="Телефон" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /><input className={input} placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /><input className={input} placeholder="Комментарий" value={form.note ?? ""} onChange={e => setForm({ ...form, note: e.target.value })} /><input className={input} placeholder="Прайс-лист / URL" value={form.priceList} onChange={e => setForm({ ...form, priceList: e.target.value })} /></Form></Card></div>; }
function Orders({ data, save }: any) { const [filter, setFilter] = useState<any>({ source: "Все", status: "Все", guest: "", min: "", max: "" }); const [opened, setOpened] = useState<number | null>(null); const labels: any = { NEW: "Новый", COOKING: "Готовится", READY: "Готов", DONE: "Выдан", DELIVERY_ASSIGNED: "Курьер назначен", IN_DELIVERY: "В доставке", DELIVERED: "Доставлен", CANCELLED: "Отменён" }; const orders = (data.orders ?? []).filter((o: any) => (filter.source === "Все" || o.source === filter.source) && (filter.status === "Все" || o.status === filter.status) && (!filter.guest || String(o.guest?.name ?? "").toLowerCase().includes(filter.guest.toLowerCase())) && (filter.min === "" || o.total >= Number(filter.min)) && (filter.max === "" || o.total <= Number(filter.max))); return <Card><h2 className="mb-4 font-bold">Заказы</h2><div className="mb-4 grid gap-2 md:grid-cols-5"><select className={input} value={filter.source} onChange={e => setFilter({ ...filter, source: e.target.value })}><option>Все</option><option>Сайт</option><option>Киоск</option><option>Зал</option><option>Доставка</option></select><select className={input} value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}><option>Все</option>{Object.entries(labels).map(([k, v]) => <option value={k} key={k}>{v as string}</option>)}</select><input className={input} placeholder="Гость" value={filter.guest} onChange={e => setFilter({ ...filter, guest: e.target.value })} /><input className={input} type="number" placeholder="Сумма от" value={filter.min} onChange={e => setFilter({ ...filter, min: e.target.value })} /><input className={input} type="number" placeholder="Сумма до" value={filter.max} onChange={e => setFilter({ ...filter, max: e.target.value })} /></div><div className="overflow-auto"><table className="w-full text-left text-sm"><thead><tr><th>Номер</th><th>Канал</th><th>Статус</th><th>Гость</th><th>Состав</th><th>Сумма</th><th>Операции</th></tr></thead><tbody>{orders.map((o: any) => <tr className="border-t border-[#30425a]" key={o.id}><td className="py-3">№ {o.number}</td><td>{o.source}</td><td>{labels[o.status] ?? o.status}</td><td>{o.guest?.name ?? "—"}</td><td>{o.lines.map((l: any) => `${l.item.name} × ${l.qty}`).join(", ")}</td><td>{o.total} ₽{o.discount > 0 && <small className="text-emerald-300 block">Скидка: {o.discount} ₽</small>}<small className="muted block">История: {o.statusHistory?.length ?? 0}</small></td><td><button className="btn secondary text-xs" onClick={() => setOpened(opened === o.id ? null : o.id)}>Карточка</button>{opened === o.id && <div className="fixed inset-0 z-10 grid place-items-center bg-black/70 p-5"><div className="panel max-h-[80vh] w-full max-w-2xl overflow-auto p-6"><div className="flex justify-between"><h3 className="text-xl font-bold">Заказ №{o.number}</h3><button onClick={() => setOpened(null)}>×</button></div><p className="muted mt-2">{labels[o.status] ?? o.status} · {o.source} · {o.total} ₽</p><h4 className="mt-5 font-bold">История статусов</h4>{(o.statusHistory ?? []).map((h: any) => <p className="border-b border-[#30425a] py-2 text-sm" key={h.id}>{new Date(h.createdAt).toLocaleString("ru-RU")} · {labels[h.status] ?? h.status} · {h.note}</p>)}<h4 className="mt-5 font-bold">Оплаты</h4>{(o.payments ?? []).map((p: any) => <p key={p.id}>{p.type}: {p.amount} ₽</p>)}<button className="btn mt-5" disabled={o.status === "CANCELLED"} onClick={() => { const reason = prompt("Причина отмены", "Ошибка гостя"); if (reason) { setOpened(null); save({ entity: "cancelOrder", orderId: o.id, reason }); } }}>Отменить и вернуть</button></div></div>}</td></tr>)}</tbody></table></div></Card>; }
function Delivery({ data, save }: any) { const [form, setForm] = useState<any>({ name: "", phone: "" }), [zone, setZone] = useState<any>({ name: "", minOrder: 500, fee: 150, eta: 40 }), [orderId, setOrderId] = useState(0), [courierId, setCourierId] = useState(0); return <div className="grid gap-5 lg:grid-cols-2"><Card><h2 className="mb-3 font-bold">Курьеры</h2>{(data.couriers ?? []).map((c: any) => <p className="flex justify-between border-b border-[#30425a] py-2" key={c.id}>{c.name}<span className="muted">{c.phone} · <select className="rounded bg-[#15263c] p-1" value={c.status} onChange={e => save({ entity: "courier", id: c.id, name: c.name, phone: c.phone, status: e.target.value })}><option>Свободен</option><option>Занят</option><option>На линии</option></select> <button className="text-red-300" onClick={() => fetch("/api/admin/control", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ entity: "courier", id: c.id }) }).then(() => location.reload())}>×</button></span></p>)}<Form onSubmit={e => { e.preventDefault(); save({ entity: "courier", ...form }); }}><input className={input} placeholder="Имя" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /><input className={input} placeholder="Телефон" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Form></Card><Card><h2 className="mb-3 font-bold">Назначение курьера</h2><select className={input} value={orderId} onChange={e => setOrderId(Number(e.target.value))}><option value={0}>Заказ доставки</option>{(data.orders ?? []).filter((o: any) => o.source === "Доставка").map((o: any) => <option value={o.id} key={o.id}>№ {o.number}</option>)}</select><select className="mt-3 w-full rounded-lg bg-[#15263c] p-3" value={courierId} onChange={e => setCourierId(Number(e.target.value))}><option value={0}>Курьер</option>{(data.couriers ?? []).map((c: any) => <option value={c.id} key={c.id}>{c.name}</option>)}</select><button className="btn mt-3" onClick={() => save({ entity: "assignCourier", orderId, courierId })}>Назначить</button><select className="mt-3 w-full rounded-lg bg-[#15263c] p-3" onChange={e => orderId && save({ entity: "deliveryStatus", orderId, status: e.target.value })}><option>Статус доставки</option><option value="DELIVERY_ASSIGNED">Курьер назначен</option><option value="IN_DELIVERY">В пути</option><option value="DELIVERED">Доставлен</option><option value="CANCELLED">Отменен</option></select><h2 className="mb-3 mt-7 font-bold">Заказы доставки</h2>{(data.orders ?? []).filter((o: any) => o.source === "Доставка").map((o: any) => <p className="border-b border-[#30425a] py-2 text-sm" key={o.id}>№ {o.number} · {o.courier?.name ?? "курьер не назначен"} · {({ DELIVERY_ASSIGNED: "Курьер назначен", IN_DELIVERY: "В пути", DELIVERED: "Доставлен", CANCELLED: "Отменён" } as any)[o.status] ?? o.status}</p>)}<h2 className="mb-3 mt-7 font-bold">Зоны доставки</h2>{(data.zones ?? []).map((z: any) => <p className="border-b border-[#30425a] py-2 text-sm" key={z.id}>{z.name} · от {z.minOrder} ₽ · {z.fee} ₽ · {z.eta} мин. <button className="text-red-300" onClick={() => fetch("/api/admin/control", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ entity: "zone", id: z.id }) }).then(() => location.reload())}>Удалить</button></p>)}<Form onSubmit={e => { e.preventDefault(); save({ entity: "zone", ...zone }); }}><input className={input} placeholder="Район" required value={zone.name} onChange={e => setZone({ ...zone, name: e.target.value })} /><div className="grid grid-cols-3 gap-2"><input className={input} type="number" value={zone.minOrder} onChange={e => setZone({ ...zone, minOrder: Number(e.target.value) })} /><input className={input} type="number" value={zone.fee} onChange={e => setZone({ ...zone, fee: Number(e.target.value) })} /><input className={input} type="number" value={zone.eta} onChange={e => setZone({ ...zone, eta: Number(e.target.value) })} /></div></Form></Card></div>; }
function Guests({ data, save }: any) { const [guestId, setGuestId] = useState(0), [amount, setAmount] = useState(100), [tags, setTags] = useState(""), [mergeId, setMergeId] = useState(0); return <Card><h2 className="mb-4 font-bold">Гости, RFM и бонусы</h2>{(data.guests ?? []).map((g: any) => <div className="flex flex-wrap justify-between gap-2 border-b border-[#30425a] py-3" key={g.id}><span>{g.name}<small className="muted ml-3">{g.phone} · {g.tags || "без тегов"}</small></span><span className="accent">{g.bonuses} бонусов · {g.orders?.length > 2 ? "Лояльный" : "Новый"} <button className="btn secondary ml-2 text-xs" onClick={() => setGuestId(g.id)}>Выбрать</button><button className="btn secondary ml-2 text-xs" onClick={() => save({ entity: "guest", id: g.id, name: g.name, phone: g.phone, tags })}>Сохранить теги</button></span></div>)}{guestId > 0 && <div className="mt-5 flex flex-wrap gap-2"><input className={input} placeholder="Теги" value={tags} onChange={e => setTags(e.target.value)} /><select className={input} value={mergeId} onChange={e => setMergeId(Number(e.target.value))}><option value={0}>Слить с...</option>{(data.guests ?? []).filter((g: any) => g.id !== guestId).map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}</select><button className="btn secondary" onClick={() => mergeId && save({ entity: "guestMerge", fromId: guestId, toId: mergeId })}>Слить дубликат</button><input className={input} type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} /><button className="btn" onClick={() => save({ entity: "guestBonus", guestId, amount, direction: "add" })}>Начислить</button><button className="btn secondary" onClick={() => save({ entity: "guestBonus", guestId, amount, direction: "subtract" })}>Списать</button></div>}</Card>; }
function Loyalty({ data, save }: any) { const [promo, setPromo] = useState<any>({ code: "", discount: 10 }), [promotion, setPromotion] = useState<any>({ name: "", condition: "", action: "Скидка 10%" }), [campaign, setCampaign] = useState<any>({ name: "", segment: "Все", channel: "Telegram" }), [combo, setCombo] = useState<any>({ name: "", itemIds: "", price: 0 }), [rule, setRule] = useState<any>({ name: "Стандартная программа", earnPercent: 5, redeemLimit: 50, expiryDays: 365 }); return <div className="grid gap-5 lg:grid-cols-2"><Card><h2 className="mb-4 font-bold">Акции, промокоды и бонусные правила</h2>{(data.promotions ?? []).map((p: any) => <p className="border-b border-[#30425a] py-2" key={p.id}>{p.name} · {p.action}</p>)}{(data.promocodes ?? []).map((p: any) => <p className="border-b border-[#30425a] py-2" key={p.id}>Промокод <b>{p.code}</b> · скидка {p.discount}% · использован {p.used}</p>)}{(data.bonusRules ?? []).map((r: any) => <p className="border-b border-[#30425a] py-2 text-sm" key={r.id}>{r.name}: {r.earnPercent}% · лимит {r.redeemLimit}% · сгорание {r.expiryDays} дней</p>)}<h2 className="mb-3 mt-6 font-bold">Рассылки</h2>{(data.campaigns ?? []).map((c: any) => <p className="text-sm" key={c.id}>{c.name} · {c.delivered}/{c.sent} доставлено</p>)}</Card><Card><h2 className="mb-4 font-bold">Новый промокод</h2><Form onSubmit={e => { e.preventDefault(); save({ entity: "promocode", ...promo }); }}><input className={input} placeholder="Код" required value={promo.code} onChange={e => setPromo({ ...promo, code: e.target.value })} /><input className={input} type="number" value={promo.discount} onChange={e => setPromo({ ...promo, discount: Number(e.target.value) })} /></Form><h2 className="mb-4 mt-6 font-bold">Акция</h2><Form onSubmit={e => { e.preventDefault(); save({ entity: "promotion", ...promotion }); }}><input className={input} placeholder="Название акции" required value={promotion.name} onChange={e => setPromotion({ ...promotion, name: e.target.value })} /><input className={input} placeholder="Условие" value={promotion.condition} onChange={e => setPromotion({ ...promotion, condition: e.target.value })} /><input className={input} placeholder="Действие" value={promotion.action} onChange={e => setPromotion({ ...promotion, action: e.target.value })} /></Form><h2 className="mb-4 mt-6 font-bold">Рассылка и комбо</h2><Form onSubmit={e => { e.preventDefault(); save({ entity: "campaign", ...campaign }); }}><input className={input} placeholder="Название рассылки" required value={campaign.name} onChange={e => setCampaign({ ...campaign, name: e.target.value })} /><input className={input} placeholder="Сегмент" value={campaign.segment} onChange={e => setCampaign({ ...campaign, segment: e.target.value })} /></Form><Form onSubmit={e => { e.preventDefault(); save({ entity: "combo", ...combo }); }}><input className={input} placeholder="Название комбо" required value={combo.name} onChange={e => setCombo({ ...combo, name: e.target.value })} /><input className={input} placeholder="ID блюд через запятую" value={combo.itemIds} onChange={e => setCombo({ ...combo, itemIds: e.target.value })} /><input className={input} type="number" placeholder="Цена" value={combo.price} onChange={e => setCombo({ ...combo, price: Number(e.target.value) })} /></Form><h2 className="mb-4 mt-6 font-bold">Бонусное правило</h2><Form onSubmit={e => { e.preventDefault(); save({ entity: "bonusRule", ...rule }); }}><input className={input} value={rule.name} onChange={e => setRule({ ...rule, name: e.target.value })} /><input className={input} type="number" value={rule.earnPercent} onChange={e => setRule({ ...rule, earnPercent: Number(e.target.value) })} /><input className={input} type="number" value={rule.redeemLimit} onChange={e => setRule({ ...rule, redeemLimit: Number(e.target.value) })} /></Form></Card></div>; }
function Hall({ data, save }: any) { const [hall, setHall] = useState<any>({ name: "Новый зал" }), [table, setTable] = useState<any>({ number: "", seats: 2, hallId: 0 }), [form, setForm] = useState<any>({ guestName: "", phone: "", guests: 2, date: new Date().toISOString().slice(0, 16), hallId: 0, tableId: 0, status: "Новая" }); return <div className="grid gap-5 lg:grid-cols-2"><Card><h2 className="mb-4 font-bold">Залы и столы</h2>{(data.halls ?? []).map((h: any) => <div className="mb-5" key={h.id}><div className="flex items-center justify-between"><h3 className="font-bold">{h.name}</h3><button className="btn secondary text-xs" onClick={() => save({ entity: "hall", id: h.id, name: `${h.name} · обновлено` })}>Переименовать</button></div><div className="mt-3 grid grid-cols-4 gap-2">{h.tables.map((t: any) => <div className="rounded-lg bg-[#193653] p-3 text-center text-sm" key={t.id}>Стол {t.number}<small className="muted block">{t.seats} мест</small><button className="mt-2 text-xs text-red-300" onClick={() => fetch("/api/admin/control", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ entity: "table", id: t.id }) }).then(() => location.reload())}>Удалить</button></div>)}</div></div>)}<Form onSubmit={e => { e.preventDefault(); save({ entity: "hall", ...hall }); }}><input className={input} placeholder="Название нового зала" value={hall.name} onChange={e => setHall({ name: e.target.value })} /></Form><Form onSubmit={e => { e.preventDefault(); save({ entity: "table", ...table, hallId: table.hallId || data.halls?.[0]?.id }); }}><input className={input} placeholder="Номер стола" required value={table.number} onChange={e => setTable({ ...table, number: e.target.value })} /><input className={input} type="number" min="1" placeholder="Посадочные места" value={table.seats} onChange={e => setTable({ ...table, seats: Number(e.target.value) })} /><select className={input} value={table.hallId} onChange={e => setTable({ ...table, hallId: Number(e.target.value) })}>{(data.halls ?? []).map((h: any) => <option value={h.id} key={h.id}>{h.name}</option>)}</select></Form></Card><Card><h2 className="mb-4 font-bold">Брони столов</h2>{(data.reservations ?? []).map((r: any) => <div className="flex items-center justify-between border-b border-[#30425a] py-2 text-sm" key={r.id}><span>{new Date(r.date).toLocaleString("ru-RU")} · {r.guestName} · {r.guests} гостей · стол {r.table?.number ?? "любой"} · {r.status}</span><select className="rounded bg-[#15263c] p-1" value={r.status} onChange={e => save({ entity: "reservationStatus", id: r.id, status: e.target.value })}><option>Новая</option><option>Подтверждена</option><option>Отменена</option><option>Завершена</option></select></div>)}<Form onSubmit={e => { e.preventDefault(); save({ entity: "reservation", ...form, hallId: form.hallId || data.halls?.[0]?.id, tableId: form.tableId || null }); }}><input className={input} placeholder="Имя гостя" required value={form.guestName} onChange={e => setForm({ ...form, guestName: e.target.value })} /><input className={input} placeholder="Телефон" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /><input className={input} type="number" min="1" value={form.guests} onChange={e => setForm({ ...form, guests: Number(e.target.value) })} /><input className={input} type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /><select className={input} value={form.tableId} onChange={e => setForm({ ...form, tableId: Number(e.target.value) })}><option value={0}>Любой стол</option>{(data.halls ?? []).flatMap((h: any) => h.tables).map((t: any) => <option value={t.id} key={t.id}>Стол {t.number} · {t.seats} мест</option>)}</select></Form></Card></div>; }
function Payroll({ data, title = "Расчёт зарплаты и премий" }: any) { const [from, setFrom] = useState(() => new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)), [to, setTo] = useState(() => new Date().toISOString().slice(0, 10)); const rows = (data.users ?? []).map((u: any) => { const entries = (data.timeEntries ?? []).filter((t: any) => t.userId === u.id && new Date(t.startedAt) >= new Date(from) && new Date(t.startedAt) <= new Date(`${to}T23:59:59`)); const hours = entries.reduce((sum: number, t: any) => sum + (new Date(t.endedAt ?? new Date()).getTime() - new Date(t.startedAt).getTime()) / 3600000, 0); const orders = (data.orders ?? []).filter((o: any) => o.employeeId === u.id && new Date(o.createdAt) >= new Date(from) && new Date(o.createdAt) <= new Date(`${to}T23:59:59`)); const revenue = orders.reduce((sum: number, o: any) => sum + o.total, 0); const average = orders.length ? Math.round(revenue / orders.length) : 0; const salary = u.payType === "Оклад" ? u.baseSalary : Math.round(hours * u.hourlyRate); const percent = Math.round(revenue * u.revenuePercent / 100); const bonus = average >= u.averageCheckPlan ? Math.round(revenue * u.bonusPercent / 100) : 0; return { ...u, hours: Math.round(hours * 10) / 10, revenue, average, salary, percent, bonus, total: salary + percent + bonus }; }); const csv = () => { const text = "сотрудник,часы,личная выручка,средний чек,оклад,процент,премия,итого\n" + rows.map((r: any) => `${r.name},${r.hours},${r.revenue},${r.average},${r.salary},${r.percent},${r.bonus},${r.total}`).join("\n"); const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "text/csv" })); a.download = "payroll.csv"; a.click(); }; return <section className="panel mt-5 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-bold">{title}</h2><button className="btn" onClick={csv}>CSV payroll</button></div><div className="mt-3 flex gap-2"><input className={input} type="date" value={from} onChange={e => setFrom(e.target.value)} /><input className={input} type="date" value={to} onChange={e => setTo(e.target.value)} /></div><div className="mt-4 overflow-auto"><table className="w-full text-left text-xs"><thead><tr><th>Сотрудник</th><th>Часы</th><th>Личная выручка</th><th>Средний чек</th><th>Оклад</th><th>Процент</th><th>Премия</th><th>Итого</th></tr></thead><tbody>{rows.map((r: any) => <tr className="border-t border-[#30425a]" key={r.id}><td className="py-2">{r.name}</td><td>{r.hours}</td><td>{r.revenue} ₽</td><td>{r.average} ₽</td><td>{r.salary} ₽</td><td>{r.percent} ₽</td><td>{r.bonus} ₽</td><td className="font-bold">{r.total} ₽</td></tr>)}</tbody></table></div><p className="muted mt-3 text-xs">Премия начисляется при выполнении плана среднего чека; ставка процента берётся из карточки сотрудника.</p></section>; }
function Staff({ data, save }: any) { const [user, setUser] = useState<any>({ login: "", name: "", role: "Кассир", pin: "", password: "luna123" }), [entry, setEntry] = useState<any>({ userId: 0, note: "" }); const open = data.shifts?.find((s: any) => !s.closedAt); return <><div className="grid gap-5 lg:grid-cols-2"><Card><h2 className="mb-4 font-bold">Сотрудники</h2>{(data.users ?? []).map((u: any) => <div className="flex items-center justify-between border-b border-[#30425a] py-2 text-sm" key={u.id}><span>{u.name} · {u.login} · {u.role} · PIN {u.pin || "—"} · {u.payType === "Оклад" ? `оклад ${u.baseSalary} ₽` : `${u.hourlyRate} ₽/ч`} · выручка {u.revenuePercent}% · премия {u.bonusPercent}% при среднем чеке от {u.averageCheckPlan} ₽</span><div><button className="btn secondary mr-2 text-xs" onClick={() => save({ entity: "user", id: u.id, name: u.name, role: u.role, pin: u.pin, active: !u.active })}>{u.active ? "Отключить" : "Включить"}</button><button className="text-xs text-red-300" onClick={() => fetch("/api/admin/control", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ entity: "user", id: u.id }) }).then(() => location.reload())}>Удалить</button></div></div>)}<h3 className="mb-3 mt-5 font-bold">Новый сотрудник</h3><Form onSubmit={e => { e.preventDefault(); save({ entity: "user", ...user }); }}><input className={input} placeholder="Логин" required value={user.login} onChange={e => setUser({ ...user, login: e.target.value })} /><input className={input} placeholder="Имя" required value={user.name} onChange={e => setUser({ ...user, name: e.target.value })} /><select className={input} value={user.role} onChange={e => setUser({ ...user, role: e.target.value })}>{["Владелец", "Управляющий", "Кассир", "Повар", "Кладовщик", "Маркетолог"].map(x => <option key={x}>{x}</option>)}</select><input className={input} placeholder="PIN кассы" value={user.pin} onChange={e => setUser({ ...user, pin: e.target.value })} /><select className={input} value={user.payType ?? "Почасовая"} onChange={e => setUser({ ...user, payType: e.target.value })}><option>Почасовая</option><option>Оклад</option></select><input className={input} type="number" placeholder="Оклад, ₽" value={user.baseSalary ?? 0} onChange={e => setUser({ ...user, baseSalary: Number(e.target.value) })} /><input className={input} type="number" placeholder="Ставка, ₽/ч" value={user.hourlyRate ?? 350} onChange={e => setUser({ ...user, hourlyRate: Number(e.target.value) })} /><input className={input} type="number" placeholder="Процент от выручки" value={user.revenuePercent ?? 1} onChange={e => setUser({ ...user, revenuePercent: Number(e.target.value) })} /><input className={input} type="number" placeholder="Премия, %" value={user.bonusPercent ?? 2} onChange={e => setUser({ ...user, bonusPercent: Number(e.target.value) })} /><input className={input} type="number" placeholder="План среднего чека, ₽" value={user.averageCheckPlan ?? 500} onChange={e => setUser({ ...user, averageCheckPlan: Number(e.target.value) })} /></Form></Card><Card><h2 className="mb-4 font-bold">Смены, X/Z и инкассация</h2><button className="btn" onClick={() => save({ entity: "shift", openingCash: 0 })}>Открыть смену</button>{open && <><button className="btn secondary ml-2" onClick={() => save({ entity: "xReport", id: open.id })}>X-отчёт</button><button className="btn secondary ml-2" onClick={() => save({ entity: "closeShift", id: open.id, closingCash: 0 })}>Закрыть · Z-отчёт</button><div className="mt-3 flex gap-2"><input className={input} type="number" placeholder="Сумма инкассации" onChange={e => setEntry({ ...entry, amount: Number(e.target.value) })} /><button className="btn secondary" onClick={() => save({ entity: "cashCollection", id: open.id, amount: entry.amount })}>Инкассация</button></div></>}{(data.shifts ?? []).map((s: any) => <p className="border-b border-[#30425a] py-2 text-sm" key={s.id}>{s.user.name} · {s.closedAt ? "Закрыта" : "Открыта"} · {s.zReport || s.xReport || "нет отчёта"} · инкассация {s.cashCollection} ₽</p>)}<h3 className="mb-3 mt-5 font-bold">Учёт рабочего времени</h3><select className={input} value={entry.userId} onChange={e => setEntry({ ...entry, userId: Number(e.target.value) })}>{(data.users ?? []).map((u: any) => <option value={u.id} key={u.id}>{u.name}</option>)}</select><button className="btn mt-3" onClick={() => save({ entity: "timeEntry", userId: entry.userId || data.users?.[0]?.id, note: "Рабочая смена" })}>Начать рабочее время</button>{(data.timeEntries ?? []).slice(0, 8).map((t: any) => <p className="muted mt-2 text-xs" key={t.id}>{t.user.name} · {new Date(t.startedAt).toLocaleString("ru-RU")} · {t.endedAt ? "завершено" : "идёт"}</p>)}</Card></div><Payroll data={data} /></>; }
function Reports({ data }: any) { const rows = (Object.values((data.orders ?? []).flatMap((o: any) => o.lines).reduce((a: any, l: any) => { const k = l.item.name; a[k] ??= { name: k, revenue: 0, qty: 0, cost: l.item.cost, price: l.price }; a[k].revenue += l.price * l.qty; a[k].qty += l.qty; return a; }, {})) as any[]).sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 10); const download = (name: string, content: string) => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([content], { type: "text/csv" })); a.download = name; a.click(); }; const lowStockRows = (data.ingredients ?? []).filter((i: any) => i.stock <= i.minStock); const expenseRows = (data.expenses ?? []).concat((data.finances ?? []).filter((x: any) => x.type === "Расход")); return <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"><Card><h2 className="mb-4 font-bold">Топ-10 блюд по выручке</h2>{rows.map((x: any, i: number) => <p className="flex justify-between border-b border-[#30425a] py-2" key={x.name}><span>{i + 1}. {x.name} · {x.qty} порц.</span><b>{x.revenue} ₽</b></p>)}<button className="btn mt-4" onClick={() => download("top-dishes.csv", "блюдо,порции,выручка\n" + rows.map((x: any) => `${x.name},${x.qty},${x.revenue}`).join("\n"))}>CSV топа</button></Card><Card><h2 className="mb-4 font-bold">Отчёты по гостям</h2>{(data.guests ?? []).slice(0, 8).map((g: any) => <p className="flex justify-between border-b border-[#30425a] py-2 text-sm" key={g.id}><span>{g.name} · RFM {g.orders.length > 2 ? "A" : "C"}</span><b>{g.orders.reduce((s: number, o: any) => s + o.total, 0)} ₽</b></p>)}<button className="btn mt-4" onClick={() => download("guests.csv", "гость,заказы,LTV\n" + (data.guests ?? []).map((g: any) => `${g.name},${g.orders.length},${g.orders.reduce((s: number, o: any) => s + o.total, 0)}`).join("\n"))}>CSV гостей</button></Card><Card><h2 className="mb-4 font-bold">Пиковые часы</h2><p className="text-3xl accent">12:00–14:00</p><p className="muted mt-2">Период максимальной загрузки</p><button className="btn mt-4" onClick={() => download("hours.csv", "час,заказы\n12,12\n13,18")}>CSV по часам</button></Card><Card><h2 className="mb-4 font-bold">Меню-инжиниринг</h2><p className="muted mb-3 text-sm">Популярность × маржинальность</p>{rows.map((x: any) => <p className="flex justify-between border-b border-[#30425a] py-2 text-sm" key={x.name}><span>{x.name}</span><span>{x.qty >= (rows[0]?.qty ?? 0) / 2 && x.price - x.cost >= x.price * .5 ? "Звезда" : x.qty >= (rows[0]?.qty ?? 0) / 2 ? "Рабочая лошадь" : x.price - x.cost >= x.price * .5 ? "Загадка" : "Собака"}</span></p>)}</Card><Payroll data={data} title="Отчёт по сотрудникам" /></div>; }
function Finance({ data, save }: any) { const revenue = (data.orders ?? []).reduce((s: number, o: any) => s + o.total, 0), expenses = (data.expenses ?? []).reduce((s: number, e: any) => s + e.amount, 0) + (data.finances ?? []).filter((x: any) => x.type === "Расход").reduce((s: number, x: any) => s + x.amount, 0); const [form, setForm] = useState<any>({ type: "Расход", category: "Продукты", amount: 1000, note: "" }); const exportFinance = () => downloadCsv("finance.csv", [["тип", "категория", "сумма", "комментарий"], ...((data.finances ?? []).map((x: any) => [x.type, x.category, x.amount, x.note ?? ""]))]); return <div className="grid gap-5 md:grid-cols-3"><Card><p className="muted">Доходы</p><b className="text-2xl accent">{formatMoney(revenue)}</b></Card><Card><p className="muted">Расходы</p><b className="text-2xl">{formatMoney(expenses)}</b></Card><Card><p className="muted">P&L</p><b className="text-2xl text-emerald-300">{formatMoney(revenue - expenses)}</b></Card><Card><h2 className="mb-4 font-bold">Новая операция</h2><Form onSubmit={e => { e.preventDefault(); save({ entity: "finance", ...form }); }}><select className={input} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option>Расход</option><option>Доход</option></select><input className={input} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /><input className={input} type="number" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} /><input className={input} placeholder="Комментарий" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></Form></Card><Card><div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Последние операции</h2><button className="btn secondary text-xs" onClick={exportFinance}>📥 CSV</button></div>{(data.finances ?? []).map((x: any) => <p className="border-b border-[#30425a] py-2 text-sm" key={x.id}>{x.type} · {x.category} · {formatMoney(x.amount)}</p>)}</Card></div>; }
function Settings({ data, save }: any) { return <Card><h2 className="mb-4 font-bold">Настройки заведения, каналов и интеграций</h2>{(data.settings ?? []).map((s: any) => <div className="mb-3 flex items-center gap-3" key={s.key}><label className="w-48 text-sm">{s.key}</label><input className={input} defaultValue={s.value} onBlur={e => save({ entity: "setting", key: s.key, value: e.target.value, section: s.section })} /></div>)}</Card>; }
function Audit({ data }: any) { const [user, setUser] = useState(""), [section, setSection] = useState(""); const logs = (data.auditLogs ?? []).filter((a: any) => (!user || a.user?.name?.includes(user)) && (!section || a.section === section)); return <Card><div className="mb-4 flex gap-2"><input className={input} placeholder="Пользователь" value={user} onChange={e => setUser(e.target.value)} /><select className={input} value={section} onChange={e => setSection(e.target.value)}><option value="">Все разделы</option>{["menu", "stock", "orders", "loyalty", "settings", "finance"].map(x => <option key={x}>{x}</option>)}</select></div><h2 className="mb-4 font-bold">Журнал действий</h2>{logs.map((a: any) => <p className="border-b border-[#30425a] py-2 text-sm" key={a.id}>{new Date(a.createdAt).toLocaleString("ru-RU")} · {a.user?.name ?? "система"} · {a.section} · {a.action} · {a.entity}</p>)}</Card>; }
function Clients({ data, save }: any) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [bonusAmount, setBonusAmount] = useState(100);
  const [note, setNote] = useState("");

  const guests = (data.guests ?? []).filter((g: any) =>
    !search || g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.phone.includes(search) || (g.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const openClient = (g: any) => {
    setSelected(g);
    setEditForm({ name: g.name, phone: g.phone, email: g.email ?? "", tags: g.tags ?? "", bonuses: g.bonuses, segment: g.segment ?? "" });
    setNote("");
  };

  const saveClient = () => {
    save({ entity: "guest", id: selected.id, ...editForm, bonuses: Number(editForm.bonuses) });
    setSelected(null);
  };

  const addBonus = (dir: "add" | "subtract") => {
    save({ entity: "guestBonus", guestId: selected.id, amount: bonusAmount, direction: dir });
    setSelected(null);
  };

  const resetPassword = async () => {
    const newPass = prompt("Новый пароль (минимум 6 символов):");
    if (!newPass || newPass.length < 6) return alert("Слишком короткий пароль");
    const r = await fetch("/api/admin/reset-guest-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ guestId: selected.id, password: newPass }),
    });
    if (r.ok) alert("Пароль изменён"); else alert("Ошибка смены пароля");
  };

  const exportClients = () => {
    const rows = [["ID", "Имя", "Телефон", "Email", "Бонусы", "Сегмент", "Заказов", "Дата регистрации"],
      ...(data.guests ?? []).map((g: any) => [g.id, g.name, g.phone, g.email ?? "", g.bonuses, g.segment, g.orders?.length ?? 0, new Date(g.createdAt).toLocaleDateString("ru-RU")])];
    const text = rows.map(r => r.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "text/csv" })); a.download = "clients.csv"; a.click();
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Клиенты · {(data.guests ?? []).length}</h2>
        <div className="flex gap-2">
          <input className="rounded-lg bg-[#15263c] px-3 py-2 text-sm" placeholder="Поиск по имени, телефону, email" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 280 }} />
          <button className="btn secondary text-xs" onClick={exportClients}>📥 CSV</button>
        </div>
      </div>

      <div className="overflow-auto rounded-xl border border-[#30425a]">
        <table className="w-full text-left text-sm">
          <thead style={{ background: "#0c1b2d" }}>
            <tr>
              {["ID", "Имя", "Телефон", "Email", "Бонусы", "Сегмент", "Заказов", "Зарегистрирован", "Последний визит", ""].map(h => (
                <th key={h} className="px-4 py-3 font-semibold text-slate-300">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {guests.map((g: any) => (
              <tr key={g.id} className="border-t border-[#233650] hover:bg-[#10213a]">
                <td className="px-4 py-3 text-slate-400">{g.id}</td>
                <td className="px-4 py-3 font-semibold">{g.name}</td>
                <td className="px-4 py-3">{g.phone}</td>
                <td className="px-4 py-3 text-slate-400">{g.email || "—"}</td>
                <td className="px-4 py-3"><span className="accent font-bold">{g.bonuses}</span></td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-[#1c3146] px-2 py-1 text-xs">{g.segment || "Новые"}</span>
                </td>
                <td className="px-4 py-3">{g.orders?.length ?? 0}</td>
                <td className="px-4 py-3 text-slate-400">{new Date(g.createdAt).toLocaleDateString("ru-RU")}</td>
                <td className="px-4 py-3 text-slate-400">{g.lastVisit ? new Date(g.lastVisit).toLocaleDateString("ru-RU") : "—"}</td>
                <td className="px-4 py-3">
                  <button className="btn secondary text-xs" onClick={() => openClient(g)}>Открыть</button>
                </td>
              </tr>
            ))}
            {guests.length === 0 && (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-slate-400">Клиентов не найдено</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && editForm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="panel w-full max-w-2xl max-h-[90vh] overflow-auto p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-bold">Клиент #{selected.id}</h3>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white text-xl">×</button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 mb-5">
              <div><label className="muted mb-1 block text-xs">Имя</label>
                <input className={input} value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></div>
              <div><label className="muted mb-1 block text-xs">Телефон</label>
                <input className={input} value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} /></div>
              <div><label className="muted mb-1 block text-xs">Email</label>
                <input className={input} value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} /></div>
              <div><label className="muted mb-1 block text-xs">Теги</label>
                <input className={input} value={editForm.tags} onChange={e => setEditForm({ ...editForm, tags: e.target.value })} placeholder="vip, loyal, ..." /></div>
              <div><label className="muted mb-1 block text-xs">Сегмент</label>
                <select className={input} value={editForm.segment} onChange={e => setEditForm({ ...editForm, segment: e.target.value })}>
                  {["Новые", "Разовые", "Постоянные", "VIP", "Уснувшие", "Потерянные"].map(s => <option key={s}>{s}</option>)}
                </select></div>
              <div><label className="muted mb-1 block text-xs">Бонусы</label>
                <input className={input} type="number" value={editForm.bonuses} onChange={e => setEditForm({ ...editForm, bonuses: e.target.value })} /></div>
            </div>

            <div className="mb-5 rounded-lg border border-[#30425a] bg-[#0c1b2d] p-4">
              <p className="mb-3 text-sm font-semibold">Начислить / списать бонусы</p>
              <div className="flex gap-2">
                <input className={input} type="number" value={bonusAmount} onChange={e => setBonusAmount(Number(e.target.value))} style={{ width: 120 }} />
                <button className="btn bg-emerald-700" onClick={() => addBonus("add")}>+ Начислить</button>
                <button className="btn secondary" onClick={() => addBonus("subtract")}>− Списать</button>
              </div>
            </div>

            <div className="mb-5 rounded-lg border border-[#30425a] bg-[#0c1b2d] p-4">
              <p className="mb-2 text-sm font-semibold">История заказов · {selected.orders?.length ?? 0}</p>
              {(selected.orders ?? []).slice(0, 5).map((o: any) => (
                <p key={o.id} className="border-t border-[#233650] py-2 text-xs text-slate-300">
                  №{o.number} · {o.status} · {o.total} ₽ · {new Date(o.createdAt).toLocaleDateString("ru-RU")}
                </p>
              ))}
              {(selected.orders?.length ?? 0) > 5 && <p className="muted text-xs mt-1">...и ещё {selected.orders.length - 5}</p>}
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="btn" onClick={saveClient}>Сохранить изменения</button>
              <button className="btn secondary" onClick={resetPassword}>🔑 Сменить пароль</button>
              <button className="btn secondary text-xs text-red-300" onClick={() => {
                if (confirm(`Заблокировать ${selected.name}?`)) {
                  save({ entity: "guest", id: selected.id, ...editForm, tags: (editForm.tags ? editForm.tags + ", blocked" : "blocked") });
                  setSelected(null);
                }
              }}>Заблокировать</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function SiteEditor({ data, save }: any) {
  const [tab, setTab] = useState<"items"|"banner"|"promo"|"settings">("items");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<number|null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [settingsForm, setSettingsForm] = useState<Record<string,string>>({});
  const [bannerForm, setBannerForm] = useState({ title: "", subtitle: "", badge: "АКЦИЯ", color1: "#0097d6", color2: "#005fa3" });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const sm: Record<string,string> = {};
    (data.settings ?? []).forEach((s: any) => { sm[s.key] = s.value; });
    setSettingsForm(sm);
    setBannerForm({
      title: sm["site_banner_title"] ?? "БЕСПЛАТНАЯ ДОСТАВКА\nОТ 1 000 ₽",
      subtitle: sm["site_banner_subtitle"] ?? "Заказывайте онлайн — быстро и удобно",
      badge: sm["site_banner_badge"] ?? "АКЦИЯ",
      color1: sm["site_banner_color1"] ?? "#0097d6",
      color2: sm["site_banner_color2"] ?? "#005fa3",
    });
  }, [data.settings]);

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const json = await r.json();
    setUploading(false);
    if (json.url) setEditForm((prev: any) => ({ ...prev, photo: json.url }));
  };

  const saveSetting = (key: string, value: string) => save({ entity: "setting", key, value, section: "Сайт" });
  const saveAllSettings = () => {
    Object.entries(settingsForm).forEach(([k, v]) => saveSetting(k, v));
  };
  const saveBanner = () => {
    saveSetting("site_banner_title", bannerForm.title);
    saveSetting("site_banner_subtitle", bannerForm.subtitle);
    saveSetting("site_banner_badge", bannerForm.badge);
    saveSetting("site_banner_color1", bannerForm.color1);
    saveSetting("site_banner_color2", bannerForm.color2);
  };
  const openEdit = (item: any) => { setEditing(item); setEditForm({ name: item.name, description: item.description, price: item.price, deliveryPrice: item.deliveryPrice ?? item.price, photo: item.photo ?? "", labels: item.labels ?? "", site: item.site !== false, calories: item.calories ?? "" }); };
  const saveItem = () => {
    save({ entity: "item", id: editing.id, ...editForm, price: Number(editForm.price), deliveryPrice: Number(editForm.deliveryPrice), calories: editForm.calories ? Number(editForm.calories) : null, cost: editing.cost, cookingMinutes: editing.cookingMinutes, workshop: editing.workshop });
    setEditing(null);
  };
  const toggleSite = (item: any) => save({ entity: "item", id: item.id, ...item, site: !item.site, deliveryPrice: item.deliveryPrice ?? item.price, cost: item.cost });
  const toggleLabel = (item: any, label: string) => {
    const labels = (item.labels ?? "").split(",").map((l: string) => l.trim()).filter(Boolean);
    const next = labels.includes(label) ? labels.filter((l: string) => l !== label) : [...labels, label];
    save({ entity: "item", id: item.id, ...item, labels: next.join(","), deliveryPrice: item.deliveryPrice ?? item.price, cost: item.cost });
  };

  const items = (data.items ?? []).filter((i: any) => {
    const matchCat = catFilter === null || i.categoryId === catFilter;
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });
  const promoItems = (data.items ?? []).filter((i: any) => (i.labels ?? "").includes("hit") || (i.labels ?? "").includes("new"));

  const tabBtn = (key: typeof tab, label: string) => (
    <button key={key} onClick={() => setTab(key)} style={{ padding: "8px 18px", borderRadius: 10, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", background: tab === key ? "#d8a94f" : "transparent", color: tab === key ? "#151b27" : "#8ab" }}>
      {label}
    </button>
  );

  return (
    <div className="space-y-5">
      <div className="flex gap-2 rounded-xl border border-[#30425a] bg-[#0c1b2d] p-1 w-fit">
        {tabBtn("items", "Блюда сайта")}
        {tabBtn("banner", "Баннер")}
        {tabBtn("promo", "Промо-полоса")}
        {tabBtn("settings", "Настройки")}
      </div>

      {tab === "items" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <input className={input} placeholder="Поиск блюда..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 280 }} />
            <select className={input} style={{ maxWidth: 220 }} value={catFilter ?? ""} onChange={e => setCatFilter(e.target.value ? Number(e.target.value) : null)}>
              <option value="">Все категории</option>
              {(data.categories ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <span className="muted text-xs">{items.length} позиций</span>
          </div>
          <div className="overflow-auto rounded-xl border border-[#30425a]">
            <table className="w-full text-sm text-left">
              <thead style={{ background: "#0c1b2d" }}>
                <tr>{["Фото", "Название", "Цена", "Доставка", "Теги", "Сайт", ""].map(h => <th key={h} className="px-3 py-3 font-semibold text-slate-300">{h}</th>)}</tr>
              </thead>
              <tbody>
                {items.map((i: any) => (
                  <tr key={i.id} className="border-t border-[#233650] hover:bg-[#10213a]">
                    <td className="px-3 py-2">
                      {i.photo ? <img src={i.photo} alt="" style={{ width: 48, height: 36, objectFit: "cover", borderRadius: 6 }} /> : <div style={{ width: 48, height: 36, borderRadius: 6, background: "#1c3146", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🍱</div>}
                    </td>
                    <td className="px-3 py-2 font-semibold">{i.name}</td>
                    <td className="px-3 py-2">{i.price} ₽</td>
                    <td className="px-3 py-2">{i.deliveryPrice ?? i.price} ₽</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1 flex-wrap">
                        {["hit","new","spicy"].map(lbl => (
                          <button key={lbl} onClick={() => toggleLabel(i, lbl)} style={{ padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700, cursor: "pointer", border: "1.5px solid", borderColor: (i.labels ?? "").includes(lbl) ? "#d8a94f" : "#30425a", background: (i.labels ?? "").includes(lbl) ? "#2a1f0a" : "transparent", color: (i.labels ?? "").includes(lbl) ? "#d8a94f" : "#8ab" }}>
                            {lbl === "hit" ? "🔥" : lbl === "new" ? "✨" : "🌶"}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <button onClick={() => toggleSite(i)} style={{ padding: "3px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none", background: i.site !== false ? "#1a3d2a" : "#3a1a1a", color: i.site !== false ? "#4ade80" : "#f87171" }}>
                        {i.site !== false ? "Показан" : "Скрыт"}
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <button className="btn secondary text-xs" onClick={() => openEdit(i)}>Изменить</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "banner" && (
        <Card>
          <h2 className="mb-4 text-xl font-bold">Баннер на главной</h2>
          <div className="grid gap-4 sm:grid-cols-2 mb-4">
            <div><label className="muted mb-1 block text-xs">Значок (АКЦИЯ / НОВИНКА / ...)</label>
              <input className={input} value={bannerForm.badge} onChange={e => setBannerForm({...bannerForm, badge: e.target.value})} /></div>
            <div><label className="muted mb-1 block text-xs">Заголовок (Enter = перенос)</label>
              <textarea className={input} rows={2} value={bannerForm.title} onChange={e => setBannerForm({...bannerForm, title: e.target.value})} /></div>
            <div><label className="muted mb-1 block text-xs">Подзаголовок</label>
              <input className={input} value={bannerForm.subtitle} onChange={e => setBannerForm({...bannerForm, subtitle: e.target.value})} /></div>
            <div className="flex gap-3 items-end">
              <div className="flex-1"><label className="muted mb-1 block text-xs">Цвет от</label>
                <input className={input} type="color" value={bannerForm.color1} onChange={e => setBannerForm({...bannerForm, color1: e.target.value})} style={{ height: 42, padding: 4 }} /></div>
              <div className="flex-1"><label className="muted mb-1 block text-xs">Цвет до</label>
                <input className={input} type="color" value={bannerForm.color2} onChange={e => setBannerForm({...bannerForm, color2: e.target.value})} style={{ height: 42, padding: 4 }} /></div>
            </div>
          </div>
          <div style={{ borderRadius: 16, background: `linear-gradient(135deg, ${bannerForm.color1} 0%, ${bannerForm.color2} 100%)`, padding: "28px 32px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <span style={{ background: "#8b9dc3", color: "#fff", padding: "4px 12px", borderRadius: 7, fontSize: 12, fontWeight: 700, marginBottom: 10, display: "inline-block" }}>{bannerForm.badge || "АКЦИЯ"}</span>
              <div style={{ color: "#fff", fontWeight: 900, fontSize: 20, lineHeight: 1.3, whiteSpace: "pre-line" }}>{bannerForm.title}</div>
              <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 4 }}>{bannerForm.subtitle}</div>
            </div>
            <div style={{ fontSize: 56 }}>🛵</div>
          </div>
          <button className="btn" onClick={saveBanner}>Сохранить баннер</button>
        </Card>
      )}

      {tab === "promo" && (
        <Card>
          <h2 className="mb-2 text-xl font-bold">Промо-полоса</h2>
          <p className="muted mb-4 text-sm">Отображаются блюда с меткой 🔥 Хит или ✨ Новинка. Управляйте метками во вкладке «Блюда сайта».</p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {promoItems.length === 0 && <p className="muted">Нет блюд с метками хит/новинка</p>}
            {promoItems.map((i: any) => (
              <div key={i.id} style={{ flexShrink: 0, width: 120, borderRadius: 12, overflow: "hidden", border: "2px solid #d8a94f", background: "#10213a" }}>
                <div style={{ height: 80, background: "#1c3146", overflow: "hidden" }}>
                  {i.photo ? <img src={i.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>🍱</div>}
                </div>
                <div style={{ padding: "6px 8px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#f4efe5", marginBottom: 2, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>{i.name}</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#d8a94f" }}>{i.deliveryPrice ?? i.price} ₽</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "settings" && (
        <Card>
          <h2 className="mb-4 text-xl font-bold">Настройки сайта</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { key: "site_phone", label: "Телефон (заголовок)", placeholder: "8 (999) 000-99-99" },
              { key: "site_hours", label: "Часы приёма заказов", placeholder: "9:00 до 23:00" },
              { key: "site_delivery_hours", label: "Часы доставки (футер)", placeholder: "с 10:30 до 23:30" },
              { key: "site_min_order", label: "Минимальная сумма заказа (₽)", placeholder: "500" },
              { key: "site_free_delivery", label: "Бесплатная доставка от (₽)", placeholder: "1000" },
              { key: "site_city", label: "Город", placeholder: "Москва" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="muted mb-1 block text-xs">{label}</label>
                <input className={input} placeholder={placeholder} value={settingsForm[key] ?? ""} onChange={e => setSettingsForm(prev => ({...prev, [key]: e.target.value}))} />
              </div>
            ))}
          </div>
          <button className="btn mt-5" onClick={saveAllSettings}>Сохранить настройки</button>
        </Card>
      )}

      {editing && editForm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="panel w-full max-w-xl max-h-[90vh] overflow-auto p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">Редактировать: {editing.name}</h3>
              <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-white text-xl">×</button>
            </div>
            <div className="space-y-3">
              <div><label className="muted mb-1 block text-xs">Название</label>
                <input className={input} value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /></div>
              <div><label className="muted mb-1 block text-xs">Описание</label>
                <textarea className={input} rows={2} value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="muted mb-1 block text-xs">Цена в зале</label>
                  <input className={input} type="number" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} /></div>
                <div><label className="muted mb-1 block text-xs">Цена доставки</label>
                  <input className={input} type="number" value={editForm.deliveryPrice} onChange={e => setEditForm({...editForm, deliveryPrice: e.target.value})} /></div>
              </div>
              <div><label className="muted mb-1 block text-xs">Калорийность (ккал)</label>
                <input className={input} type="number" value={editForm.calories} onChange={e => setEditForm({...editForm, calories: e.target.value})} /></div>
              <div><label className="muted mb-1 block text-xs">Фото</label>
                <div className="flex gap-2 items-center mb-2">
                  <label style={{ cursor: "pointer", background: "#1c3146", border: "1.5px solid #30425a", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, color: "#f4efe5" }}>
                    {uploading ? "Загрузка..." : "📁 Загрузить файл"}
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); }} />
                  </label>
                  <span className="muted text-xs">или вставьте URL:</span>
                </div>
                <input className={input} placeholder="https://..." value={editForm.photo} onChange={e => setEditForm({...editForm, photo: e.target.value})} />
                {editForm.photo && <img src={editForm.photo} alt="" style={{ marginTop: 8, height: 80, borderRadius: 8, objectFit: "cover" }} />}
              </div>
              <div><label className="muted mb-1 block text-xs">Метки (через запятую: hit, new, spicy)</label>
                <input className={input} value={editForm.labels} onChange={e => setEditForm({...editForm, labels: e.target.value})} placeholder="hit, new, spicy" /></div>
              <div className="flex items-center gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={editForm.site} onChange={e => setEditForm({...editForm, site: e.target.checked})} />
                  Показывать на сайте
                </label>
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button className="btn" onClick={saveItem}>Сохранить</button>
              <button className="btn secondary" onClick={() => setEditing(null)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function Recipes({ data }: any) { return <Card><h2 className="mb-4 font-bold">Техкарты и версии</h2>{(data.items ?? []).map((i: any) => <div className="border-b border-[#30425a] py-3" key={i.id}><b>{i.name}</b><span className="muted ml-4">себестоимость {i.cost} ₽ · food cost {Math.round(i.cost / i.price * 100)}%</span>{i.ingredients?.map((r: any) => <p className="muted ml-4 text-sm" key={r.id}>{r.ingredient.name} · {r.grams} {r.ingredient.unit}</p>)}</div>)}</Card>; }
