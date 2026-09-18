import { NextResponse } from "next/server";
import { currentUser, canAccess } from "@/lib/auth";
import { db } from "@/lib/db";

const sectionFor = (entity: string) => ({
  item: "menu", category: "menu", modifier: "menu", modifierGroup: "menu", modifierOption: "menu", schedule: "menu", recipe: "recipes", recipeVersion: "recipes",
  movement: "stock", ingredient: "stock", supplier: "suppliers",
  order: "orders", courier: "delivery", reservation: "hall",
  guest: "guests", promotion: "loyalty", promocode: "loyalty",
  campaign: "loyalty", shift: "shifts", setting: "settings",
  audit: "audit", zone: "delivery", bonusRule: "loyalty", combo: "loyalty",
  finance: "finance", purchaseRequest: "stock", guestBonus: "guests",
  deliveryStatus: "delivery", assignCourier: "delivery", user: "staff", timeEntry: "staff", cashCollection: "shifts",
  xReport: "shifts", hall: "hall", table: "hall", guestMerge: "guests",
  reservationStatus: "hall", siteItem: "site", siteSetting: "site",
}[entity] ?? "dashboard");

async function guard(entity = "dashboard") {
  const user = await currentUser();
  if (!user) return { error: NextResponse.json({ error: "Не авторизован" }, { status: 401 }) };
  if (!canAccess(user.role, sectionFor(entity))) return { error: NextResponse.json({ error: "Недостаточно прав" }, { status: 403 }) };
  return { user };
}

async function audit(userId: number, section: string, action: string, entity: string, entityId?: number, details = "") {
  await db.auditLog.create({ data: { userId, section, action, entity, entityId, details } });
}

