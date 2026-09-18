import { NextResponse } from "next/server";
import { db } from "@/lib/db";

async function ensureHall() {
  const existing = await db.hall.findFirst({
    include: { tables: true },
    orderBy: { id: "asc" },
  });
  if (existing) return existing;
  return db.hall.create({
    data: {
      name: "Основной зал",
      tables: {
        create: Array.from({ length: 8 }, (_, i) => ({
          number: String(i + 1),
          seats: i < 4 ? 2 : 4,
        })),
      },
    },
    include: { tables: true },
  });
}

function resolveTableId(hall: { tables: { id: number; number: string }[] }, tableId?: unknown, tableNumber?: unknown) {
  if (tableId) {
    const id = Number(tableId);
    return hall.tables.some((t) => t.id === id) ? id : null;
  }
  if (tableNumber) {
    return hall.tables.find((t) => t.number === String(tableNumber))?.id ?? null;
  }
  return null;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  const hall = await ensureHall();

  if (body.entity === "guest") {
    const name = String(body.name ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    if (name.length < 2) return NextResponse.json({ error: "Укажите имя гостя" }, { status: 400 });
    if (!phone) return NextResponse.json({ error: "Укажите телефон" }, { status: 400 });
    const guest = await db.guest.create({ data: { name, phone } });
    return NextResponse.json(guest);
  }

  if (body.entity === "reservation" || body.entity === "waitlist") {
    const guestName = String(body.guestName ?? "").trim();
    if (guestName.length < 2) {
      return NextResponse.json({ error: "Укажите имя гостя" }, { status: 400 });
    }
    const guests = Math.max(1, Number(body.guests ?? 1) || 1);
    const isWaitlist = body.entity === "waitlist";
    const date = body.date ? new Date(body.date) : new Date();
    if (Number.isNaN(date.getTime())) {
      return NextResponse.json({ error: "Некорректная дата" }, { status: 400 });
    }
    const tableId = resolveTableId(hall, body.tableId, body.tableNumber);
    const reservation = await db.reservation.create({
      data: {
        guestName,
        phone: String(body.phone ?? "").trim(),
        guests,
        date,
        status: isWaitlist ? "Очередь" : String(body.status ?? "Новая"),
        note: String(body.note ?? ""),
        hallId: Number(body.hallId ?? hall.id),
        tableId,
      },
      include: { table: true, hall: true },
    });
    return NextResponse.json(reservation);
  }

  return NextResponse.json({ error: "Неизвестная сущность" }, { status: 400 });
}

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || !body.id) {
    return NextResponse.json({ error: "Нужен id" }, { status: 400 });
  }

  const hall = await ensureHall();
  const id = Number(body.id);

  if (body.action === "seat") {
    const current = await db.reservation.findUnique({ where: { id }, include: { table: true } });
    if (!current) return NextResponse.json({ error: "Бронь не найдена" }, { status: 404 });
    const tableId = resolveTableId(hall, body.tableId, body.tableNumber) ?? current.tableId;
    if (!tableId) {
      return NextResponse.json({ error: "Выберите свободный стол" }, { status: 400 });
    }
    const table = hall.tables.find((t) => t.id === tableId);
    const result = await db.reservation.update({
      where: { id },
      data: { status: "Посажен", tableId },
      include: { table: true, hall: true },
    });
    return NextResponse.json({ ...result, seatedTable: table?.number ?? result.table?.number });
  }

  const result = await db.reservation.update({
    where: { id },
    data: {
      status: body.status ? String(body.status) : undefined,
      guestName: body.guestName ? String(body.guestName) : undefined,
      phone: body.phone !== undefined ? String(body.phone) : undefined,
      guests: body.guests ? Number(body.guests) : undefined,
      date: body.date ? new Date(body.date) : undefined,
      note: body.note !== undefined ? String(body.note) : undefined,
      tableId: body.tableId === null ? null : body.tableNumber || body.tableId
        ? resolveTableId(hall, body.tableId, body.tableNumber)
        : undefined,
    },
    include: { table: true, hall: true },
  });
  return NextResponse.json(result);
}

export async function DELETE(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "Нужен id" }, { status: 400 });
  await db.reservation.delete({ where: { id: Number(body.id) } });
  return NextResponse.json({ ok: true });
}
