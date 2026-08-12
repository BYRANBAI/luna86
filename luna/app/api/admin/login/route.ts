import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, generateTokens } from "@/lib/auth";
import { z } from "zod";

const LoginSchema = z.object({
  login: z.string().min(1, "Введите логин"),
  password: z.string().min(1, "Введите пароль"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = LoginSchema.parse(body);

    // Находим пользователя по логину
    const user = await db.user.findFirst({
      where: { login: validated.login, active: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Неверный логин или пароль" },
        { status: 401 }
      );
    }

    // Проверяем пароль
    const isValid = await verifyPassword(validated.password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { error: "Неверный логин или пароль" },
        { status: 401 }
      );
    }

    // Генерируем JWT токены
    const { accessToken, refreshToken } = generateTokens({
      userId: user.id,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        login: user.login,
        name: user.name,
        role: user.role,
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

    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "Ошибка при входе" },
      { status: 500 }
    );
  }
}
