import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

const secret = process.env.SESSION_SECRET ?? "luna-demo-session-secret";
const cookieName = "luna_session";

function sign(value: string) {
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

export function createSession(userId: number) {
  const value = `${userId}.${sign(String(userId))}`;
  return { name: cookieName, value, options: { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 12 } };
}

export async function currentUser() {
  const jar = await cookies();
  const value = jar.get(cookieName)?.value;
  if (!value) return null;
  const [id, signature] = value.split(".");
  if (!id || signature !== sign(id)) return null;
  return db.user.findFirst({ where: { id: Number(id), active: true } });
}

export async function authenticate(login: string, password: string) {
  const user = await db.user.findUnique({ where: { login } });
  if (!user || !user.active || !(await bcrypt.compare(password, user.passwordHash))) return null;
  return user;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export const roleSections: Record<string, string[]> = {
  Владелец: ["dashboard", "menu", "recipes", "stock", "suppliers", "orders", "delivery", "guests", "loyalty", "hall", "staff", "shifts", "reports", "finance", "settings", "audit"],
  Управляющий: ["dashboard", "menu", "recipes", "stock", "suppliers", "orders", "delivery", "guests", "loyalty", "hall", "staff", "shifts", "reports", "finance", "settings", "audit"],
  Кассир: ["dashboard", "orders", "guests", "hall", "shifts"],
  Повар: ["dashboard", "recipes"],
  Кладовщик: ["dashboard", "stock", "suppliers"],
  Маркетолог: ["dashboard", "guests", "loyalty", "reports"],
};

export function canAccess(role: string, section: string) {
  return roleSections[role]?.includes(section) ?? false;
}
