import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { sendSms } from "@/lib/sms";

function hashCode(phone: string, code: string) {
  const secret = process.env.JWT_ACCESS_SECRET ?? "luna-sms-secret";
  return crypto.createHmac("sha256", secret).update(`${phone}:${code}`).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phone = normalizePhone(String(body.phone ?? ""));
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
      return NextResponse.json({ error: "Этот номер уже зарегистрирован. Войдите по SMS или паролю." }, { status: 400 });
    }
    if (purpose === "login" && !existing) {
      return NextResponse.json({ error: "Номер не найден. Сначала зарегистрируйтесь." }, { status: 400 });
    }

    const recent = await db.smsCode.findFirst({
      where: { phone, purpose, createdAt: { gt: new Date(Date.now() - 60_000) } },
      orderBy: { createdAt: "desc" },
    });
    if (recent) {
      return NextResponse.json({ error: "Код уже отправлен. Подождите минуту." }, { status: 429 });
    }

    const code = String(crypto.randomInt(1000, 10000));
    await db.smsCode.deleteMany({ where: { phone, purpose } });
    await db.smsCode.create({
      data: {
        phone,
        purpose,
        codeHash: hashCode(phone, code),
        expiresAt: new Date(Date.now() + 5 * 60_000),
      },
    });

    const sent = await sendSms(phone, `Луна: код ${code}. Никому не сообщайте.`);
    if (!sent.ok) {
      return NextResponse.json({ error: sent.error }, { status: 503 });
    }

    const payload: { ok: true; message: string; debugCode?: string } = {
      ok: true,
      message: "Код отправлен по SMS",
    };
    if (sent.dev) payload.debugCode = code;
    return NextResponse.json(payload);
  } catch (error) {
    console.error("SMS send error:", error);
    return NextResponse.json({ error: "Не удалось отправить код" }, { status: 500 });
  }
}
