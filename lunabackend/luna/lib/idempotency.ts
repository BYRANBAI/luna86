import { db } from "./db";
import { NextResponse } from "next/server";

const IDEMPOTENCY_KEY_EXPIRY = 24 * 60 * 60 * 1000; // 24 часа

export async function handleIdempotentRequest(
  key: string,
  handler: () => Promise<{ data: unknown; statusCode?: number }>
): Promise<NextResponse> {
  // Проверяем, существует ли уже результат для этого ключа
  const existing = await db.idempotencyKey.findUnique({
    where: { id: key }
  });

  if (existing) {
    // Возвращаем кэшированный результат
    return new NextResponse(existing.response, {
      status: existing.statusCode,
      headers: {
        "Content-Type": "application/json",
        "X-Idempotency-Replay": "true"
      }
    });
  }

  // Выполняем запрос
  try {
    const result = await handler();
    const statusCode = result.statusCode ?? 200;
    const response = JSON.stringify(result.data);

    // Сохраняем результат
    await db.idempotencyKey.create({
      data: {
        id: key,
        response,
        statusCode,
        expiresAt: new Date(Date.now() + IDEMPOTENCY_KEY_EXPIRY)
      }
    });

    return new NextResponse(response, {
      status: statusCode,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    // В случае ошибки не сохраняем результат
    throw error;
  }
}

export function extractIdempotencyKey(request: Request): string | null {
  return request.headers.get("Idempotency-Key");
}

export async function cleanupExpiredKeys() {
  await db.idempotencyKey.deleteMany({
    where: {
      expiresAt: { lt: new Date() }
    }
  });
}

// Генерация ключа на клиенте
export function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}
