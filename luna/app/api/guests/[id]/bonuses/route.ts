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

    const guestId = parseInt(params.id);
    if (payload.userId !== guestId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const bonusHistory = await db.bonusTransaction.findMany({
      where: { guestId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(bonusHistory);
  } catch (error) {
    console.error("Get bonus history error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
