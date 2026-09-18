// Прописывает фото новым позициям (пицца и узбекская кухня).
// Файлы должны лежать в luna/public/images/menu/.
// Запуск: npx tsx prisma/set-new-photos.ts
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const db = new PrismaClient();

const PHOTOS: Record<string, Record<string, string>> = {
  "Пицца": {
    "Ассорти": "/images/menu/pizza-assorti.webp",
    "Маргарита": "/images/menu/pizza-margarita.webp",
    "Неопалитано": "/images/menu/pizza-neopalitano.webp",
    "Четыре сыра": "/images/menu/pizza-four-cheese.webp",
    "С копчёной курицей": "/images/menu/pizza-smoked-chicken.webp",
    "С ветчиной": "/images/menu/pizza-ham.webp",
    "Пепперони": "/images/menu/pizza-pepperoni.webp",
    "Жульен": "/images/menu/pizza-julien.webp",
    "Мексика острая": "/images/menu/pizza-mexico.webp",
    "Гурман": "/images/menu/pizza-gourmet.webp",
    "Охотничья": "/images/menu/pizza-hunter.webp",
    "Филадельфия": "/images/menu/pizza-philadelphia.webp",
    "Студенческая": "/images/menu/pizza-student.webp",
    "Гавайская": "/images/menu/pizza-hawaii.webp",
  },
  "Узбекская кухня": {
    "Шурпа": "/images/menu/uzbek-shurpa.webp",
    "Узбекский плов": "/images/menu/uzbek-plov.webp",
    "Лагман": "/images/menu/uzbek-lagman.webp",
  },
};

async function main() {
  const root = path.join(process.cwd(), "public");
  let updated = 0;
  const missing: string[] = [];

  for (const [catName, items] of Object.entries(PHOTOS)) {
    const cat = await db.category.findFirst({ where: { name: catName } });
    if (!cat) {
      missing.push(`категория ${catName} не найдена`);
      continue;
    }
    for (const [itemName, photo] of Object.entries(items)) {
      if (!fs.existsSync(path.join(root, photo.replace(/^\//, "")))) {
        missing.push(`файл ${photo} отсутствует`);
        continue;
      }
      const item = await db.item.findFirst({ where: { name: itemName, categoryId: cat.id } });
      if (!item) {
        missing.push(`позиция ${catName} / ${itemName} не найдена`);
        continue;
      }
      if (item.photo !== photo) {
        await db.item.update({ where: { id: item.id }, data: { photo } });
        updated++;
      }
    }
  }

  console.log(`Обновлено фото: ${updated}`);
  if (missing.length) console.log("Пропущено:\n  " + missing.join("\n  "));
}

main().finally(() => db.$disconnect());
