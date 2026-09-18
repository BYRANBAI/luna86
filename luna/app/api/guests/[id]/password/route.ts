import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, verifyAccessToken } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = verifyAccessToken(authHeader.slice(7));
    const { id } = await params;
    const guestId = parseInt(id);
    if (!payload || payload.role !== "guest" || payload.userId !== guestId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const password = String(body.password ?? "");
    const confirm = String(body.confirm ?? password);
    if (password.length < 6) {
      return NextResponse.json({ error: "Пароль не короче 6 символов" }, { status: 400 });
    }
    if (password !== confirm) {
      return NextResponse.json({ error: "Пароли не совпадают" }, { status: 400 });
    }

    await db.guest.update({
      where: { id: guestId },
      data: { passwordHash: await hashPassword(password) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Set guest password error:", error);
    return NextResponse.json({ error: "Не удалось сохранить пароль" }, { status: 500 });
  }
}
