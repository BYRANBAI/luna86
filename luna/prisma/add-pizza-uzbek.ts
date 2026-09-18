// Добавляет категории «Пицца» и «Узбекская кухня».
// Пицца — одна позиция с обязательным выбором порции (300 г / 600 г).
// Узбекские блюда заводятся с ценой 0 и скрыты от гостей до простановки цены в CRM.
// Запуск: npx tsx prisma/add-pizza-uzbek.ts
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

type Pizza = { name: string; desc: string; small: number; large: number };

// Цены с бумажного меню: 600 г / 300 г
const PIZZAS: Pizza[] = [
  { name: "Ассорти", desc: "Говяжья колбаса, сардельки, куриная грудка, шампиньоны, болгарский перец", small: 450, large: 760 },
  { name: "Маргарита", desc: "Перец болгарский, сыр, свежий помидор, соус", small: 450, large: 760 },
  { name: "Неопалитано", desc: "Сёмга, кальмар, креветка тигровая, помидор, сыр, зелень", small: 490, large: 790 },
  { name: "Четыре сыра", desc: "Сыры гауда, брынза, голландский, моцарелла, соус", small: 450, large: 760 },
  { name: "С копчёной курицей", desc: "Курица копчёная, шампиньоны, соус, перец болгарский, свежий помидор, сыр, зелень", small: 450, large: 760 },
  { name: "С ветчиной", desc: "Ветчина, перец болгарский, соус, сыр, свежий помидор, зелень", small: 450, large: 760 },
  { name: "Пепперони", desc: "Колбаса пепперони, шампиньоны свежие, сыр, соус", small: 450, large: 760 },
  { name: "Жульен", desc: "Филе куриное, шампиньоны свежие, сливки, сыр, соус", small: 450, large: 760 },
  { name: "Мексика острая", desc: "Ветчина, перец болгарский, помидор свежий, говяжья колбаса, сыр", small: 450, large: 760 },
  { name: "Гурман", desc: "Язык говяжий, помидоры, огурцы маринованные, шампиньоны свежие, сыр, соус", small: 450, large: 760 },
  { name: "Охотничья", desc: "Колбаски охотничьи, помидоры, лук-порей, сыр, соус, зелень", small: 450, large: 760 },
  { name: "Филадельфия", desc: "Сёмга, помидоры, сыр, соус, зелень", small: 490, large: 790 },
  { name: "Студенческая", desc: "Сосиски, салями, огурцы маринованные, сыр, соус, зелень", small: 460, large: 760 },
  { name: "Гавайская", desc: "Куриное филе, ананас, соус, сыр", small: 460, large: 760 },
];

const UZBEK = [
  { name: "Шурпа", desc: "Насыщенный мясной бульон с овощами" },
  { name: "Узбекский плов", desc: "Рис с мясом, морковью и специями в казане" },
  { name: "Лагман", desc: "Тянутая лапша с мясом и овощами" },
];

async function upsertCategory(name: string, color: string, sort: number) {
  const existing = await db.category.findFirst({ where: { name } });
  if (existing) return existing;
  return db.category.create({ data: { name, color, sort } });
}

async function main() {
  const pizzaCat = await upsertCategory("Пицца", "#E2574C", 10);
  const uzbekCat = await upsertCategory("Узбекская кухня", "#C8853F", 11);

  let created = 0;
  let skipped = 0;

  for (const pizza of PIZZAS) {
    const exists = await db.item.findFirst({ where: { name: pizza.name, categoryId: pizzaCat.id } });
    if (exists) { skipped++; continue; }

    // Базовая цена — маленькая порция, большая доплачивается опцией
    await db.item.create({
      data: {
        name: pizza.name,
        description: pizza.desc,
        price: pizza.small,
        cost: Math.round(pizza.small * 0.3),
        dineInPrice: pizza.small,
        categoryId: pizzaCat.id,
        workshop: "горячий",
        cookingMinutes: 20,
        allergens: "глютен, молоко",
        modifierGroups: {
          create: {
            name: "Порция",
            min: 1,
            max: 1,
            options: {
              create: [
                { name: "300 г", price: 0 },
                { name: "600 г", price: pizza.large - pizza.small },
              ],
            },
          },
        },
      },
    });
    created++;
  }

  for (const dish of UZBEK) {
    const exists = await db.item.findFirst({ where: { name: dish.name, categoryId: uzbekCat.id } });
    if (exists) { skipped++; continue; }

    await db.item.create({
      data: {
        name: dish.name,
        description: dish.desc,
        price: 0,
        cost: 0,
        categoryId: uzbekCat.id,
        workshop: "горячий",
        cookingMinutes: 25,
      },
    });
    created++;
  }

  // Блюда с ценой 0 показываем в меню, но заказать их нельзя — цена проставляется в CRM
  await db.item.updateMany({
    where: { categoryId: uzbekCat.id },
    data: { site: true, app: true, kiosk: true, bot: true },
  });

  console.log(`Добавлено позиций: ${created}, уже были: ${skipped}`);
  console.log("Узбекские блюда видны в меню с пометкой «цена уточняется» — проставьте цену в CRM.");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
