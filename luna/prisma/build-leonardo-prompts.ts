import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const MASTER = `Create one photorealistic menu photo for sushi cafe LUNA.

Series style (must match existing LUNA roll photos):
- Dark cinematic lunar landscape background: black/charcoal rocky moon surface, subtle crater texture, deep night sky with soft stars, a gentle moon glow on the horizon (not oversized, not cartoon).
- Food sits on the dark rock / matte black ceramic — high contrast, appetizing.
- Soft directional side light, natural ingredient colors, camera 35–45 degrees.
- Subject fills 75–80% of the frame, fully inside the frame, centered with safe margins for a square crop used in a mobile menu card.
- Realistic textures. Same scale and lighting across the whole series.
- No text, logos, watermarks, hands, chopsticks, extra props, collage.
- Do not invent ingredients that are not listed. One dish only.

Output: single image, 4:3 (1280x960), photorealistic, commercial food photography.`;

const NEG =
  "text, logo, watermark, collage, hands, chopsticks, plastic food, cartoon, neon purple glow, white studio backdrop, blurry, cropped food, multiple dishes";

const FILES: Record<string, string> = {
  Аляска: "alyaska.webp",
  "Калифорния классическая": "california-classic.webp",
  "Калифорния с креветкой": "california-shrimp.webp",
  "Калифорния с лососем": "california-salmon.webp",
  "Калифорния чикен": "california-chicken.webp",
  "Филадельфия классическая": "philadelphia-classic.webp",
  "Унаги филадельфия": "unagi-philadelphia.webp",
  "Унаги креметте": "unagi-cremette.webp",
  "Капа маки": "kapa-maki.webp",
  "Кета маки": "keta-maki.webp",
  "Томато маки": "tomato-maki.webp",
  "Унаги маки": "unagi-maki.webp",
  Атлантика: "atlantika.webp",
  Восход: "voshod.webp",
  Гейша: "geisha.webp",
  Имбирный: "imbirnyy.webp",
  Империя: "imperiya.webp",
  Инари: "inari.webp",
  "Инь-янь": "yin-yang.webp",
  Камелия: "kameliya.webp",
  Кармен: "karmen.webp",
  Королевский: "korolevskiy.webp",
  "Лава лайт": "lava-light.webp",
  "Лава с семгой": "lava-salmon.webp",
  Небраска: "nebraska.webp",
  Самурай: "samuray.webp",
  "Сяки кунсе": "syaki-kunse.webp",
  Тигровые: "tigrovye.webp",
  Шахмат: "shakhmat.webp",
  "Адак шик": "adak-shik.webp",
  Кико: "kiko.webp",
  "То-токи": "to-toki.webp",
  Япошка: "yaposhka.webp",
  "Филадельфия запеченная": "philadelphia-baked.webp",
  Скала: "skala.webp",
  Ойси: "oysi.webp",
  "Яки с крабом": "yaki-crab.webp",
  "Яки с лососем": "yaki-salmon.webp",
  "Яки с мидиями": "yaki-mussels.webp",
  "Филадельфия горячая": "philadelphia-hot.webp",
  "Теплый ролл с креветкой": "warm-shrimp.webp",
  "Суши пицца": "sushi-pizza.webp",
  "Сэндвич ролл": "sandwich-roll.webp",
  Ассорти: "pizza-assorti.webp",
  Маргарита: "pizza-margarita.webp",
  Неопалитано: "pizza-neopalitano.webp",
  "Четыре сыра": "pizza-four-cheese.webp",
  "С копчёной курицей": "pizza-smoked-chicken.webp",
  "С ветчиной": "pizza-ham.webp",
  Пепперони: "pizza-pepperoni.webp",
  Жульен: "pizza-julien.webp",
  "Мексика острая": "pizza-mexico.webp",
  Гурман: "pizza-gourmet.webp",
  Охотничья: "pizza-hunter.webp",
  Филадельфия: "pizza-philadelphia.webp",
  Студенческая: "pizza-student.webp",
  Гавайская: "pizza-hawaii.webp",
  Шурпа: "uzbek-shurpa.webp",
  "Узбекский плов": "uzbek-plov.webp",
  Лагман: "uzbek-lagman.webp",
};

function dishLine(cat: string, name: string, desc: string) {
  const d = desc || "ingredients per kitchen recipe — do not invent";
  if (cat.includes("Пицца")) {
    return `Dish: ${name} pizza, whole round pizza. Toppings: ${d}. Same LUNA lunar dark rocky background series.`;
  }
  if (cat.includes("Узбек")) {
    return `Dish: ${name} in a matte black ceramic bowl on dark lunar rock. ${d}. Same LUNA series lighting.`;
  }
  return `Dish: ${name} sushi roll, cut into even pieces on dark lunar rock. Ingredients visible in cross-section: ${d}.`;
}

