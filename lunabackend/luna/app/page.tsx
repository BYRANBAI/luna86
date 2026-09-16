"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const modules = [
  ["Приложение", "Персональные заказы и лояльность", "/menu", "📱"],
  ["Киоск", "Самообслуживание без очередей", "/kiosk", "🖥️"],
  ["CRM", "Единое управление точкой", "/admin", "⚙️"],
  ["Сайт", "Меню и заказ онлайн", "/menu", "🌐"],
  ["Кассовый терминал", "Зал, оплаты и чеки", "/pos", "💳"],
  ["Склад", "Остатки и списания", "/admin", "📦"],
  ["Telegram-бот", "Заказ в привычном канале", "/menu", "💬"],
  ["Экран покупателя", "Прозрачная корзина", "/cds", "📺"],
  ["Техкарты", "Фудкост и состав", "/admin", "📋"],
  ["Карты лояльности", "Бонусы в одном профиле", "/menu", "🎁"],
  ["Электронная очередь", "Понятная выдача", "/queue", "🎫"],
  ["Отчёты и аналитика", "Решения на данных", "/admin", "📊"],
  ["Доставка", "Заказ до двери", "/menu", "🚗"],
  ["Кухонный экран", "Поток на производстве", "/kds", "👨‍🍳"],
  ["Финансовый модуль", "P&L и контроль денег", "/admin", "💰"]
];

const nav = [
  ["menu", "Меню"],
  ["kiosk", "Киоск"],
  ["admin", "CRM"],
  ["pos", "POS"],
  ["kds", "KDS"],
  ["queue", "Очередь"],
  ["cds", "CDS"]
];

const money = (n: number) => new Intl.NumberFormat("ru-RU").format(n) + " ₽";

type HomeState = {
  orders: { total: number; status: string }[];
  items: unknown[];
  guests: unknown[];
};

export default function Home() {
  const [s, setS] = useState<HomeState>({ orders: [], items: [], guests: [] });
  
  useEffect(() => {
    fetch("/api/state")
      .then(r => r.json())
      .then(setS)
      .catch(() => {});
  }, []);

  const revenue = s.orders.reduce((a, o) => a + o.total, 0);
  const activeOrders = s.orders.filter(o => o.status !== "DONE").length;

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-[var(--border)] sticky top-0 z-50 shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-3xl">🌙</span>
            <div>
              <div className="text-2xl font-bold text-[var(--text-primary)]">ЛУНА</div>
              <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">
                Digital Café
              </div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {nav.map(([path, label]) => (
              <Link
                key={path}
                href={`/${path}`}
                className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-lg transition-all"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#FF6B6B] to-[#FA5252] text-white">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-32">
          <div className="grid gap-12 md:grid-cols-2 items-center">
            <div className="animate-fade-up">
              <div className="inline-block px-4 py-2 bg-white/20 rounded-full text-sm font-semibold mb-6 backdrop-blur-sm">
                Единая экосистема кафе
              </div>
              <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
                Кафе, которое
                <br />
                <span className="text-white/90">слышит гостя</span>
              </h1>
              <p className="text-xl text-white/80 mb-8 max-w-xl leading-relaxed">
                Все каналы продаж, кухня, склад, команда и аналитика работают на одних данных
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/menu"
                  className="px-8 py-4 bg-white text-[#FF6B6B] rounded-xl font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  style={{ color: '#FF6B6B' }}
                >
                  Открыть меню
                </Link>
                <Link
                  href="/admin"
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-bold border-2 border-white/30 hover:bg-white/20 transition-all"
                >
                  Войти в CRM
                </Link>
              </div>
            </div>

            {/* Stats Card */}
            <div className="panel bg-white p-8 animate-fade-up" style={{ animationDelay: "0.2s" }}>
              <div className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-6">
                Сейчас в системе
              </div>
              <div className="grid grid-cols-2 gap-6">
                <Stat n={String(activeOrders)} t="активных заказов" color="var(--accent-primary)" />
                <Stat n={money(revenue)} t="выручка сегодня" color="var(--success)" />
                <Stat n={String(s.items.length)} t="позиций меню" color="var(--info)" />
                <Stat n={String(s.guests.length)} t="гостей" color="var(--warning)" />
              </div>
              <div className="mt-6 pt-6 border-t border-[var(--border)] flex items-center gap-2 text-sm">
                <span className="w-2 h-2 bg-[var(--success)] rounded-full animate-pulse"></span>
                <span className="text-[var(--text-secondary)]">
                  Синхронизация активна · polling 3 сек
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modules Grid */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="text-3xl font-bold mb-2 text-[var(--text-primary)]">
          Вся платформа — в одной связке
        </h2>
        <p className="text-lg text-[var(--text-secondary)] mb-8">
          15 модулей для полной автоматизации ресторана
        </p>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map(([name, desc, url, icon], i) => (
            <Link
              href={url}
              key={name}
              className="panel p-6 group cursor-pointer animate-fade-up"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                {icon}
              </div>
              <h3 className="text-lg font-semibold mb-2 text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                {name}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {desc}
              </p>
              <div className="mt-4 text-sm font-medium text-[var(--accent-primary)] flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                Открыть демо
                <span>→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] bg-white mt-20">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌙</span>
              <div className="text-sm text-[var(--text-secondary)]">
                Луна · демонстрационный прототип платформы автоматизации кафе
              </div>
            </div>
            <div className="flex gap-4 text-sm text-[var(--text-secondary)]">
              <Link href="/admin" className="hover:text-[var(--text-primary)]">
                CRM
              </Link>
              <Link href="/pos" className="hover:text-[var(--text-primary)]">
                POS
              </Link>
              <Link href="/kiosk" className="hover:text-[var(--text-primary)]">
                Киоsk
              </Link>
              <Link href="/menu" className="hover:text-[var(--text-primary)]">
                Меню
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Stat({ n, t, color }: { n: string; t: string; color: string }) {
  return (
    <div>
      <div className="text-3xl font-bold mb-1" style={{ color }}>
        {n}
      </div>
      <div className="text-sm text-[var(--text-secondary)]">{t}</div>
    </div>
  );
}
