import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const items = await db.item.findMany({
      where: {
        active: true,
        site: true,
        stock: { gt: 0 },
      },
      orderBy: [{ categoryId: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        photo: true,
        categoryId: true,
        labels: true,
        calories: true,
        stock: true,
      },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Get items error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
