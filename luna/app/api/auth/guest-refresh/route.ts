import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateGuestTokens, verifyRefreshToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const refreshToken = String(body.refreshToken ?? "");
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const guest = await db.guest.findUnique({ where: { id: payload.userId } });
    if (!guest || guest.refreshToken !== refreshToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tokens = generateGuestTokens(guest.id);
    await db.guest.update({
      where: { id: guest.id },
      data: { refreshToken: tokens.refreshToken, lastVisit: new Date() },
    });

    return NextResponse.json({
      success: true,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      guest: {
        id: guest.id,
        name: guest.name,
        phone: guest.phone,
        email: guest.email,
        bonuses: guest.bonuses,
      },
    });
  } catch (error) {
    console.error("Guest refresh error:", error);
    return NextResponse.json({ error: "Ошибка сессии" }, { status: 500 });
  }
}
