import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

// Схема для создания отзыва
const CreateReviewSchema = z.object({
  itemId: z.number().positive(),
  guestId: z.number().positive(),
  rating: z.number().min(1).max(5),
  comment: z.string().max(500).optional(),
});

// GET /api/reviews?itemId=1 - получить отзывы для товара
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");
    const guestId = searchParams.get("guestId");

    if (itemId) {
      // Получить отзывы для товара
      const reviews = await db.review.findMany({
        where: { itemId: parseInt(itemId) },
        include: {
          guest: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Вычислить средний рейтинг
      const avgRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

      return NextResponse.json({
        reviews,
        avgRating: Math.round(avgRating * 10) / 10,
        totalCount: reviews.length,
      });
    }

    if (guestId) {
      // Получить отзывы гостя
      const reviews = await db.review.findMany({
        where: { guestId: parseInt(guestId) },
        include: {
          item: {
            select: {
              id: true,
              name: true,
              photo: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ reviews });
    }

    return NextResponse.json({ error: "Missing itemId or guestId" }, { status: 400 });
  } catch (error) {
    console.error("Get reviews error:", error);
    return NextResponse.json(
      { error: "Ошибка получения отзывов" },
      { status: 500 }
    );
  }
}

// POST /api/reviews - создать отзыв
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateReviewSchema.parse(body);

    // Проверить, что товар существует
    const item = await db.item.findUnique({
      where: { id: validated.itemId },
    });

    if (!item) {
      return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
    }

    // Проверить, что гость существует
    const guest = await db.guest.findUnique({
      where: { id: validated.guestId },
    });

    if (!guest) {
      return NextResponse.json({ error: "Гость не найден" }, { status: 404 });
    }

    // Проверить, что гость заказывал этот товар
    const hasOrdered = await db.orderLine.findFirst({
      where: {
        itemId: validated.itemId,
        order: {
          guestId: validated.guestId,
          status: "DONE",
        },
      },
    });

    if (!hasOrdered) {
      return NextResponse.json(
        { error: "Вы можете оставить отзыв только на товары, которые заказывали" },
        { status: 403 }
      );
    }

    // Проверить, не оставлял ли гость уже отзыв на этот товар
    const existingReview = await db.review.findFirst({
      where: {
        itemId: validated.itemId,
        guestId: validated.guestId,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "Вы уже оставили отзыв на этот товар" },
        { status: 409 }
      );
    }

    // Создать отзыв
    const review = await db.review.create({
      data: {
        itemId: validated.itemId,
        guestId: validated.guestId,
        rating: validated.rating,
        comment: validated.comment || "",
      },
      include: {
        guest: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Create review error:", error);
    return NextResponse.json(
      { error: "Ошибка создания отзыва" },
      { status: 500 }
    );
  }
}
