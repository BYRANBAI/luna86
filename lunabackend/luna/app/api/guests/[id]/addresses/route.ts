import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAccessToken } from "@/lib/auth";
import { z } from "zod";

const AddressSchema = z.object({
  label: z.string().min(1, "Укажите название адреса"),
  street: z.string().min(1, "Укажите улицу"),
  building: z.string().min(1, "Укажите номер дома"),
  apartment: z.string().optional(),
  entrance: z.string().optional(),
  floor: z.string().optional(),
  intercom: z.string().optional(),
  comment: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  isDefault: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "guest") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const guestId = parseInt(id);
    if (payload.userId !== guestId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const addresses = await db.guestAddress.findMany({
      where: { guestId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(addresses);
  } catch (error) {
    console.error("Get addresses error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "guest") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const guestId = parseInt(id);
    if (payload.userId !== guestId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validated = AddressSchema.parse(body);

    // Если это первый адрес или установлен isDefault, делаем его дефолтным
    const existingCount = await db.guestAddress.count({ where: { guestId } });
    const shouldBeDefault = existingCount === 0 || validated.isDefault === true;

    // Если делаем этот адрес дефолтным, убираем флаг у остальных
    if (shouldBeDefault) {
      await db.guestAddress.updateMany({
        where: { guestId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await db.guestAddress.create({
      data: {
        guestId,
        label: validated.label,
        street: validated.street,
        building: validated.building,
        apartment: validated.apartment || "",
        entrance: validated.entrance || "",
        floor: validated.floor || "",
        intercom: validated.intercom || "",
        comment: validated.comment || "",
        lat: validated.lat,
        lng: validated.lng,
        isDefault: shouldBeDefault,
      },
    });

    return NextResponse.json(address);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Create address error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
