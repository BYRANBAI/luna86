import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/items/[id]/modifiers - получить модификаторы для товара
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const itemId = parseInt(id);

    // Свободные добавки и группы с обязательным выбором (размер порции и т.п.)
    const [modifiers, groups] = await Promise.all([
      db.modifier.findMany({
        where: { itemId },
        orderBy: { id: "asc" },
      }),
      db.modifierGroup.findMany({
        where: { itemId },
        orderBy: { id: "asc" },
        include: { options: { orderBy: { id: "asc" } } },
      }),
    ]);

    return NextResponse.json({ modifiers, groups });
  } catch (error) {
    console.error("Get modifiers error:", error);
    return NextResponse.json(
      { error: "Ошибка получения модификаторов" },
      { status: 500 }
    );
  }
}
