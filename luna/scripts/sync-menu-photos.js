const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const db = new PrismaClient();

const PHOTOS = {
  "Аляска": "/images/menu/alyaska-sushivostok.jpg",
  "Калифорния классическая": "/images/menu/cc-roll-02.png",
  "Калифорния с креветкой": "/images/menu/cc-roll-03.png",
  "Калифорния с лососем": "/images/menu/cc-roll-04.png",
  "Калифорния чикен": "/images/menu/cc-roll-05.png",
  "Филадельфия классическая": "/images/menu/cc-roll-06.png",
  "Унаги филадельфия": "/images/menu/cc-roll-07.png",
  "Унаги креметте": "/images/menu/cc-roll-08.png",
  "Капа маки": "/images/menu/cc-roll-09.png",
  "Кета маки": "/images/menu/cc-roll-10.png",
  "Томато маки": "/images/menu/cc-roll-11.png",
  "Унаги маки": "/images/menu/cc-roll-12.png",
  "Атлантика": "/images/menu/atlantika.webp",
  "Восход": "/images/menu/cc-roll-13.png",
  "Гейша": "/images/menu/cc-roll-14.png",
  "Имбирный": "/images/menu/cc-roll-15.png",
  "Империя": "/images/menu/imperiya.webp",
  "Инари": "/images/menu/inari.webp",
  "Инь-янь": "/images/menu/cc-roll-16.png",
  "Камелия": "/images/menu/cc-roll-17.png",
  "Кармен": "/images/menu/cc-roll-18.png",
  "Королевский": "/images/menu/cc-roll-19.png",
  "Лава лайт": "/images/menu/cc-roll-20.png",
  "Лава с семгой": "/images/menu/cc-roll-21.png",
  "Небраска": "/images/menu/cc-roll-22.png",
  "Самурай": "/images/menu/cc-roll-23.png",
  "Сяки кунсе": "/images/menu/cc-roll-24.png",
  "Тигровые": "/images/menu/tigrovye.webp",
  "Шахмат": "/images/menu/shakhmat.webp",
  "Адак шик": "/images/menu/adak-shik.svg",
  "Кико": "/images/menu/kiko.svg",
  "То-токи": "/images/menu/to-toki.svg",
  "Япошка": "/images/menu/yaposhka.svg",
  "Филадельфия запеченная": "/images/menu/philadelphia-baked.webp",
  "Скала": "/images/menu/skala.webp",
  "Ойси": "/images/menu/oysi.webp",
  "Яки с крабом": "/images/menu/yaki-crab.webp",
  "Яки с лососем": "/images/menu/yaki-salmon.webp",
  "Яки с мидиями": "/images/menu/yaki-mussels.webp",
  "Филадельфия горячая": "/images/menu/philadelphia-hot.webp",
  "Теплый ролл с креветкой": "/images/menu/warm-shrimp.webp",
  "Суши пицца": "/images/menu/sushi-pizza.webp",
  "Сэндвич ролл": "/images/menu/sandwich-roll.webp",
};

async function main() {
  const root = path.join(process.cwd(), "public");
  const items = await db.item.findMany({ include: { category: true }, orderBy: { id: "asc" } });
  const report = [];
  for (const item of items) {
    const next = PHOTOS[item.name];
    const exists = next ? fs.existsSync(path.join(root, next.replace(/^\//, ""))) : false;
    if (next && exists && item.photo !== next) {
      await db.item.update({ where: { id: item.id }, data: { photo: next } });
    }
    report.push({
      id: item.id,
      name: item.name,
      category: item.category?.name,
      photo: next && exists ? next : item.photo || "",
      kind: (next || item.photo || "").split(".").pop() || "none",
      missing: !next || !exists,
    });
  }
  console.log(JSON.stringify(report, null, 2));
}

main().finally(() => db.$disconnect());
