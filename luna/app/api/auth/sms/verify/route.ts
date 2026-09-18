import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { generateTokens } from "@/lib/auth";

function hashCode(phone: string, code: string) {
  const secret = process.env.JWT_ACCESS_SECRET ?? "luna-sms-secret";
  return crypto.createHmac("sha256", secret).update(`${phone}:${code}`).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phone = normalizePhone(String(body.phone ?? ""));
    const code = String(body.code ?? "").replace(/\D/g, "");
    const purpose = body.purpose === "login" ? "login" : "register";
    const name = String(body.name ?? "").trim();

    if (!phone || code.length !== 4) {
      return NextResponse.json({ error: "Введите 4-значный код из SMS" }, { status: 400 });
    }

    const row = await db.smsCode.findFirst({
      where: { phone, purpose },
      orderBy: { createdAt: "desc" },
    });
    if (!row || row.expiresAt < new Date()) {
      return NextResponse.json({ error: "Код устарел. Запросите новый." }, { status: 400 });
    }
    if (row.attempts >= 5) {
      return NextResponse.json({ error: "Слишком много попыток. Запросите новый код." }, { status: 400 });
    }

    await db.smsCode.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } });
    if (row.codeHash !== hashCode(phone, code)) {
      return NextResponse.json({ error: "Неверный код" }, { status: 400 });
    }

    await db.smsCode.deleteMany({ where: { phone, purpose } });

    let guest = await db.guest.findUnique({ where: { phone } });
    if (purpose === "register") {
      if (!name || name.length < 2) {
        return NextResponse.json({ error: "Укажите имя" }, { status: 400 });
      }
      if (guest) {
        guest = await db.guest.update({
          where: { id: guest.id },
          data: { name, registered: true, phoneVerified: true, lastVisit: new Date() },
        });
      } else {
        guest = await db.guest.create({
          data: {
            name,
            phone,
            registered: true,
            phoneVerified: true,
            bonuses: 0,
            segment: "Новые",
          },
        });
      }
    } else if (!guest) {
      return NextResponse.json({ error: "Номер не найден" }, { status: 400 });
    } else {
      guest = await db.guest.update({
        where: { id: guest.id },
        data: { phoneVerified: true, lastVisit: new Date() },
      });
    }

    const { accessToken, refreshToken } = generateTokens({ userId: guest.id, role: "guest" });
    await db.guest.update({ where: { id: guest.id }, data: { refreshToken } });

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
    console.error("SMS verify error:", error);
    return NextResponse.json({ error: "Ошибка проверки кода" }, { status: 500 });
  }
}
