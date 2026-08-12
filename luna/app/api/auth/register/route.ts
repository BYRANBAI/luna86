import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, generateTokens } from "@/lib/auth";
import { z } from "zod";

const RegisterSchema = z.object({
  name: z.string().min(2, "Имя должно содержать минимум 2 символа"),
  phone: z.string().min(10, "Некорректный номер телефона"),
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
  email: z.string().email("Некорректный email").optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = RegisterSchema.parse(body);

    // Проверяем, существует ли уже гость с таким телефоном
    const existing = await db.guest.findFirst({
      where: { phone: validated.phone },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Пользователь с таким телефоном уже зарегистрирован" },
        { status: 400 }
      );
    }

    // Хешируем пароль
    const passwordHash = await hashPassword(validated.password);

    // Создаем нового гостя
    const guest = await db.guest.create({
      data: {
        name: validated.name,
        phone: validated.phone,
        email: validated.email || null,
        passwordHash,
        bonuses: 0,
        segment: "Новые",
        registered: true,
      },
    });

    // Генерируем JWT токены
    const { accessToken, refreshToken } = generateTokens({
      userId: guest.id,
      role: "guest",
    });

    // Сохраняем refresh token в БД
    await db.guest.update({
      where: { id: guest.id },
      data: { refreshToken },
    });

    const response = NextResponse.json({
      success: true,
      guest: {
        id: guest.id,
        name: guest.name,
        phone: guest.phone,
        email: guest.email,
        bonuses: guest.bonuses,
      },
      token: accessToken,
    });

    // Устанавливаем refresh token в httpOnly cookie
    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 дней
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Ошибка при регистрации" },
      { status: 500 }
    );
  }
}
