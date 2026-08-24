import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { currentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { guestId, password } = await req.json();
  if (!guestId || !password || password.length < 6)
    return NextResponse.json({ error: "Неверные данные" }, { status: 400 });

  const hash = await bcrypt.hash(password, 10);
  await db.guest.update({ where: { id: Number(guestId) }, data: { passwordHash: hash } });

  return NextResponse.json({ success: true });
}