export async function GET(req: Request) {
  const auth = await guard();
  if (auth.error) return auth.error;
  const url = new URL(req.url);
  const section = url.searchParams.get("section") ?? "dashboard";
  if (!canAccess(auth.user!.role, section)) return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
  const [categories, items, ingredients, movements, suppliers, orders, guests, couriers, reservations, promotions, promocodes, campaigns, halls, shifts, settings, auditLogs, zones, expenses, bonusRules, combos, finances, purchaseRequests, users, timeEntries] = await Promise.all([
    db.category.findMany({ include: { items: true }, orderBy: { sort: "asc" } }),
    db.item.findMany({ include: { category: true, ingredients: { include: { ingredient: true } }, modifiers: true, modifierGroups: { include: { options: true } } }, orderBy: { id: "asc" } }),
    db.ingredient.findMany({ orderBy: { name: "asc" } }),
    db.stockMovement.findMany({ include: { ingredient: true, order: true, supplier: true }, orderBy: { createdAt: "desc" }, take: 100 }),
    db.supplier.findMany({ orderBy: { name: "asc" } }),
    db.order.findMany({ include: { lines: { include: { item: true } }, payments: true, guest: true, employee: true, courier: true, statusHistory: true, cancellations: true }, orderBy: { createdAt: "desc" }, take: 200 }),
    db.guest.findMany({
      omit: { passwordHash: true, refreshToken: true },
      include: { orders: true, addresses: true },
      orderBy: { createdAt: "desc" },
    }),
    db.courier.findMany({ orderBy: { name: "asc" } }),
    db.reservation.findMany({ include: { table: true, hall: true }, orderBy: { date: "asc" } }),
    db.promotion.findMany({ orderBy: { id: "desc" } }),
    db.promocode.findMany({ orderBy: { id: "desc" } }),
    db.campaign.findMany({ orderBy: { createdAt: "desc" } }),
    db.hall.findMany({ include: { tables: true }, orderBy: { id: "asc" } }),
    db.shift.findMany({ include: { user: true }, orderBy: { openedAt: "desc" }, take: 30 }),
    db.setting.findMany({ orderBy: { section: "asc" } }),
    db.auditLog.findMany({ include: { user: true }, orderBy: { createdAt: "desc" }, take: 100 }),
    db.deliveryZone.findMany({ orderBy: { id: "asc" } }),
    db.expense.findMany({ orderBy: { createdAt: "desc" } }),
    db.bonusRule.findMany({ orderBy: { id: "desc" } }),
    db.combo.findMany({ orderBy: { id: "desc" } }),
    db.financialTransaction.findMany({ orderBy: { createdAt: "desc" } }),
    db.purchaseRequest.findMany({ include: { ingredient: true }, orderBy: { createdAt: "desc" } }),
    db.user.findMany({ orderBy: { name: "asc" } }),
    db.timeEntry.findMany({ include: { user: true }, orderBy: { startedAt: "desc" }, take: 100 }),
  ]);
  const revenue = orders.filter(o => o.createdAt.toDateString() === new Date().toDateString()).reduce((s, o) => s + o.total, 0);
  const active = orders.filter(o => !["DONE", "CANCELLED"].includes(o.status)).length;
  const recent = orders.filter(o => o.createdAt.getTime() >= Date.now() - 7 * 86400000);
  const topMap = new Map<number, { name: string; qty: number; revenue: number }>();
  for (const order of recent) for (const line of order.lines) {
    const current = topMap.get(line.itemId) ?? { name: line.item.name, qty: 0, revenue: 0 };
    current.qty += line.qty; current.revenue += line.price * line.qty; topMap.set(line.itemId, current);
  }
  const topItems = [...topMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  const revenue7 = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(); day.setHours(0, 0, 0, 0); day.setDate(day.getDate() - (6 - index));
    const next = new Date(day); next.setDate(day.getDate() + 1);
    return { date: day.toISOString().slice(0, 10), revenue: recent.filter(o => o.createdAt >= day && o.createdAt < next).reduce((s, o) => s + o.total, 0) };
  });
  const foodCost = recent.length ? Math.round(recent.reduce((sum, order) => sum + order.lines.reduce((lineSum, line) => lineSum + line.item.cost * line.qty, 0), 0) / recent.reduce((sum, order) => sum + order.total, 0) * 100) : 0;
  const occupied = new Set(orders.filter(o => o.tableNumber && !["DONE", "CANCELLED"].includes(o.status)).map(o => o.tableNumber)).size;
  const stopItems = items.filter(i => !i.active || i.stock <= 0);
  return NextResponse.json({ categories, items, ingredients, movements, suppliers, orders, guests, couriers, reservations, promotions, promocodes, campaigns, halls, shifts, settings, auditLogs, zones, expenses, bonusRules, combos, finances, purchaseRequests, users, timeEntries, metrics: { revenue, revenue7, topItems, active, average: orders.length ? Math.round(orders.reduce((s, o) => s + o.total, 0) / orders.length) : 0, foodCost, occupied, tables: halls.reduce((s, h) => s + h.tables.length, 0), stop: stopItems.length, stopItems, lowStock: ingredients.filter(i => i.stock <= i.minStock) } });
}

