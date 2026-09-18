import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Регистрация только по SMS-коду" },
    { status: 400 }
  );
}
