import { NextResponse } from "next/server";
import { authenticate, createSession } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json();
  const user = await authenticate(String(body.login ?? "").trim(), String(body.password ?? ""));
  if (!user) return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });
  const response = NextResponse.json({ user: { id: user.id, name: user.name, role: user.role } });
  const session = createSession(user.id);
  response.cookies.set(session.name, session.value, session.options);
  return response;
}
