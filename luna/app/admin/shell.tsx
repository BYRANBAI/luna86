"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const USER_KEY = "luna-admin-user";
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

function readStoredUser() {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(sessionStorage.getItem(USER_KEY) ?? "null"); }
  catch { return null; }
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(), router = useRouter();
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    let active = true;
    const stored = readStoredUser();
    if (stored) setUser(stored);
    const loadUser = async () => {
      try {
        let response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok && pathname !== "/admin/login") {
          await new Promise(resolve => setTimeout(resolve, 200));
          response = await fetch("/api/auth/me", { cache: "no-store" });
        }
        if (!active) return;
        if (response.ok) {
          const payload = await response.json();
          const next = payload.user ?? null;
          setUser(next);
          if (next) sessionStorage.setItem(USER_KEY, JSON.stringify(next));
          return;
        }
        sessionStorage.removeItem(USER_KEY);
        setUser(null);
        if (pathname !== "/admin/login" && (response.status === 401 || response.status === 403)) {
          router.replace("/admin/login");
        }
      } catch {
        if (!active || pathname === "/admin/login") return;
        setUser(null);
        router.replace("/admin/login");
      }
    };
    void loadUser();
    return () => { active = false; };
  }, [router, pathname]);
  if (pathname === "/admin/login") return <>{children}</>;
  const allowed = user ? (roles[user.role] ?? []) : sections.map(x => x[0]);
  return <div className="crm-theme min-h-screen bg-[#F5F5F5] text-[#3A3A3A] md:flex">
    <aside className="w-full border-b border-[#EDEDED] bg-white p-4 md:min-h-screen md:w-64 md:border-b-0 md:border-r">
      <button type="button" onClick={() => router.push("/")} className="mb-5 block text-left text-xl font-bold"><span className="accent">◐</span> ЛУНА · ADMIN</button>
      <p className="muted mb-3 text-xs">Кафе «Луна» · Покачи</p>
      <nav className="grid grid-cols-2 gap-1 md:block">{sections.filter(s => allowed.includes(s[0])).map(([key, label]) => <Link className={`mb-1 block rounded-lg px-3 py-2 text-sm ${pathname.includes(`/admin/${key}`) || pathname === "/admin" && key === "dashboard" ? "bg-[#F58220] text-white" : "hover:bg-[#FFF3E6]"}`} href={key === "dashboard" ? "/admin" : `/admin/${key}`} key={key}>{label}</Link>)}</nav>
    </aside>
    <div className="min-w-0 flex-1">
      <header className="flex items-center justify-between border-b border-[#EDEDED] bg-white px-5 py-4"><div><b>Панель управления</b><p className="muted text-xs">Единые данные SQLite</p></div><div className="flex items-center gap-3 text-sm"><span>{user?.name} · {user?.role}</span><button className="btn secondary text-xs" onClick={async () => { sessionStorage.removeItem(USER_KEY); await fetch("/api/auth/logout", { method: "POST" }); router.replace("/admin/login"); }}>Выйти</button></div></header>
      <main className="mx-auto max-w-[1500px] p-5">{children}</main>
    </div>
  </div>;
}
