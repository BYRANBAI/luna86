import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export async function POST(req: Request) {
  const body = await req.json();
  const lines = body.lines as { itemId: number; qty: number }[];
  const items = await db.item.findMany({ where: { id: { in: lines.map(x => x.itemId) } } });
  for (const line of lines) {
    const item = items.find(i => i.id === line.itemId);
    if (!item || item.stock < line.qty) {
      if (item) await db.item.update({ where: { id: item.id }, data: { stock: 0 } });
      return NextResponse.json({ error: `Недостаточно блюда «${item?.name ?? "неизвестное блюдо"}»: доступно ${item?.stock ?? 0}` }, { status: 400 });
    }
    const recipes = await db.recipeIngredient.findMany({ where: { itemId: line.itemId }, include: { ingredient: true } });
    for (const recipe of recipes) {
      const available = recipe.ingredient.stock;
      const required = recipe.grams * line.qty;
      if (required > available) {
        await db.item.update({ where: { id: line.itemId }, data: { stock: 0 } });
        return NextResponse.json({ error: `Недостаточно остатка: доступно ${available} ${recipe.ingredient.unit} ингредиента «${recipe.ingredient.name}»` }, { status: 400 });
      }
    }
  }
  const modifiers = (body.modifiers ?? {}) as Record<string, number>;
  const subtotal = lines.reduce((sum, line) => sum + ((items.find(i => i.id === line.itemId)?.price ?? 0) + (modifiers[String(line.itemId)] ?? 0)) * line.qty, 0);
  const promo = body.promocode ? await db.promocode.findFirst({ where: { code: String(body.promocode).toUpperCase(), active: true } }) : null;
  const discount = promo && (!promo.usageLimit || promo.used < promo.usageLimit) ? Math.floor(subtotal * promo.discount / 100) : 0;
  const bonus = Math.min(Number(body.bonus ?? 0), subtotal);
  const delivery = body.deliveryFee ? Number(body.deliveryFee) : 0;
  const total = Math.max(0, subtotal - discount - bonus + delivery);
  const requestedGuest = body.guestId ? await db.guest.findUnique({ where: { id: Number(body.guestId) } }) : null;
  const fallbackGuest = requestedGuest ?? await db.guest.findFirst();
  const order = await db.order.create({ data: { number: String(Math.floor(100 + Math.random() * 899)), source: body.source ?? "Сайт", total, discount, guestId: fallbackGuest?.id, tableNumber: body.tableNumber, readyAt: new Date(Date.now() + 20 * 60000), statusHistory: { create: { status: "NEW", note: "Заказ создан" } }, lines: { create: lines.map(line => ({ itemId: line.itemId, qty: line.qty, price: (items.find(i => i.id === line.itemId)?.price ?? 0) + (modifiers[String(line.itemId)] ?? 0), modifiers: body.modifierNames?.[String(line.itemId)] ?? "" })) } }, include: { lines: { include: { item: true } }, statusHistory: true } });
  for (const line of lines) {
    const item = items.find(i => i.id === line.itemId);
    await db.item.update({ where: { id: line.itemId }, data: { stock: { decrement: line.qty }, soldToday: { increment: line.qty } } });
    if (item) {
      const recipe = await db.recipeIngredient.findMany({ where: { itemId: item.id } });
      for (const r of recipe) {
        await db.ingredient.update({ where: { id: r.ingredientId }, data: { stock: { decrement: r.grams * line.qty } } });
        await db.stockMovement.create({ data: { type: "Автосписание", quantity: r.grams * line.qty, reason: `Заказ №${order.number}`, ingredientId: r.ingredientId, orderId: order.id } });
      }
    }
  }
  if (bonus && fallbackGuest) await db.guest.update({ where: { id: fallbackGuest.id }, data: { bonuses: { decrement: bonus } } });
  const requestedBonusPayment = Number((body.payments ?? []).find((payment: { type?: string }) => payment.type === "Бонусы")?.amount ?? body.bonus ?? 0);
  const bonusPayment = Math.min(Math.max(0, requestedBonusPayment), total);
  const cardPayment = total - bonusPayment;
  const paymentType = String(body.paymentType ?? "Карта").replace("Смешанная: бонусы + ", "");
  const payments = bonusPayment > 0
    ? [{ type: "Бонусы", amount: bonusPayment }, { type: paymentType, amount: cardPayment }]
    : [{ type: paymentType, amount: total }];
  for (const payment of payments) await db.payment.create({ data: { orderId: order.id, type: payment.type, amount: payment.amount } });
  if (fallbackGuest) await db.guest.update({ where: { id: fallbackGuest.id }, data: { bonuses: { increment: Math.floor(total * 0.05) } } });
  if (promo) await db.promocode.update({ where: { id: promo.id }, data: { used: { increment: 1 } } });
  return NextResponse.json(order);
}
export async function PATCH(req: Request) {
  const body = await req.json();
  if (body.lineId) return NextResponse.json(await db.orderLine.update({ where: { id: Number(body.lineId) }, data: { status: body.status } }));
  const order = await db.order.update({ where: { id: Number(body.id) }, data: { status: body.status, readyAt: body.status === "READY" ? new Date() : undefined } });
  await db.orderStatusHistory.create({ data: { orderId: order.id, status: body.status, note: body.note ?? "" } });
  return NextResponse.json(order);
}