export async function POST(req: Request) {
  const body = await req.json();
  const auth = await guard(String(body.entity ?? ""));
  if (auth.error) return auth.error;
  const user = auth.user!;
  let result: unknown;
  const entity = String(body.entity);
  if (entity === "category") {
    if (!String(body.name ?? "").trim()) return NextResponse.json({ error: "Название категории обязательно" }, { status: 400 });
    result = await db.category.create({ data: { name: String(body.name).trim(), color: body.color ?? "#d8b45b" } });
  } else if (entity === "item") {
    if (!String(body.name ?? "").trim()) return NextResponse.json({ error: "Название блюда обязательно" }, { status: 400 });
    const category = await db.category.findFirst({ where: { id: Number(body.categoryId) } }) ?? await db.category.findFirst();
    if (!category) return NextResponse.json({ error: "Сначала создайте категорию" }, { status: 400 });
    result = await db.item.create({ data: { name: String(body.name).trim(), description: body.description ?? "", price: Number(body.price), cost: Number(body.cost ?? 0), categoryId: category.id, labels: body.labels ?? "", cookingMinutes: Number(body.cookingMinutes ?? 12), workshop: body.workshop ?? "горячий", dailyLimit: body.dailyLimit ? Number(body.dailyLimit) : null, site: body.site !== false, app: body.app !== false, kiosk: body.kiosk !== false, bot: body.bot !== false } });
  }
  else if (entity === "supplier") result = await db.supplier.create({ data: { name: body.name, phone: body.phone ?? "", email: body.email ?? "", note: body.note ?? "", priceList: body.priceList ?? "" } });
  else if (entity === "courier") result = await db.courier.create({ data: { name: body.name, phone: body.phone, status: body.status ?? "Свободен" } });
  else if (entity === "reservation") result = await db.reservation.create({ data: { date: new Date(body.date), guestName: body.guestName, phone: body.phone ?? "", guests: Number(body.guests ?? 1), status: body.status ?? "Новая", hallId: Number(body.hallId), tableId: body.tableId ? Number(body.tableId) : null } });
  else if (entity === "promotion") result = await db.promotion.create({ data: { name: body.name, condition: body.condition ?? "", action: body.action ?? "" } });
  else if (entity === "promocode") result = await db.promocode.create({ data: { code: String(body.code).toUpperCase(), discount: Number(body.discount ?? 0), usageLimit: body.usageLimit ? Number(body.usageLimit) : null } });
  else if (entity === "campaign") result = await db.campaign.create({ data: { name: body.name, segment: body.segment ?? "Все", channel: body.channel ?? "Telegram", status: "Отправлено", sent: 1, delivered: 1 } });
  else if (entity === "setting") result = await db.setting.upsert({ where: { key: body.key }, update: { value: String(body.value) }, create: { key: body.key, value: String(body.value), section: body.section ?? "Общие" } });
  else if (entity === "movement") {
    const quantity = Number(body.quantity);
    const current = await db.ingredient.findUnique({ where: { id: Number(body.ingredientId) } });
    if (!current) return NextResponse.json({ error: "Ингредиент не найден" }, { status: 404 });
    if (body.type === "Списание" && quantity > current.stock)
      return NextResponse.json({ error: `Недостаточно остатка: доступно ${current.stock} ${current.unit}` }, { status: 400 });
    const ingredient = await db.ingredient.update({ where: { id: Number(body.ingredientId) }, data: { stock: { increment: body.type === "Приход" ? quantity : -quantity } } });
    result = await db.stockMovement.create({ data: { type: body.type, quantity, reason: body.reason ?? "", ingredientId: ingredient.id, supplierId: body.supplierId ? Number(body.supplierId) : null, price: body.price == null || body.price === "" ? null : Number(body.price) } });
    const affected = await db.recipeIngredient.findMany({ where: { ingredientId: ingredient.id }, include: { item: { include: { ingredients: { include: { ingredient: true } } } } } });
    for (const recipe of affected) {
      const portions = recipe.item.ingredients.length ? Math.max(0, Math.min(...recipe.item.ingredients.map(x => Math.floor(x.ingredient.stock / x.grams)))) : recipe.item.stock;
      await db.item.update({ where: { id: recipe.itemId }, data: { stock: portions } });
    }
  } else if (entity === "shift") result = await db.shift.create({ data: { userId: user.id, openingCash: Number(body.openingCash ?? 0) } });
  else if (entity === "closeShift") result = await db.shift.update({ where: { id: Number(body.id) }, data: { closedAt: new Date(), closingCash: Number(body.closingCash ?? 0), zReport: `Z-отчёт · выручка ${Number(body.revenue ?? 0)} ₽` } });
  else if (entity === "assignCourier") {
    result = await db.order.update({ where: { id: Number(body.orderId) }, data: { courierId: Number(body.courierId), status: "DELIVERY_ASSIGNED" } });
    await db.courier.update({ where: { id: Number(body.courierId) }, data: { status: "Занят" } });
    await db.orderStatusHistory.create({ data: { orderId: Number(body.orderId), status: "DELIVERY_ASSIGNED", note: "Курьер назначен" } });
  }
  else if (entity === "cancelOrder") {
    const order = await db.order.findUnique({ where: { id: Number(body.orderId) }, include: { lines: true } });
    if (!order) return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
    for (const line of order.lines) {
      const recipes = await db.recipeIngredient.findMany({ where: { itemId: line.itemId } });
      for (const recipe of recipes) {
        await db.ingredient.update({ where: { id: recipe.ingredientId }, data: { stock: { increment: recipe.grams * line.qty } } });
        await db.stockMovement.create({ data: { type: "Возврат", quantity: recipe.grams * line.qty, reason: `Отмена заказа №${order.number}`, ingredientId: recipe.ingredientId, orderId: order.id } });
      }
    }
    result = await db.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
    await db.orderCancellation.create({ data: { orderId: order.id, reason: body.reason ?? "Отмена администратором", refundedStock: true } });
    await db.orderStatusHistory.create({ data: { orderId: order.id, status: "CANCELLED", note: body.reason ?? "" } });
  }
  else if (entity === "orderStatus") {
    result = await db.order.update({ where: { id: Number(body.orderId) }, data: { status: body.status } });
    await db.orderStatusHistory.create({ data: { orderId: Number(body.orderId), status: body.status, note: body.note ?? "" } });
  }
  else if (entity === "zone") result = await db.deliveryZone.create({ data: { name: body.name, minOrder: Number(body.minOrder ?? 0), fee: Number(body.fee ?? 0), eta: Number(body.eta ?? 40), addresses: body.addresses ?? "" } });
  else if (entity === "bonusRule") result = await db.bonusRule.create({ data: { name: body.name, earnPercent: Number(body.earnPercent ?? 5), redeemLimit: Number(body.redeemLimit ?? 50), expiryDays: Number(body.expiryDays ?? 365) } });
  else if (entity === "combo") result = await db.combo.create({ data: { name: body.name, itemIds: String(body.itemIds ?? ""), price: Number(body.price ?? 0) } });
  else if (entity === "finance") result = await db.financialTransaction.create({ data: { type: body.type ?? "Расход", category: body.category ?? "Прочее", amount: Number(body.amount ?? 0), note: body.note ?? "" } });
  else if (entity === "purchaseRequest") result = await db.purchaseRequest.create({ data: { ingredientId: Number(body.ingredientId), quantity: Number(body.quantity), status: "Создана" } });
  else if (entity === "guestBonus") {
    const amount = Number(body.amount);
    result = await db.guest.update({ where: { id: Number(body.guestId) }, data: { bonuses: { increment: body.direction === "subtract" ? -amount : amount } } });
  }
  else if (entity === "modifierGroup") result = await db.modifierGroup.create({ data: { name: body.name, min: Number(body.min ?? 0), max: Number(body.max ?? 1), itemId: Number(body.itemId) } });
  else if (entity === "modifierOption") result = await db.modifierOption.create({ data: { name: body.name, price: Number(body.price ?? 0), groupId: Number(body.groupId) } });
  else if (entity === "schedule") result = await db.itemSchedule.create({ data: { itemId: Number(body.itemId), days: body.days ?? "1,2,3,4,5,6,7", startHour: Number(body.startHour ?? 0), endHour: Number(body.endHour ?? 24) } });
  else if (entity === "recipeVersion") result = await db.recipeVersion.create({ data: { itemId: Number(body.itemId), version: Number(body.version ?? 1), note: body.note ?? "", snapshot: JSON.stringify(body.snapshot ?? {}) } });
  else if (entity === "user") result = await db.user.create({ data: { login: String(body.login), name: String(body.name), role: String(body.role), pin: String(body.pin ?? ""), payType: body.payType ?? "Почасовая", baseSalary: Number(body.baseSalary ?? 0), hourlyRate: Number(body.hourlyRate ?? 350), revenuePercent: Number(body.revenuePercent ?? 1), bonusPercent: Number(body.bonusPercent ?? 2), averageCheckPlan: Number(body.averageCheckPlan ?? 500), passwordHash: await (await import("bcryptjs")).hash(String(body.password ?? "luna123"), 10) } });
  else if (entity === "timeEntry") result = await db.timeEntry.create({ data: { userId: Number(body.userId), startedAt: body.startedAt ? new Date(body.startedAt) : new Date(), endedAt: body.endedAt ? new Date(body.endedAt) : null, note: body.note ?? "" } });
  else if (entity === "xReport") {
    const total = await db.order.aggregate({ _sum: { total: true }, where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } });
    result = await db.shift.update({ where: { id: Number(body.id) }, data: { xReport: `X-отчёт · выручка ${total._sum.total ?? 0} ₽` } });
  }
  else if (entity === "cashCollection") result = await db.shift.update({ where: { id: Number(body.id) }, data: { cashCollection: Number(body.amount ?? 0) } });
  else if (entity === "hall") result = await db.hall.create({ data: { name: String(body.name) } });
  else if (entity === "table") result = await db.diningTable.create({ data: { number: String(body.number), seats: Number(body.seats ?? 2), hallId: Number(body.hallId), x: Number(body.x ?? 0), y: Number(body.y ?? 0) } });
  else if (entity === "guestMerge") {
    const from = await db.guest.findUnique({ where: { id: Number(body.fromId) }, include: { orders: true } });
    if (!from) return NextResponse.json({ error: "Дубликат не найден" }, { status: 404 });
    result = await db.$transaction(async tx => { await tx.order.updateMany({ where: { guestId: from.id }, data: { guestId: Number(body.toId) } }); return tx.guest.delete({ where: { id: from.id } }); });
  }
  else return NextResponse.json({ error: "Неизвестная операция" }, { status: 400 });
  await audit(user.id, sectionFor(entity), "Изменение", entity, (result as { id?: number })?.id, JSON.stringify(body));
  return NextResponse.json(result);
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const auth = await guard(String(body.entity ?? ""));
  if (auth.error) return auth.error;
  const user = auth.user!;
  const entity = String(body.entity);
  let result: unknown;
  if (entity === "item") result = await db.item.update({ where: { id: Number(body.id) }, data: { name: body.name?.trim(), description: body.description, price: Number(body.price), dineInPrice: Number(body.dineInPrice ?? body.price), deliveryPrice: Number(body.deliveryPrice ?? body.price), pickupPrice: Number(body.pickupPrice ?? body.price), photo: body.photo ?? undefined, allergens: body.allergens, nutrition: body.nutrition, calories: body.calories ? Number(body.calories) : null, dailyLimit: body.dailyLimit ? Number(body.dailyLimit) : null, active: body.active, site: body.site, app: body.app, kiosk: body.kiosk, bot: body.bot, labels: body.labels, cookingMinutes: Number(body.cookingMinutes ?? 12), workshop: body.workshop } });
  else if (entity === "category") result = await db.category.update({ where: { id: Number(body.id) }, data: { name: body.name?.trim(), active: body.active } });
  else if (entity === "supplier") result = await db.supplier.update({ where: { id: Number(body.id) }, data: { name: body.name, phone: body.phone, email: body.email, note: body.note, priceList: body.priceList } });
  else if (entity === "courier") result = await db.courier.update({ where: { id: Number(body.id) }, data: { name: body.name, phone: body.phone, status: body.status } });
  else if (entity === "guest") result = await db.guest.update({ where: { id: Number(body.id) }, data: { name: body.name, phone: body.phone, email: body.email, tags: body.tags, segment: body.segment, bonuses: body.bonuses === undefined ? undefined : Number(body.bonuses) } });
  else if (entity === "zone") result = await db.deliveryZone.update({ where: { id: Number(body.id) }, data: { name: body.name, minOrder: Number(body.minOrder), fee: Number(body.fee), eta: Number(body.eta), addresses: body.addresses } });
  else if (entity === "reservation") result = await db.reservation.update({ where: { id: Number(body.id) }, data: { date: body.date ? new Date(body.date) : undefined, guestName: body.guestName, phone: body.phone, guests: body.guests ? Number(body.guests) : undefined, status: body.status, tableId: body.tableId ? Number(body.tableId) : null } });
  else if (entity === "setting") result = await db.setting.update({ where: { key: body.key }, data: { value: String(body.value) } });
  else if (entity === "deliveryStatus") {
    result = await db.order.update({ where: { id: Number(body.orderId) }, data: { status: body.status } });
    await db.orderStatusHistory.create({ data: { orderId: Number(body.orderId), status: body.status, note: "" } });
    if (body.status === "DELIVERED") {
      const deliveryOrder = await db.order.findUnique({ where: { id: Number(body.orderId) } });
      if (deliveryOrder?.courierId) await db.courier.update({ where: { id: deliveryOrder.courierId }, data: { status: "Свободен" } });
    }
  }
  else if (entity === "user") result = await db.user.update({ where: { id: Number(body.id) }, data: { name: body.name, role: body.role, pin: body.pin, active: body.active, payType: body.payType, baseSalary: body.baseSalary == null ? undefined : Number(body.baseSalary), hourlyRate: body.hourlyRate == null ? undefined : Number(body.hourlyRate), revenuePercent: body.revenuePercent == null ? undefined : Number(body.revenuePercent), bonusPercent: body.bonusPercent == null ? undefined : Number(body.bonusPercent), averageCheckPlan: body.averageCheckPlan == null ? undefined : Number(body.averageCheckPlan) } });
  else if (entity === "timeEntry") result = await db.timeEntry.update({ where: { id: Number(body.id) }, data: { endedAt: body.endedAt ? new Date(body.endedAt) : new Date(), note: body.note } });
  else if (entity === "hall") result = await db.hall.update({ where: { id: Number(body.id) }, data: { name: body.name } });
  else if (entity === "table") result = await db.diningTable.update({ where: { id: Number(body.id) }, data: { number: body.number, seats: Number(body.seats), x: Number(body.x ?? 0), y: Number(body.y ?? 0) } });
  else if (entity === "reservationStatus") result = await db.reservation.update({ where: { id: Number(body.id) }, data: { status: body.status } });
  else return NextResponse.json({ error: "Неизвестная операция" }, { status: 400 });
  await audit(user.id, sectionFor(entity), "Обновление", entity, (result as { id?: number })?.id, JSON.stringify(body));
  return NextResponse.json(result);
}

export async function DELETE(req: Request) {
  const body = await req.json();
  const auth = await guard(String(body.entity ?? ""));
  if (auth.error) return auth.error;
  const user = auth.user!;
  const entity = String(body.entity); const id = Number(body.id);
  if (entity === "supplier") await db.supplier.delete({ where: { id } });
  else if (entity === "courier") await db.courier.delete({ where: { id } });
  else if (entity === "reservation") await db.reservation.delete({ where: { id } });
  else if (entity === "zone") await db.deliveryZone.delete({ where: { id } });
  else if (entity === "promocode") await db.promocode.delete({ where: { id } });
  else if (entity === "user") await db.user.delete({ where: { id } });
  else if (entity === "hall") await db.hall.delete({ where: { id } });
  else if (entity === "table") await db.diningTable.delete({ where: { id } });
  else return NextResponse.json({ error: "Удаление для сущности не поддерживается" }, { status: 400 });
  await audit(user.id, sectionFor(entity), "Удаление", entity, id);
  return NextResponse.json({ ok: true });
}
