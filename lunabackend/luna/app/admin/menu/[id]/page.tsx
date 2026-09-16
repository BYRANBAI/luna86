"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

const input = "w-full rounded-lg bg-[#15263c] p-3 text-sm";

function PhotoEditor({ item, setItem, onSave, message }: { item: any; setItem: any; onSave: () => void; message: string }) {
  const [photoMode, setPhotoMode] = useState<"local" | "url">(item.photo?.startsWith("/uploads/") ? "local" : "url");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await r.json();
    setUploading(false);
    if (r.ok) setItem((prev: any) => ({ ...prev, photo: data.url }));
    else alert(data.error ?? "Ошибка загрузки");
  }

  return (
    <section className="panel p-5">
      <h2 className="mb-3 font-bold">Фото блюда</h2>
      {item.photo && (
        <div className="mb-3 overflow-hidden rounded-xl border border-[#30425a]" style={{ height: 180 }}>
          <img src={item.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )}
      <div className="mb-3 flex rounded-lg overflow-hidden border border-[#30425a]">
        <button
          type="button"
          className={`flex-1 py-2 text-sm transition ${photoMode === "local" ? "bg-[#1b3a5c] text-white font-semibold" : "bg-[#0f1e2e] text-slate-400"}`}
          onClick={() => setPhotoMode("local")}
        >
          Загрузить файл
        </button>
        <button
          type="button"
          className={`flex-1 py-2 text-sm transition ${photoMode === "url" ? "bg-[#1b3a5c] text-white font-semibold" : "bg-[#0f1e2e] text-slate-400"}`}
          onClick={() => setPhotoMode("url")}
        >
          Вставить URL
        </button>
      </div>
      {photoMode === "local" ? (
        <div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFile} />
          <button
            type="button"
            className="btn secondary w-full"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? "Загрузка…" : "Выбрать фото с компьютера"}
          </button>
          {item.photo?.startsWith("/uploads/") && (
            <p className="mt-2 text-xs text-slate-400 truncate">Файл: {item.photo}</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <input
            className={input}
            placeholder="https://example.com/photo.jpg"
            value={item.photo?.startsWith("/uploads/") ? "" : (item.photo ?? "")}
            onChange={e => setItem((prev: any) => ({ ...prev, photo: e.target.value }))}
          />
          <p className="text-xs text-slate-400">Ссылка на внешнее изображение</p>
        </div>
      )}
      {message && <p className="accent mt-2 text-sm">{message}</p>}
      <button className="btn mt-3 w-full" onClick={onSave}>Сохранить фото</button>
    </section>
  );
}

