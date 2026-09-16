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

    // Получить модификаторы
    const modifiers = await db.modifier.findMany({
      where: { itemId },
      orderBy: { id: "asc" },
    });

    return NextResponse.json(modifiers);
  } catch (error) {
    console.error("Get modifiers error:", error);
    return NextResponse.json(
      { error: "Ошибка получения модификаторов" },
      { status: 500 }
    );
  }
}
