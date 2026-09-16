// @ts-nocheck
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  // Очищаем текущие категории и блюда
  await db.recipeIngredient.deleteMany();
  await db.modifier.deleteMany();
  await db.modifierGroup.deleteMany();
  await db.itemSchedule.deleteMany();
  await db.recipeVersion.deleteMany();
  await db.orderLine.deleteMany();
  await db.item.deleteMany();
  await db.category.deleteMany();

  // Категории суши-ресторана
  const cats = await Promise.all([
    db.category.create({ data: { name: "Запечённые роллы", color: "#C8853F", sort: 0 } }),
    db.category.create({ data: { name: "Классические роллы", color: "#8B5CF6", sort: 1 } }),
    db.category.create({ data: { name: "Горячие роллы", color: "#EF4444", sort: 2 } }),
    db.category.create({ data: { name: "Маки", color: "#10B981", sort: 3 } }),
    db.category.create({ data: { name: "Бургеры", color: "#F59E0B", sort: 4 } }),
    db.category.create({ data: { name: "Салаты", color: "#6366F1", sort: 5 } }),
    db.category.create({ data: { name: "Супы", color: "#14B8A6", sort: 6 } }),
  ]);

  const [baked, classic, hot, maki, burgers, salads, soups] = cats;

  // Unsplash фото для категорий
  const PHOTOS = {
    bakedRoll: "https://images.unsplash.com/photo-1617196034183-421b4040ed20?auto=format&fit=crop&w=600&h=450",
    classicRoll: "https://images.unsplash.com/photo-1562802378-173f0809c4f4?auto=format&fit=crop&w=600&h=450",
    salmonRoll: "https://images.unsplash.com/photo-1559410545-fd39c97d2d6c?auto=format&fit=crop&w=600&h=450",
    californiaRoll: "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=600&h=450",
    hotRoll: "https://images.unsplash.com/photo-1582450871972-ab5ca641643d?auto=format&fit=crop&w=600&h=450",
    maki: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=600&h=450",
    burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&h=450",
    salad: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&h=450",
    soup: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&h=450",
    ramen: "https://images.unsplash.com/photo-1557872943-16a5ac26437e?auto=format&fit=crop&w=600&h=450",
    tempura: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&h=450",
    sashimi: "https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&w=600&h=450",
  };

  const items = [
    // === Запечённые роллы ===
    { name: "Горящая Филадельфия", desc: "Лосось, сливочный сыр, авокадо, запечённые под горелкой", price: 500, cat: baked.id, photo: PHOTOS.bakedRoll, labels: "hit" },
    { name: "Ойси", desc: "Угорь, огурец, сливочный сыр, запечённый соус", price: 430, cat: baked.id, photo: PHOTOS.bakedRoll },
    { name: "Бранч", desc: "Лосось, краб, авокадо, соус терияки", price: 450, cat: baked.id, photo: PHOTOS.salmonRoll },
    { name: "Инь-Янь", desc: "Два вида соуса, лосось и угорь, огурец", price: 400, cat: baked.id, photo: PHOTOS.bakedRoll },
    { name: "Сеун", desc: "Краб, огурец, сливочный сыр, запечённый", price: 440, cat: baked.id, photo: PHOTOS.bakedRoll },
    { name: "Скала", desc: "Тунец, авокадо, соус спайси, запечённый", price: 470, cat: baked.id, photo: PHOTOS.hotRoll },
    { name: "Шанхай", desc: "Лосось, огурец, сливочный сыр, соус унаги", price: 490, cat: baked.id, photo: PHOTOS.bakedRoll },
    { name: "Белый ролл", desc: "Рис снаружи, лосось, сыр, огурец, белый соус", price: 330, cat: baked.id, photo: PHOTOS.classicRoll },

    // === Классические роллы ===
    { name: "Калифорния", desc: "Краб, авокадо, огурец, икра тобико", price: 170, cat: classic.id, photo: PHOTOS.californiaRoll, labels: "hit" },
    { name: "Итуруп", desc: "Лосось, огурец, нори, соус терияки", price: 170, cat: classic.id, photo: PHOTOS.salmonRoll },
    { name: "Империал", desc: "Угорь, огурец, авокадо, соус унаги", price: 190, cat: classic.id, photo: PHOTOS.classicRoll },
    { name: "Инари", desc: "Рис в тофу, кунжут, соевый соус", price: 180, cat: classic.id, photo: PHOTOS.maki },
    { name: "Канадский", desc: "Лосось, сливочный сыр, огурец", price: 180, cat: classic.id, photo: PHOTOS.salmonRoll },
    { name: "Зебра", desc: "Лосось, тунец, авокадо, икра тобико", price: 150, cat: classic.id, photo: PHOTOS.sashimi },
    { name: "Радуга", desc: "Ассорти из рыбы, авокадо, огурец", price: 250, cat: classic.id, photo: PHOTOS.californiaRoll, labels: "hit" },
    { name: "Самурай", desc: "Краб, авокадо, огурец, острый соус", price: 170, cat: classic.id, photo: PHOTOS.classicRoll },
    { name: "Сакура", desc: "Лосось, огурец, сливочный сыр, нежный", price: 250, cat: classic.id, photo: PHOTOS.salmonRoll },
    { name: "Шахматы", desc: "Лосось и авокадо, чередование цветов", price: 400, cat: classic.id, photo: PHOTOS.sashimi },
    { name: "Снежный краб", desc: "Краб, сливочный сыр, огурец, икра", price: 650, cat: classic.id, photo: PHOTOS.californiaRoll },
    { name: "Канадский НЮ", desc: "Лосось, краб, авокадо, унаги, сыр", price: 550, cat: classic.id, photo: PHOTOS.salmonRoll },
    { name: "Новая Калифорния", desc: "Краб, авокадо, огурец, манго, тобико", price: 420, cat: classic.id, photo: PHOTOS.californiaRoll, labels: "new" },

    // === Горячие роллы ===
    { name: "Горящая Калифорния", desc: "Краб, авокадо, огурец, жареные в темпуре", price: 380, cat: hot.id, photo: PHOTOS.tempura, labels: "hit" },
    { name: "Лава", desc: "Лосось в темпуре, острый соус, сыр", price: 380, cat: hot.id, photo: PHOTOS.hotRoll },
    { name: "Мидори", desc: "Краб, огурец, темпура, соус спайси", price: 380, cat: hot.id, photo: PHOTOS.tempura },
    { name: "Фудзи", desc: "Лосось, сыр, темпура, соус терияки", price: 180, cat: hot.id, photo: PHOTOS.hotRoll },
    { name: "Чингиз", desc: "Краб, авокадо, острый соус, жареные", price: 190, cat: hot.id, photo: PHOTOS.tempura },
    { name: "Сильный урожай", desc: "Лосось, угорь, авокадо, темпура", price: 550, cat: hot.id, photo: PHOTOS.hotRoll },

    // === Маки ===
    { name: "Маки лосось", desc: "Тонкие роллы с лососем и нори", price: 210, cat: maki.id, photo: PHOTOS.maki },
    { name: "Маки огурец", desc: "Тонкие роллы с огурцом, кунжут", price: 110, cat: maki.id, photo: PHOTOS.maki },
    { name: "Острые маки", desc: "Тунец, острый соус, зелёный лук", price: 150, cat: maki.id, photo: PHOTOS.maki, labels: "spicy" },
    { name: "Хосомаки", desc: "Тонкие роллы ассорти, 6 шт", price: 300, cat: maki.id, photo: PHOTOS.maki },
    { name: "Нигири лосось", desc: "Рис с лососем, 2 шт", price: 170, cat: maki.id, photo: PHOTOS.sashimi },
    { name: "Нигири угорь", desc: "Рис с угрём и соусом унаги, 2 шт", price: 270, cat: maki.id, photo: PHOTOS.sashimi },
    { name: "Паппа маки", desc: "Большие маки с начинкой, 4 шт", price: 160, cat: maki.id, photo: PHOTOS.maki },

    // === Бургеры ===
    { name: "Суши-бургер лосось", desc: "Рисовые булочки, лосось, авокадо, соус", price: 390, cat: burgers.id, photo: PHOTOS.burger, labels: "new" },
    { name: "Суши-бургер краб", desc: "Рисовые булочки, крабовый микс, огурец", price: 360, cat: burgers.id, photo: PHOTOS.burger },
    { name: "Суши-бургер спайси", desc: "Рисовые булочки, тунец, острый соус", price: 380, cat: burgers.id, photo: PHOTOS.burger, labels: "spicy" },

    // === Салаты ===
    { name: "Осьминог", desc: "Осьминог, микс листьев, лимонная заправка", price: 350, cat: salads.id, photo: PHOTOS.salad },
    { name: "Пёстрый", desc: "Свежие овощи, авокадо, кунжутная заправка", price: 320, cat: salads.id, photo: PHOTOS.salad },
    { name: "Вишнёвый", desc: "Краб, огурец, помидор черри, соус юдзу", price: 460, cat: salads.id, photo: PHOTOS.salad },
    { name: "Чука", desc: "Морская капуста, кунжут, соевый соус", price: 280, cat: salads.id, photo: PHOTOS.salad },

    // === Супы ===
    { name: "Мисо суп", desc: "Тофу, водоросли, зелёный лук, паста мисо", price: 250, cat: soups.id, photo: PHOTOS.soup },
    { name: "Том Ям", desc: "Морепродукты, лемонграсс, кокосовое молоко", price: 430, cat: soups.id, photo: PHOTOS.soup, labels: "hit" },
    { name: "Рамен с лососем", desc: "Лапша, лосось, яйцо, водоросли нори", price: 480, cat: soups.id, photo: PHOTOS.ramen },
    { name: "Домашний суп", desc: "Куриный бульон, лапша, зелень", price: 280, cat: soups.id, photo: PHOTOS.soup },
  ];

  for (const it of items) {
    await db.item.create({
      data: {
        name: it.name,
        description: it.desc,
        price: it.price,
        cost: Math.round(it.price * 0.3),
        dineInPrice: it.price,
        deliveryPrice: it.price + 50,
        pickupPrice: it.price - 20,
        photo: it.photo,
        categoryId: it.cat,
        labels: it.labels ?? "",
        workshop: "холодный",
        cookingMinutes: 10,
        nutrition: "Б 8г · Ж 6г · У 32г",
        calories: 200 + Math.floor(Math.random() * 150),
        allergens: "рыба, соя",
      },
    });
  }

  console.log(`✅ Добавлено ${items.length} блюд в ${cats.length} категориях`);
}

main().finally(() => db.$disconnect());
