import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CreateOrderSchema, UpdateOrderSchema, validateData } from "@/lib/schemas";
import { emitOrderUpdate, emitStockUpdate } from "@/lib/socket";
import { verifyAccessToken } from "@/lib/auth";
import { z } from "zod";

// Схема для заказа с сайта доставки
const DeliveryOrderSchema = z.object({
  guestId: z.number(),
  items: z.array(z.object({
    itemId: z.number().int().positive(),
    qty: z.number().int().positive(),
  })).min(1),
  addressId: z.number().int().positive(),
  bonusesToUse: z.number().int().min(0).default(0),
  paymentMethod: z.enum(["cash", "card_delivery"]),
  comment: z.string().max(1000).optional(),
  source: z.literal("Сайт"),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  // Website requests must not fall through to the staff order flow.
  if (body.source === "Сайт" && ("items" in body || "addressId" in body)) {
    return handleDeliveryOrder(req, body);
  }

  // Валидация входных данных для CRM заказа
  const validation = validateData(CreateOrderSchema, body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { lines } = validation.data;

  try {
    // Используем транзакцию для атомарности операции
    const result = await db.$transaction(async (tx) => {
      // 1. Проверяем наличие блюд и ингредиентов
      const items = await tx.item.findMany({
        where: { id: { in: lines.map(x => x.itemId) } },
        include: {
          ingredients: {
            include: {
              ingredient: true
            }
          }
        }
      });

      // Валидация наличия блюд
      for (const line of lines) {
        const item = items.find(i => i.id === line.itemId);
        if (!item || item.stock < line.qty) {
          if (item) await tx.item.update({ where: { id: item.id }, data: { stock: 0 } });
          throw new Error(`Недостаточно блюда «${item?.name ?? "неизвестное блюдо"}»: доступно ${item?.stock ?? 0}`);
        }

        // Проверка ингредиентов
        for (const recipe of item.ingredients) {
          const available = recipe.ingredient.stock;
          const required = recipe.grams * line.qty;
          if (required > available) {
            await tx.item.update({ where: { id: line.itemId }, data: { stock: 0 } });
            throw new Error(`Недостаточно остатка: доступно ${available} ${recipe.ingredient.unit} ингредиента «${recipe.ingredient.name}»`);
          }
        }
      }

      // 2. Расчет суммы заказа
      const modifiers = (body.modifiers ?? {}) as Record<string, number>;
      const subtotal = lines.reduce((sum, line) => {
        const item = items.find(i => i.id === line.itemId);
        return sum + ((item?.price ?? 0) + (modifiers[String(line.itemId)] ?? 0)) * line.qty;
      }, 0);

      // 3. Применение промокода
      const promo = body.promocode
        ? await tx.promocode.findFirst({ where: { code: String(body.promocode).toUpperCase(), active: true } })
        : null;
      const discount = promo && (!promo.usageLimit || promo.used < promo.usageLimit)
        ? Math.floor(subtotal * promo.discount / 100)
        : 0;

      const bonus = Math.min(Number(body.bonus ?? 0), subtotal);
      const delivery = body.deliveryFee ? Number(body.deliveryFee) : 0;
      const total = Math.max(0, subtotal - discount - bonus + delivery);

      // 4. Получение или создание гостя
      const requestedGuest = body.guestId
        ? await tx.guest.findUnique({ where: { id: Number(body.guestId) } })
        : null;
      const fallbackGuest = requestedGuest ?? await tx.guest.findFirst();

      // 5. Создание заказа
      const order = await tx.order.create({
        data: {
          number: String(Math.floor(100 + Math.random() * 899)),
          source: body.source ?? "Сайт",
          status: "NEW",
          total,
          discount,
          guestId: fallbackGuest?.id,
          tableNumber: body.tableNumber,
          readyAt: new Date(Date.now() + 20 * 60000),
          statusHistory: {
            create: { status: "NEW", note: "Заказ создан" }
          },
          lines: {
            create: lines.map(line => {
              const item = items.find(i => i.id === line.itemId);
              return {
                itemId: line.itemId,
                qty: line.qty,
                price: (item?.price ?? 0) + (modifiers[String(line.itemId)] ?? 0),
                modifiers: body.modifierNames?.[String(line.itemId)] ?? ""
              };
            })
          }
        },
        include: {
          lines: { include: { item: true } },
          statusHistory: true
        }
      });

      // 6. Списание блюд и ингредиентов
      for (const line of lines) {
        const item = items.find(i => i.id === line.itemId);

        // Обновляем остаток блюда
        await tx.item.update({
          where: { id: line.itemId },
          data: {
            stock: { decrement: line.qty },
            soldToday: { increment: line.qty }
          }
        });

        // Списываем ингредиенты
        if (item) {
          for (const recipe of item.ingredients) {
            await tx.ingredient.update({
              where: { id: recipe.ingredientId },
              data: { stock: { decrement: recipe.grams * line.qty } }
            });

            await tx.stockMovement.create({
              data: {
                type: "Автосписание",
                quantity: recipe.grams * line.qty,
                reason: `Заказ №${order.number}`,
                ingredientId: recipe.ingredientId,
                orderId: order.id
              }
            });
          }
        }
      }

      // 7. Обработка бонусов
      if (bonus && fallbackGuest) {
        await tx.guest.update({
          where: { id: fallbackGuest.id },
          data: { bonuses: { decrement: bonus } }
        });
      }

      // 8. Создание платежей
      const requestedBonusPayment = Number(
        (body.payments ?? []).find((payment: { type?: string }) => payment.type === "Бонусы")?.amount
        ?? body.bonus
        ?? 0
      );
      const bonusPayment = Math.min(Math.max(0, requestedBonusPayment), total);
      const cardPayment = total - bonusPayment;
      const paymentType = String(body.paymentType ?? "Карта").replace("Смешанная: бонусы + ", "");

      const payments = bonusPayment > 0
        ? [{ type: "Бонусы", amount: bonusPayment }, { type: paymentType, amount: cardPayment }]
        : [{ type: paymentType, amount: total }];

      for (const payment of payments) {
        await tx.payment.create({
          data: {
            orderId: order.id,
            type: payment.type,
            amount: payment.amount
          }
        });
      }

      // 9. Начисление бонусов за заказ
      if (fallbackGuest) {
        await tx.guest.update({
          where: { id: fallbackGuest.id },
          data: { bonuses: { increment: Math.floor(total * 0.05) } }
        });
      }

      // 10. Обновление промокода
      if (promo) {
        await tx.promocode.update({
          where: { id: promo.id },
          data: { used: { increment: 1 } }
        });
      }

      return order;
    });

    // Отправляем WebSocket событие о новом заказе
    try {
      emitOrderUpdate(result);
      // Уведомляем об изменении остатков
      for (const line of lines) {
        emitStockUpdate({ itemId: line.itemId });
      }
    } catch (socketError) {
      console.error("WebSocket emit error:", socketError);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка создания заказа" },
      { status: 400 }
    );
  }
}

async function handleDeliveryOrder(req: NextRequest, body: any) {
  try {
    // Проверяем авторизацию
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "guest") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (payload.userId !== body.guestId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Валидация данных заказа
    const validated = DeliveryOrderSchema.parse(body);

    // Используем транзакцию
    const result = await db.$transaction(async (tx) => {
      // Проверяем гостя
      const guest = await tx.guest.findUnique({
        where: { id: validated.guestId },
      });

      if (!guest) {
        throw new Error("Гость не найден");
      }

      // Проверяем адрес
      const address = await tx.guestAddress.findFirst({
        where: {
          id: validated.addressId,
          guestId: validated.guestId,
        },
      });

      if (!address) {
        throw new Error("Адрес не найден");
      }

      // Проверяем блюда
      const items = await tx.item.findMany({
        where: { id: { in: validated.items.map(x => x.itemId) } },
        include: {
          ingredients: {
            include: {
              ingredient: true,
            },
          },
        },
      });

      if (new Set(validated.items.map(item => item.itemId)).size !== validated.items.length) {
        throw new Error("Объедините повторяющиеся блюда в корзине");
      }
      const ingredientTotals = new Map<number, number>();
      for (const cartItem of validated.items) {
        const item = items.find(i => i.id === cartItem.itemId);
        if (!item || !item.active || !item.site) {
          throw new Error("Блюдо недоступно для доставки");
        }
        if (item.stock < cartItem.qty || (item.dailyLimit !== null && item.soldToday + cartItem.qty > item.dailyLimit)) {
          throw new Error(`Недостаточно блюда «${item.name}»`);
        }
        for (const recipe of item.ingredients) {
          const required = (ingredientTotals.get(recipe.ingredientId) ?? 0) + recipe.grams * cartItem.qty;
          ingredientTotals.set(recipe.ingredientId, required);
          if (required > recipe.ingredient.stock) {
            throw new Error(`Недостаточно ингредиента «${recipe.ingredient.name}»`);
          }
        }
      }

      // Цены и сумма рассчитываются только по данным из базы
      const pricedItems = validated.items.map((cartItem) => {
        const item = items.find((candidate) => candidate.id === cartItem.itemId)!;
        return { ...cartItem, price: item.deliveryPrice ?? item.price };
      });
      const subtotal = pricedItems.reduce((sum, cartItem) => sum + cartItem.price * cartItem.qty, 0);

      // Проверяем бонусы
      const maxBonusUse = Math.min(guest.bonuses, Math.floor(subtotal * 0.5));
      const bonusesToUse = Math.min(validated.bonusesToUse, maxBonusUse);

      const deliveryFee = 0; // Можно добавить расчет по зонам
      const total = Math.max(0, subtotal - bonusesToUse + deliveryFee);

      const deliveryAddress = `${address.street}, ${address.building}${address.apartment ? `, кв. ${address.apartment}` : ""}`;
      const addressNote = [
        "Сайт",
        `Адрес: ${deliveryAddress}`,
        validated.comment ? `Комментарий: ${validated.comment}` : null,
      ].filter(Boolean).join(" · ");

      // Создаем заказ: source «Доставка» + пустой стол — чтобы заказ попал в POS «навынос» и админ «Доставка»
      const order = await tx.order.create({
        data: {
          number: String(Date.now()).slice(-6),
          source: "Доставка",
          status: "NEW",
          total,
          discount: bonusesToUse,
          guestId: guest.id,
          tableNumber: "",
          readyAt: new Date(Date.now() + 45 * 60000),
          statusHistory: {
            create: {
              status: "NEW",
              note: addressNote,
            },
          },
          lines: {
            create: pricedItems.map(cartItem => ({
              itemId: cartItem.itemId,
              qty: cartItem.qty,
              price: cartItem.price,
              modifiers: "",
            })),
          },
        },
        select: {
          id: true, number: true, status: true, total: true, discount: true,
          createdAt: true, readyAt: true,
          lines: { select: { itemId: true, qty: true, price: true } },
        },
      });

      // Списываем блюда и ингредиенты
      for (const cartItem of validated.items) {
        const item = items.find(i => i.id === cartItem.itemId);

        await tx.item.update({
          where: { id: cartItem.itemId },
          data: {
            stock: { decrement: cartItem.qty },
            soldToday: { increment: cartItem.qty },
          },
        });

        if (item) {
          for (const recipe of item.ingredients) {
            await tx.ingredient.update({
              where: { id: recipe.ingredientId },
              data: { stock: { decrement: recipe.grams * cartItem.qty } },
            });

            await tx.stockMovement.create({
              data: {
                type: "Автосписание",
                quantity: recipe.grams * cartItem.qty,
                reason: `Заказ №${order.number}`,
                ingredientId: recipe.ingredientId,
                orderId: order.id,
              },
            });
          }
        }
      }

      // Списываем бонусы
      if (bonusesToUse > 0) {
        await tx.guest.update({
          where: { id: guest.id },
          data: { bonuses: { decrement: bonusesToUse } },
        });

        await tx.bonusTransaction.create({
          data: {
            guestId: guest.id,
            amount: -bonusesToUse,
            type: "Списание",
            reason: `Заказ №${order.number}`,
            orderId: order.id,
          },
        });
      }

      // Начисляем бонусы за заказ (5% от суммы)
      const earnedBonuses = Math.floor(total * 0.05);
      await tx.guest.update({
        where: { id: guest.id },
        data: { bonuses: { increment: earnedBonuses } },
      });

      await tx.bonusTransaction.create({
        data: {
          guestId: guest.id,
          amount: earnedBonuses,
          type: "Начисление",
          reason: `Заказ №${order.number}`,
          orderId: order.id,
        },
      });

      // Создаем платеж
      await tx.payment.create({
        data: {
          orderId: order.id,
          type: validated.paymentMethod === "card_delivery" ? "Карта" : "Наличные",
          amount: total,
        },
      });

      return order;
    });

    // Отправляем WebSocket событие
    try {
      emitOrderUpdate(result);
      for (const item of validated.items) {
        emitStockUpdate({ itemId: item.itemId });
      }
    } catch (socketError) {
      console.error("WebSocket emit error:", socketError);
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Delivery order error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка создания заказа" },
      { status: 400 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();

  // Валидация
  const validation = validateData(UpdateOrderSchema, body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    if (body.lineId) {
      const result = await db.orderLine.update({
        where: { id: Number(body.lineId) },
        data: { status: body.status }
      });
      return NextResponse.json(result);
    }

    const result = await db.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: Number(body.id) },
        data: {
          status: body.status,
          readyAt: body.status === "READY" ? new Date() : undefined
        }
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: body.status,
          note: body.note ?? ""
        }
      });

      return order;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Order update error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка обновления заказа" },
      { status: 400 }
    );
  }
}
