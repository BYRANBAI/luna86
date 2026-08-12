import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAccessToken } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "guest") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderId = parseInt(params.id);
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        lines: {
          include: {
            item: {
              select: {
                id: true,
                name: true,
                photo: true,
              },
            },
          },
        },
        guest: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Проверяем, что заказ принадлежит этому гостю
    if (order.guestId !== payload.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Get order error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
