// Открывает узбекские блюда гостям. Цена 0 отображается как «Цена уточняется»,
// кнопка добавления в корзину при нулевой цене не показывается.
// Запуск: npx tsx prisma/show-uzbek.ts
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const cat = await db.category.findFirst({ where: { name: "Узбекская кухня" } });
  if (!cat) throw new Error("Категория «Узбекская кухня» не найдена");

  const res = await db.item.updateMany({
    where: { categoryId: cat.id },
    data: { site: true, app: true, kiosk: true, bot: true },
  });

  const items = await db.item.findMany({
    where: { categoryId: cat.id },
    select: { name: true, price: true, site: true, photo: true },
  });
  console.log(`Открыто позиций: ${res.count}`);
  for (const i of items) console.log(`  ${i.name}: цена ${i.price}, site ${i.site}, фото ${i.photo}`);
}

main().finally(() => db.$disconnect());
