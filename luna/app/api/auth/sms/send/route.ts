import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { startVerification, type VerifyMethod } from "@/lib/sms";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phone = normalizePhone(String(body.phone ?? ""));
    const method: VerifyMethod = body.method === "sms" ? "sms" : "flash_call";
    const purpose = body.purpose === "login" ? "login" : "register";
    const name = String(body.name ?? "").trim();

    if (!phone) {
      return NextResponse.json({ error: "Введите номер в формате +7 999 000-00-00" }, { status: 400 });
    }
    if (purpose === "register" && name.length < 2) {
      return NextResponse.json({ error: "Укажите имя" }, { status: 400 });
    }

    const existing = await db.guest.findUnique({ where: { phone } });
    if (purpose === "register" && existing?.registered) {
      return NextResponse.json({ error: "Этот номер уже зарегистрирован. Войдите по звонку или паролю." }, { status: 400 });
    }
    if (purpose === "login" && !existing?.registered) {
      return NextResponse.json({ error: "Номер не найден. Сначала зарегистрируйтесь." }, { status: 400 });
    }

    if (purpose === "register") {
      const siteTag = existing?.tags?.includes("сайт") ? existing.tags : [existing?.tags, "сайт"].filter(Boolean).join(", ");
      if (existing) {
        await db.guest.update({
          where: { id: existing.id },
          data: { name, tags: siteTag, lastVisit: new Date() },
        });
      } else {
        await db.guest.create({
          data: {
            name,
            phone,
            registered: false,
            phoneVerified: false,
            bonuses: 0,
            segment: "Новые",
            tags: "сайт",
          },
        });
      }
    }

    const recent = await db.smsCode.findFirst({
      where: { phone, purpose, createdAt: { gt: new Date(Date.now() - 60_000) } },
      orderBy: { createdAt: "desc" },
    });
    const recentMethod = recent?.codeHash.startsWith("sms|")
      ? "sms"
      : recent?.codeHash.startsWith("flash_call|")
        ? "flash_call"
        : null;
    if (recent && (recentMethod === method || (method === "flash_call" && recentMethod == null))) {
      return NextResponse.json({ error: "Код уже запрошен. Подождите минуту." }, { status: 429 });
    }

    const sent = await startVerification(phone, method);
    if (!sent.ok) {
      return NextResponse.json({ error: sent.error }, { status: 503 });
    }

    await db.smsCode.deleteMany({ where: { phone, purpose } });
    await db.smsCode.create({
      data: {
        phone,
        purpose,
        codeHash: `${sent.method}|${sent.requestId}`,
        expiresAt: new Date(Date.now() + 5 * 60_000),
      },
    });

    return NextResponse.json({
      ok: true,
      method: sent.method,
      codeLength: sent.codeLength,
      message: sent.method === "flash_call"
        ? "Сейчас поступит звонок-сброс. Код — последние цифры входящего номера."
        : "Код отправлен по SMS",
    });
  } catch (error) {
    console.error("SMS send error:", error);
    return NextResponse.json({ error: "Не удалось отправить код" }, { status: 500 });
  }
}
