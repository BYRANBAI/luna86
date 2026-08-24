import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { generateTokens } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawPhone = String(body.phone ?? "").trim();
    const digits = rawPhone.replace(/\D/g, "");
    let phone = rawPhone;
    if (digits.length === 11 && digits.startsWith("8")) phone = "+7" + digits.slice(1);
    else if (digits.length === 11 && digits.startsWith("7")) phone = "+" + digits;
    else if (digits.length === 10) phone = "+7" + digits;
    const password = String(body.password ?? "");

    if (!phone || !password) {
      return NextResponse.json({ error: "Введите телефон и пароль" }, { status: 400 });
    }

    const guest = await db.guest.findFirst({ where: { phone } });

    if (!guest || !guest.passwordHash) {
      return NextResponse.json({ error: "Неверный телефон или пароль" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, guest.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Неверный телефон или пароль" }, { status: 401 });
    }

    const { accessToken, refreshToken } = generateTokens({ userId: guest.id, role: "guest" });

    await db.guest.update({
      where: { id: guest.id },
      data: { refreshToken, lastVisit: new Date() },
    });

    return NextResponse.json({
      success: true,
      token: accessToken,
      guest: {
        id: guest.id,
        name: guest.name,
        phone: guest.phone,
        email: guest.email,
        bonuses: guest.bonuses,
      },
    });
  } catch (error) {
    console.error("Guest login error:", error);
    return NextResponse.json({ error: "Ошибка входа" }, { status: 500 });
  }
}
