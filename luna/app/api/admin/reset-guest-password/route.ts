import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { canAccess, currentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(user.role, "guests")) return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });

  const { guestId, password } = await req.json();
  if (!guestId || !password || password.length < 6)
    return NextResponse.json({ error: "Неверные данные" }, { status: 400 });

  const hash = await bcrypt.hash(password, 10);
  await db.guest.update({ where: { id: Number(guestId) }, data: { passwordHash: hash } });
  await db.auditLog.create({
    data: {
      userId: user.id,
      section: "guests",
      action: "reset-password",
      entity: "guest",
      entityId: Number(guestId),
      details: "Пароль клиента изменён в CRM",
    },
  });

  return NextResponse.json({ success: true });
}
