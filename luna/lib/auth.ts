import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { db } from "@/lib/db";
import type { User } from "@prisma/client";

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET ?? "luna-access-secret-change-in-production";
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET ?? "luna-refresh-secret-change-in-production";
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

interface TokenPayload {
  userId: number;
  role: string;
}

interface RefreshTokenPayload {
  userId: number;
}

export function generateTokens(user: User | { userId: number; role: string }) {
  const userId = 'id' in user ? user.id : user.userId;
  const role = 'role' in user ? user.role : 'guest';

  const accessToken = jwt.sign(
    { userId, role } as TokenPayload,
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { userId } as RefreshTokenPayload,
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET) as RefreshTokenPayload;
  } catch {
    return null;
  }
}

export async function cookieSecure() {
  try {
    const proto = (await headers()).get("x-forwarded-proto")?.split(",")[0]?.trim();
    if (proto) return proto === "https";
  } catch { /* outside a request */ }
  return false;
}

export async function setAuthCookies(user: User) {
  const { accessToken, refreshToken } = generateTokens(user);
  const jar = await cookies();
  const secure = await cookieSecure();

  jar.set("luna_access_token", accessToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60 // 15 minutes
  });

  jar.set("luna_refresh_token", refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 // 7 days
  });
}

export async function clearAuthCookies() {
  const jar = await cookies();
  jar.delete("luna_access_token");
  jar.delete("luna_refresh_token");
}

export async function currentUser(): Promise<User | null> {
  const jar = await cookies();
  let accessToken = jar.get("luna_access_token")?.value;

  // Проверяем старую сессионную куку для обратной совместимости
  if (!accessToken) {
    const sessionToken = jar.get("luna_session")?.value;
    if (sessionToken) {
      const payload = verifyAccessToken(sessionToken);
      if (payload) {
        return db.user.findFirst({
          where: { id: payload.userId, active: true }
        });
      }
    }
  }

  if (!accessToken) {
    // Попытка обновить токен
    const refreshToken = jar.get("luna_refresh_token")?.value;
    if (!refreshToken) return null;

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) return null;

    const user = await db.user.findFirst({
      where: { id: payload.userId, active: true }
    });

    if (!user) return null;

    // Обновляем токены
    await setAuthCookies(user);
    return user;
  }

  const payload = verifyAccessToken(accessToken);
  if (!payload) return null;

  return db.user.findFirst({
    where: { id: payload.userId, active: true }
  });
}

export async function authenticate(login: string, password: string): Promise<User | null> {
  const user = await db.user.findUnique({ where: { login } });
  if (!user || !user.active) return null;

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) return null;

  return user;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function createSession(userId: number) {
  const token = jwt.sign({ userId }, ACCESS_TOKEN_SECRET, { expiresIn: "7d" });
  return {
    name: "luna_session",
    value: token,
    options: {
      httpOnly: true,
      secure: false,
      sameSite: "lax" as const,
      path: "/",
      maxAge: 7 * 24 * 60 * 60 // 7 days
    }
  };
}

export const roleSections: Record<string, string[]> = {
  Владелец: ["dashboard", "menu", "recipes", "stock", "suppliers", "orders", "delivery", "guests", "clients", "site", "loyalty", "hall", "staff", "shifts", "reports", "finance", "settings", "audit"],
  Управляющий: ["dashboard", "menu", "recipes", "stock", "suppliers", "orders", "delivery", "guests", "clients", "site", "loyalty", "hall", "staff", "shifts", "reports", "finance", "settings", "audit"],
  Кассир: ["dashboard", "orders", "guests", "hall", "shifts"],
  Повар: ["dashboard", "recipes"],
  Кладовщик: ["dashboard", "stock", "suppliers"],
  Маркетолог: ["dashboard", "guests", "clients", "site", "loyalty", "reports"],
};

export function canAccess(role: string, section: string) {
  return roleSections[role]?.includes(section) ?? false;
}