export default function ItemEditor() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<any>(null), [message, setMessage] = useState("");
  const [photoMessage, setPhotoMessage] = useState("");
  const load = () => fetch("/api/admin/control?section=menu").then(r => r.json()).then(d => { setItem(d.items.find((x: any) => x.id === Number(id))); });
  useEffect(() => { load(); }, [id]);
  async function save(body: any, onMsg?: (m: string) => void) {
    const r = await fetch("/api/admin/control", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const result = await r.json();
    const msg = r.ok ? "Сохранено" : result.error;
    (onMsg ?? setMessage)(msg);
    if (r.ok) load();
  }
  if (!item) return <section className="panel p-5">Загрузка блюда…</section>;
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
      <section className="panel p-5">
        <p className="muted">Меню / Блюдо №{item.id}</p>
        <h1 className="mt-2 text-3xl font-bold">{item.name}</h1>
        {message && <p className="accent mt-2">{message}</p>}
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <label>Название<input className={input} value={item.name} onChange={e => setItem({ ...item, name: e.target.value })} /></label>
          <label>Цена<input className={input} type="number" value={item.price} onChange={e => setItem({ ...item, price: Number(e.target.value) })} /></label>
          <label>Зал<input className={input} type="number" value={item.dineInPrice ?? item.price} onChange={e => setItem({ ...item, dineInPrice: Number(e.target.value) })} /></label>
          <label>Доставка<input className={input} type="number" value={item.deliveryPrice ?? item.price} onChange={e => setItem({ ...item, deliveryPrice: Number(e.target.value) })} /></label>
          <label>Самовывоз<input className={input} type="number" value={item.pickupPrice ?? item.price} onChange={e => setItem({ ...item, pickupPrice: Number(e.target.value) })} /></label>
          <label>Лимит порций в день<input className={input} type="number" value={item.dailyLimit ?? ""} onChange={e => setItem({ ...item, dailyLimit: e.target.value ? Number(e.target.value) : null })} /></label>
          <label>Аллергены<input className={input} value={item.allergens ?? ""} onChange={e => setItem({ ...item, allergens: e.target.value })} /></label>
          <label>БЖУ<input className={input} value={item.nutrition ?? ""} onChange={e => setItem({ ...item, nutrition: e.target.value })} /></label>
          <label>Калорийность<input className={input} type="number" value={item.calories ?? ""} onChange={e => setItem({ ...item, calories: Number(e.target.value) })} /></label>
          <label>Цех<input className={input} value={item.workshop} onChange={e => setItem({ ...item, workshop: e.target.value })} /></label>
        </div>
        <label className="mt-3 block">Описание<textarea className={input} value={item.description} onChange={e => setItem({ ...item, description: e.target.value })} /></label>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          {[["site", "Сайт"], ["kiosk", "Киоск"], ["app", "Приложение"], ["bot", "Бот"], ["active", "Доступно"]].map(([key, label]) => (
            <label key={key}><input type="checkbox" checked={Boolean(item[key])} onChange={e => setItem({ ...item, [key]: e.target.checked })} /> {label}</label>
          ))}
        </div>
        <button className="btn mt-5" onClick={() => save({ entity: "item", id: item.id, ...item })}>Сохранить блюдо</button>
      </section>
      <section className="space-y-5">
        <PhotoEditor
          item={item}
          setItem={setItem}
          message={photoMessage}
          onSave={() => save({ entity: "item", id: item.id, photo: item.photo }, setPhotoMessage)}
        />
        <section className="panel p-5">
          <h2 className="font-bold">Модификаторы</h2>
          {(item.modifierGroups ?? []).map((g: any) => (
            <div className="mt-3 border-b border-[#30425a] pb-3" key={g.id}>
              <b>{g.name}</b><span className="muted ml-2">min {g.min} / max {g.max}</span>
              {g.options.map((o: any) => <p className="muted ml-3 text-sm" key={o.id}>{o.name} · +{o.price} ₽</p>)}
              <button className="mt-2 text-xs text-amber-300" onClick={async () => { await fetch("/api/admin/control", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ entity: "modifierOption", groupId: g.id, name: "Большой размер", price: 60 }) }); load(); }}>Добавить опцию</button>
            </div>
          ))}
          <button className="btn secondary mt-4" onClick={async () => { await fetch("/api/admin/control", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ entity: "modifierGroup", itemId: item.id, name: "Дополнительно", min: 0, max: 1 }) }); load(); }}>Добавить группу</button>
        </section>
        <section className="panel p-5">
          <h2 className="font-bold">Расписание доступности</h2>
          <p className="muted mt-2">Дни недели и часы</p>
          <button className="btn secondary mt-3" onClick={async () => { await fetch("/api/admin/control", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ entity: "schedule", itemId: item.id, days: "1,2,3,4,5", startHour: 8, endHour: 23 }) }); setMessage("Расписание сохранено"); }}>Пн–Пт · 08:00–23:00</button>
          <button className="btn secondary ml-2 mt-3" onClick={async () => { await fetch("/api/admin/control", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ entity: "schedule", itemId: item.id, days: "1,2,3,4,5,6,7", startHour: 23, endHour: 24 }) }); setMessage("Блюдо скрыто расписанием"); }}>Скрыть сейчас</button>
        </section>
      </section>
    </div>
  );
}
