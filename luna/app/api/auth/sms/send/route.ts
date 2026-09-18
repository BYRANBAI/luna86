import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { startSmsVerification } from "@/lib/sms";

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

    const sent = await startSmsVerification(phone);
    if (!sent.ok) {
      return NextResponse.json({ error: sent.error }, { status: 503 });
    }

    await db.smsCode.deleteMany({ where: { phone, purpose } });
    await db.smsCode.create({
      data: {
        phone,
        purpose,
        codeHash: sent.requestId,
        expiresAt: new Date(Date.now() + 5 * 60_000),
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Код отправлен по SMS",
      codeLength: sent.codeLength,
    });
  } catch (error) {
    console.error("SMS send error:", error);
    return NextResponse.json({ error: "Не удалось отправить код" }, { status: 500 });
  }
}
