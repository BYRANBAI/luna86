import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { generateTokens } from "@/lib/auth";
import { checkSmsCode } from "@/lib/sms";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phone = normalizePhone(String(body.phone ?? ""));
    const code = String(body.code ?? "").replace(/\D/g, "");
    const purpose = body.purpose === "login" ? "login" : "register";
    const name = String(body.name ?? "").trim();

    if (!phone || code.length < 4 || code.length > 8) {
      return NextResponse.json({ error: "Введите код из звонка или SMS" }, { status: 400 });
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
    const requestId = row.codeHash.startsWith("sms|") || row.codeHash.startsWith("flash_call|")
      ? row.codeHash.slice(row.codeHash.indexOf("|") + 1)
      : row.codeHash;
    const checked = await checkSmsCode(requestId, code);
    if (!checked.ok) {
      return NextResponse.json({ error: checked.error }, { status: 400 });
    }

    await db.smsCode.deleteMany({ where: { phone, purpose } });

    let guest = await db.guest.findUnique({ where: { phone } });
    if (purpose === "register") {
      if (!name || name.length < 2) {
        return NextResponse.json({ error: "Укажите имя" }, { status: 400 });
      }
      const tags = guest?.tags?.includes("сайт") ? guest.tags : [guest?.tags, "сайт"].filter(Boolean).join(", ");
      if (guest) {
        guest = await db.guest.update({
          where: { id: guest.id },
          data: { name, registered: true, phoneVerified: true, lastVisit: new Date(), tags, segment: guest.segment || "Новые" },
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
            tags: "сайт",
          },
        });
      }
    } else if (!guest) {
      return NextResponse.json({ error: "Номер не найден" }, { status: 400 });
    } else {
      guest = await db.guest.update({
        where: { id: guest.id },
        data: { registered: true, phoneVerified: true, lastVisit: new Date() },
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
