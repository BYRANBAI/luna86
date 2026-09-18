import { NextRequest, NextResponse } from "next/server";

/**
 * Разделение на два «сайта» по домену:
 *
 *   luna86.ru        — гостевой сайт: меню, корзина, заказ, профиль.
 *                      "/" редиректит на /menu.
 *
 *   panel.luna86.ru  — сайт персонала: CRM (/admin), /crm, POS, KDS, киоск.
 *                      "/" редиректит на /admin.
 *
 * Приложение одно, база общая: заказ с сайта сразу виден персоналу
 * в CRM → «Заказы», на кухне (KDS) и на кассе (POS).
 *
 * Доступ по IP (82.117.87.47) не трогаем — переходный период без редиректов.
 */

const PANEL_HOST = "panel.luna86.ru";
const MAIN_HOSTS = new Set(["luna86.ru", "www.luna86.ru"]);

// Служебные разделы — только на panel.luna86.ru
const STAFF_PATHS = ["/admin", "/crm", "/pos", "/kds", "/kiosk", "/queue", "/cds"];

// Гостевые разделы — только на luna86.ru
const GUEST_PATHS = ["/menu", "/checkout", "/orders", "/order", "/profile", "/auth"];

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").split(":")[0];
  const { pathname, search } = req.nextUrl;

  // API, статику и файлы пропускаем всегда
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const matches = (paths: string[]) =>
    paths.some((p) => pathname === p || pathname.startsWith(p + "/"));

  // --- Сайт персонала ---
  if (host === PANEL_HOST) {
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    // Гостевые страницы уходят на основной сайт
    if (matches(GUEST_PATHS)) {
      return NextResponse.redirect(new URL(`https://luna86.ru${pathname}${search}`));
    }
    return NextResponse.next();
  }

  // --- Основной гостевой сайт ---
  if (MAIN_HOSTS.has(host)) {
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/menu", req.url));
    }
    // Служебные страницы уходят в панель
    if (matches(STAFF_PATHS)) {
      return NextResponse.redirect(new URL(`https://${PANEL_HOST}${pathname}${search}`));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
