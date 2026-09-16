"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const sections = [
  ["dashboard", "Дашборд"], ["menu", "Меню"], ["recipes", "Техкарты"], ["stock", "Склад"],
  ["suppliers", "Поставщики"], ["orders", "Заказы"], ["delivery", "Доставка"], ["guests", "Гости"],
  ["clients", "Клиенты"], ["site", "Редактор сайта"], ["loyalty", "Лояльность"], ["hall", "Зал и брони"], ["staff", "Сотрудники"],
  ["reports", "Отчёты"], ["finance", "Финансы"], ["settings", "Настройки"], ["audit", "Журнал действий"],
];
const roles: Record<string, string[]> = {
  Владелец: sections.map(x => x[0]), Управляющий: sections.map(x => x[0]),
  Кассир: ["dashboard", "orders", "guests", "hall"], Повар: ["dashboard", "recipes"],
  Кладовщик: ["dashboard", "stock", "suppliers"], Маркетолог: ["dashboard", "guests", "loyalty", "reports", "clients"],
};

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(), router = useRouter();
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    let active = true;
    const loadUser = async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!active) return;
        if (response.ok) {
          const payload = await response.json();
          setUser(payload.user ?? null);
          return;
        }
        setUser(null);
        if (response.status === 401 || response.status === 403) {
          router.replace("/admin/login");
        }
      } catch {
        if (!active) return;
        setUser(null);
        router.replace("/admin/login");
      }
    };
    loadUser();
    return () => { active = false; };
  }, [router]);
  if (!user && pathname !== "/admin/login") return <main className="grid min-h-screen place-items-center bg-[#07111f] text-white">Проверка доступа…</main>;
  if (pathname === "/admin/login") return <>{children}</>;
  const allowed = roles[user?.role] ?? [];
  return <div className="crm-theme min-h-screen bg-[#07111f] text-[#f4efe5] md:flex">
    <aside className="w-full border-b border-[#233650] bg-[#0c1b2d] p-4 md:min-h-screen md:w-64 md:border-b-0 md:border-r">
      <button type="button" onClick={() => router.push("/")} className="mb-5 block text-left text-xl font-bold"><span className="accent">◐</span> ЛУНА · ADMIN</button>
      <p className="muted mb-3 text-xs">Кафе «Луна» · Москва</p>
      <nav className="grid grid-cols-2 gap-1 md:block">{sections.filter(s => allowed.includes(s[0])).map(([key, label]) => <Link className={`mb-1 block rounded-lg px-3 py-2 text-sm ${pathname.includes(`/admin/${key}`) || pathname === "/admin" && key === "dashboard" ? "bg-[#d8a94f] text-[#151b27]" : "hover:bg-[#182a42]"}`} href={key === "dashboard" ? "/admin" : `/admin/${key}`} key={key}>{label}</Link>)}</nav>
    </aside>
    <div className="min-w-0 flex-1">
      <header className="flex items-center justify-between border-b border-[#233650] px-5 py-4"><div><b>Панель управления</b><p className="muted text-xs">Единые данные SQLite</p></div><div className="flex items-center gap-3 text-sm"><span>{user?.name} · {user?.role}</span><button className="btn secondary text-xs" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.replace("/admin/login"); }}>Выйти</button></div></header>
      <main className="mx-auto max-w-[1500px] p-5">{children}</main>
    </div>
  </div>;
}
