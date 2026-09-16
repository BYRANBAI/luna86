import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export async function POST(req: Request) {
  const b = await req.json();
  if (b.entity === "category") {
    if (!String(b.name ?? "").trim()) return NextResponse.json({ error: "Название категории обязательно" }, { status: 400 });
    return NextResponse.json(await db.category.create({ data: { name: String(b.name).trim(), color: b.color ?? "#d8b45b" } }));
  }
  if (b.entity === "item") {
    if (!String(b.name ?? "").trim()) return NextResponse.json({ error: "Название блюда обязательно" }, { status: 400 });
    return NextResponse.json(await db.item.create({ data: { name: String(b.name).trim(), description: b.description ?? "", price: Number(b.price), cost: Number(b.cost ?? 0), categoryId: Number(b.categoryId), labels: b.labels ?? "", cookingMinutes: Number(b.cookingMinutes ?? 12), workshop: b.workshop ?? "горячий", dailyLimit: b.dailyLimit ? Number(b.dailyLimit) : null, site: b.site !== false, app: b.app !== false, kiosk: b.kiosk !== false, bot: b.bot !== false } }));
  }
  if (b.entity === "guest") return NextResponse.json(await db.guest.create({ data: { name: b.name, phone: b.phone } }));
  if (b.entity === "expense") return NextResponse.json(await db.expense.create({ data: { category: b.category, amount: Number(b.amount), note: b.note ?? "" } }));
  if (b.entity === "ingredient") return NextResponse.json(await db.ingredient.create({ data: { name: b.name, unit: b.unit ?? "г", stock: Number(b.stock ?? 0), costPerUnit: Number(b.costPerUnit ?? 1) } }));
  if (b.entity === "movement") {
    const ing = await db.ingredient.update({ where: { id: Number(b.ingredientId) }, data: { stock: { increment: b.type === "Приход" ? Number(b.quantity) : -Number(b.quantity) } } });
    await db.stockMovement.create({ data: { type: b.type, quantity: Number(b.quantity), reason: b.reason, price: b.price ? Number(b.price) : null, ingredientId: ing.id } });
    const recipes = await db.recipeIngredient.findMany({ where: { ingredientId: ing.id } });
    for (const recipe of recipes) await db.item.update({ where: { id: recipe.itemId }, data: ing.stock <= 0 ? { stock: 0 } : { stock: { increment: Math.max(1, Math.floor(Number(b.quantity) / Math.max(1, recipe.grams))) } } });
    return NextResponse.json(ing);
  }
  if (b.entity === "recipe") {
    const recipe = await db.recipeIngredient.create({ data: { itemId: Number(b.itemId), ingredientId: Number(b.ingredientId), grams: Number(b.grams) } });
    const all = await db.recipeIngredient.findMany({ where: { itemId: Number(b.itemId) }, include: { ingredient: true } });
    const cost = all.reduce((s, x) => s + x.grams * x.ingredient.costPerUnit, 0);
    await db.item.update({ where: { id: Number(b.itemId) }, data: { cost: Math.round(cost) } });
    return NextResponse.json(recipe);
  }
  return NextResponse.json({ error: "Неизвестная сущность" }, { status: 400 });
}
export async function PATCH(req: Request) {
  const b = await req.json();
  if (b.entity === "category") {
    if (!String(b.name ?? "").trim()) return NextResponse.json({ error: "Название категории обязательно" }, { status: 400 });
    return NextResponse.json(await db.category.update({ where: { id: Number(b.id) }, data: { name: String(b.name).trim(), active: b.active } }));
  }
  if (b.entity === "item") {
    if (!String(b.name ?? "").trim()) return NextResponse.json({ error: "Название блюда обязательно" }, { status: 400 });
    return NextResponse.json(await db.item.update({ where: { id: Number(b.id) }, data: { name: String(b.name).trim(), description: b.description, price: Number(b.price), categoryId: Number(b.categoryId), active: b.active, stock: b.stock === undefined ? undefined : Number(b.stock), dailyLimit: b.dailyLimit ? Number(b.dailyLimit) : null, labels: b.labels, cookingMinutes: Number(b.cookingMinutes), workshop: b.workshop, site: b.site, app: b.app, kiosk: b.kiosk, bot: b.bot } }));
  }
  if (b.entity === "guest") return NextResponse.json(await db.guest.update({ where: { id: Number(b.id) }, data: { bonuses: Number(b.bonuses) } }));
  if (b.entity === "order") return NextResponse.json(await db.order.update({ where: { id: Number(b.id) }, data: { status: b.status, tableNumber: b.tableNumber } }));
  return NextResponse.json({ error: "Неизвестная сущность" }, { status: 400 });
}
export async function DELETE(req: Request) {
  const b = await req.json();
  if (b.entity === "item") return NextResponse.json(await db.item.delete({ where: { id: Number(b.id) } }));
  if (b.entity === "category") {
    const count = await db.item.count({ where: { categoryId: Number(b.id) } });
    if (count) return NextResponse.json({ error: "Нельзя удалить категорию с блюдами: сначала перенесите или удалите блюда" }, { status: 409 });
    return NextResponse.json(await db.category.delete({ where: { id: Number(b.id) } }));
  }
  if (b.entity === "recipe") return NextResponse.json(await db.recipeIngredient.delete({ where: { id: Number(b.id) } }));
  return NextResponse.json({ ok: true });
}
