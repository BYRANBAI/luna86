import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export async function GET() {
  const [categories, items, orders, guests, ingredients, movements, expenses, zones, reservations, settings, promocodes, halls] = await Promise.all([
    db.category.findMany({ where: { name: { not: "" } }, include: { items: true }, orderBy: { id: "asc" } }),
    db.item.findMany({ include: { category: true, modifiers: true, modifierGroups: { include: { options: true } }, schedules: true, ingredients: { include: { ingredient: true } } }, orderBy: { id: "asc" } }),
    db.order.findMany({ include: { lines: { include: { item: true } }, payments: true, guest: true, courier: true, statusHistory: true }, orderBy: { createdAt: "desc" } }),
    db.guest.findMany({ include: { orders: { include: { lines: { include: { item: true } }, payments: true }, orderBy: { createdAt: "desc" } } } }),
    db.ingredient.findMany({ orderBy: { id: "asc" } }),
    db.stockMovement.findMany({ include: { ingredient: true }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.expense.findMany({ orderBy: { createdAt: "desc" } }),
    db.deliveryZone.findMany({ orderBy: { id: "asc" } }),
    db.reservation.findMany({ include: { table: true, hall: true }, orderBy: { date: "asc" } }),
    db.setting.findMany({ where: { section: "Каналы" } }),
    db.promocode.findMany({ orderBy: { id: "desc" } }),
    db.hall.findMany({ include: { tables: true }, orderBy: { id: "asc" } }),
  ]);
  const now = new Date(); const hour = now.getHours(); const day = now.getDay() || 7;
  const availableItems = items.filter(item => !item.schedules.length || item.schedules.some(schedule => schedule.active && schedule.days.split(",").includes(String(day)) && hour >= schedule.startHour && hour < schedule.endHour)).map(item => ({ ...item, modifiers: [...item.modifiers, ...item.modifierGroups.flatMap(group => group.options)] as typeof item.modifiers, site: settings.find(s => s.key === "channel_site")?.value !== "false" && item.site, kiosk: settings.find(s => s.key === "channel_kiosk")?.value !== "false" && item.kiosk }));
  return NextResponse.json({ categories, items: availableItems, orders, guests, ingredients, movements, expenses, zones, reservations, settings, promocodes, halls });
}
