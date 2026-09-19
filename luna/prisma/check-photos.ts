import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const db = new PrismaClient();

async function main() {
  const root = path.join(process.cwd(), "public");
  const items = await db.item.findMany({
    include: { category: true },
    orderBy: [{ categoryId: "asc" }, { id: "asc" }],
  });

  let ok = 0;
  let missing = 0;
  let svg = 0;
  const weak: string[] = [];

  for (const i of items) {
    const photo = i.photo || "";
    const file = photo ? path.join(root, photo.replace(/^\//, "")) : "";
    const exists = file && fs.existsSync(file);
    const kind = !photo ? "нет" : !exists ? "файл пропал" : photo.endsWith(".svg") ? "svg" : "ok";
    if (kind === "ok") ok++;
    else if (kind === "svg") {
      svg++;
      weak.push(`${i.category?.name}: ${i.name} -> ${photo}`);
    } else {
      missing++;
      weak.push(`${i.category?.name}: ${i.name} -> ${photo || "(пусто)"}`);
    }
  }

  console.log(`Всего: ${items.length}`);
  console.log(`С нормальным фото: ${ok}`);
  console.log(`SVG-заглушки: ${svg}`);
  console.log(`Без файла: ${missing}`);
  console.log("--- слабые ---");
  for (const w of weak) console.log(w);
}

main().finally(() => db.$disconnect());