async function main() {
  const items = await db.item.findMany({
    include: { category: true },
    orderBy: [{ category: { sort: "asc" } }, { id: "asc" }],
  });

  const out: string[] = [];
  out.push("LUNA — промпты Leonardo.ai: позиции меню + баннеры");
  out.push("Дата: 19.09.2026");
  out.push("");
  out.push("================================================================================");
  out.push("РАЗМЕРЫ");
  out.push("================================================================================");
  out.push("");
  out.push("КАРТОЧКА БЛЮДА");
  out.push("  Генерация:  1280 × 960 px  (4:3)");
  out.push("  На сайте:   кроп ~1:1 вверху карточки + показ в модалке");
  out.push("  Формат:     PNG/JPG → WebP, желательно ≤ 220 КБ");
  out.push("  Папка:      luna/public/images/menu/");
  out.push("");
  out.push("БАННЕР АКЦИИ (карусель)");
  out.push("  Генерация:  1600 × 720 px  (~20:9)");
  out.push("  На сайте:   высота ~176–200 px на телефоне, ширина 100%");
  out.push("  Стиль:      светлый кремовый градиент (НЕ тёмный фон еды)");
  out.push("  Поля:       слева пусто под текст UI, справа луна ~120 px");
  out.push("  Текст:      на картинку НЕ рисовать — его рисует сайт");
  out.push("");
  out.push("Negative (еда): " + NEG);
  out.push("");

  let n = 0;
  let lastCat = "";
  for (const it of items) {
    const cat = it.category?.name ?? "?";
    if (cat !== lastCat) {
      lastCat = cat;
      out.push("");
      out.push("================================================================================");
      out.push("КАТЕГОРИЯ: " + cat);
      out.push("================================================================================");
    }
    n++;
    const file = FILES[it.name] || `${it.id}.webp`;
    out.push("");
    out.push(`--- ${n}. ${it.name} ---`);
    out.push("Категория: " + cat);
    out.push("Описание (состав): " + (it.description || "— уточнить у повара, не выдумывать"));
    out.push("Размер: 1280×960 (4:3)");
    out.push("Файл: " + file);
    out.push("Текущее фото: " + (it.photo || "нет"));
    out.push("PROMPT:");
    out.push(MASTER);
    out.push(dishLine(cat, it.name, it.description || ""));
  }

  out.push("");
  out.push("================================================================================");
  out.push("БАННЕРЫ — 4 шт., размер 1600×720");
  out.push("================================================================================");
  out.push("");
  out.push("Общий стиль баннера:");
  out.push("Soft cream / warm beige gradient (#F7F1E8 → #E8DCC8), airy restaurant mood,");
  out.push("subtle cream cratered moon on the RIGHT, empty LEFT for UI text, no letters, no food.");
  out.push("");

  const promos = [
    {
      id: "delivery",
      badge: "АКЦИЯ",
      title: "Бесплатная доставка от 1 000 ₽",
      sub: "Заказывайте онлайн — привезём горячим",
      file: "banner-delivery.webp",
    },
    {
      id: "bonuses",
      badge: "БОНУСЫ",
      title: "Копите бонусы с каждого заказа",
      sub: "Списывайте их при оформлении следующего",
      file: "banner-bonuses.webp",
    },
    {
      id: "booking",
      badge: "СТОЛИК",
      title: "Забронируйте стол заранее",
      sub: "Звоните +7 (929) 298-28-28",
      file: "banner-booking.webp",
    },
    {
      id: "address",
      badge: "МЫ ЗДЕСЬ",
      title: "ул. Таёжная, 11/1",
      sub: "Будни 10:00–23:00 · Выходные 10:00–24:00",
      file: "banner-address.webp",
    },
  ];

  for (const p of promos) {
    out.push("");
    out.push(`--- BANNER: ${p.badge} / ${p.id} ---`);
    out.push("Текст на сайте (НЕ рисовать на картинке):");
    out.push("  Badge: " + p.badge);
    out.push("  Title: " + p.title);
    out.push("  Subtitle: " + p.sub);
    out.push("Размер: 1600×720");
    out.push("Файл: " + p.file);
    out.push("PROMPT:");
    out.push("Wide promotional banner background for mobile cafe app LUNA, 1600x720.");
    out.push("Warm cream-beige soft gradient (#F7F1E8 to #E8DCC8), clean airy restaurant mood.");
    out.push("On the RIGHT: elegant soft 3D cream cratered moon graphic, subtle, not cartoon.");
    out.push("On the LEFT: empty calm space reserved for text overlay.");
    out.push(`Theme hint only (no letters on image): ${p.badge} — ${p.title}.`);
    out.push("No text, no logos, no food, no people, no UI buttons. Soft shadows, premium simple.");
  }

  out.push("");
  out.push(`Конец. Позиций еды: ${n}, баннеров: ${promos.length}`);

  const dest = path.join("C:/Users/BYRANBAI/Desktop", "LUNA-Leonardo-промпты-все.txt");
  fs.writeFileSync(dest, out.join("\n"), "utf8");
  console.log("WROTE", dest, "items", n, "bytes", fs.statSync(dest).size);
}

main().finally(() => db.$disconnect());
