/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  console.log("🗑️  Очистка базы данных...");
  await db.auditLog.deleteMany(); await db.timeEntry.deleteMany(); await db.shift.deleteMany(); await db.recipeVersion.deleteMany(); await db.itemSchedule.deleteMany(); await db.modifierOption.deleteMany(); await db.modifierGroup.deleteMany(); await db.reservation.deleteMany(); await db.diningTable.deleteMany(); await db.hall.deleteMany(); await db.courier.deleteMany(); await db.supplier.deleteMany(); await db.promotion.deleteMany(); await db.promocode.deleteMany(); await db.campaign.deleteMany(); await db.setting.deleteMany(); await db.user.deleteMany();
  await db.payment.deleteMany(); await db.orderLine.deleteMany(); await db.order.deleteMany(); await db.recipeIngredient.deleteMany(); await db.modifier.deleteMany(); await db.stockMovement.deleteMany(); await db.ingredient.deleteMany(); await db.item.deleteMany(); await db.category.deleteMany(); await db.expense.deleteMany(); await db.deliveryZone.deleteMany(); await db.guest.deleteMany();

  console.log("📁 Создание категорий роллов...");
  const categories = await Promise.all([
    db.category.create({ data: { name: "Классические роллы", sort: 0, color: "#E91E63" } }),
    db.category.create({ data: { name: "Маки", sort: 1, color: "#9C27B0" } }),
    db.category.create({ data: { name: "Фирменные роллы", sort: 2, color: "#FF5722" } }),
    db.category.create({ data: { name: "Запечённые роллы", sort: 3, color: "#FF9800" } }),
    db.category.create({ data: { name: "Горячие роллы", sort: 4, color: "#F44336" } }),
    db.category.create({ data: { name: "Спецпозиции", sort: 5, color: "#4CAF50" } }),
  ]);

  console.log("🍣 Создание роллов...");
  const rolls = [
    // Классические роллы
    ["Аляска", "Лосось, сливочный сыр, свежий огурец, обжаренный кунжут", 420, 0, "/images/menu/cc-roll-01.png"],
    ["Калифорния классическая", "Снежный краб, спелый авокадо, свежий огурец, икра тобико", 390, 0, "/images/menu/cc-roll-02.png"],
    ["Калифорния с креветкой", "Тигровая креветка, авокадо, огурец, икра тобико", 450, 0, "/images/menu/cc-roll-03.png"],
    ["Калифорния с лососем", "Филе лосося, авокадо, огурец, икра тобико", 440, 0, "/images/menu/cc-roll-04.png"],
    ["Калифорния чикен", "Копченая куриная грудка, огурец, кунжут", 350, 0, "/images/menu/cc-roll-05.png"],
    ["Филадельфия классическая", "Охлажденный лосось, нежный сливочный сыр, огурец", 480, 0, "/images/menu/cc-roll-06.png"],
    ["Унаги филадельфия", "Сливочный сыр, огурец, лосось, копченый угорь, соус унаги, кунжут", 590, 0, "/images/menu/cc-roll-07.png"],
    ["Унаги креметте", "Копченый угорь, сливочный сыр Cremette, соус унаги, кунжут", 520, 0, "/images/menu/cc-roll-08.png"],
    // Маки
    ["Капа маки", "Классический ролл со свежим огурцом и кунжутом", 180, 1, "/images/menu/cc-roll-09.png"],
    ["Кета маки", "Классический ролл с филе кеты", 220, 1, "/images/menu/cc-roll-10.png"],
    ["Томато маки", "Ролл со свежим томатом и сливочным сыром", 190, 1, "/images/menu/cc-roll-11.png"],
    ["Унаги маки", "Ролл с копченым угрем, соусом унаги и кунжутом", 280, 1, "/images/menu/cc-roll-12.png"],
    // Фирменные роллы
    ["Атлантика", "Лосось, сливочный сыр, икра тобико, свежий огурец", 460, 2, "/images/menu/atlantika.webp"],
    ["Восход", "Лосось, икра тобико, сливочный сыр, огурец", 440, 2, "/images/menu/cc-roll-13.png"],
    ["Гейша", "Лосось, сливочный сыр, огурец, декорирован икрой", 490, 2, "/images/menu/cc-roll-14.png"],
    ["Имбирный", "Маринованный имбирь, сливочный сыр, курица", 380, 2, "/images/menu/cc-roll-15.png"],
    ["Империя", "Копченый угорь, лосось, сливочный сыр, авокадо, икра", 620, 2, "/images/menu/imperiya.webp"],
    ["Инари", "Жареный тофу инари, рис, сливочный сыр, овощи", 320, 2, "/images/menu/inari.webp"],
    ["Инь-янь", "Лосось и угорь, белый и черный кунжут", 550, 2, "/images/menu/cc-roll-16.png"],
    ["Камелия", "Снежный краб, сливочный сыр, огурец", 410, 2, "/images/menu/cc-roll-17.png"],
    ["Кармен", "Сочная курочка, бекон, сливочный сыр, овощи, пикантный соус", 420, 2, "/images/menu/cc-roll-18.png"],
    ["Королевский", "Тигровая креветка, лосось, сливочный сыр, икра тобико", 560, 2, "/images/menu/cc-roll-19.png"],
    ["Лава лайт", "Снежный краб, сливочный сыр, фирменный соус Лава", 480, 2, "/images/menu/cc-roll-20.png"],
    ["Лава с семгой", "Филе семги, сливочный сыр, соус Лава", 520, 2, "/images/menu/cc-roll-21.png"],
    ["Небраска", "Копченая курица, сливочный сыр, томат, огурец", 390, 2, "/images/menu/cc-roll-22.png"],
    ["Самурай", "Копченый угорь, лосось, сливочный сыр, огурец, соус унаги", 580, 2, "/images/menu/cc-roll-23.png"],
    ["Сяки кунсе", "Копченый лосось, сливочный сыр, зеленый лук", 450, 2, "/images/menu/cc-roll-24.png"],
    ["Тигровые", "Тигровая креветка в темпуре, сливочный сыр, огурец", 490, 2, "/images/menu/tigrovye.webp"],
    ["Шахмат", "Кусочки лосося и угря в шахматном порядке", 610, 2, "/images/menu/shakhmat.webp"],
    ["Адак шик", "Фирменный ролл — уточните состав", 520, 2, "/images/menu/adak-shik.svg"],
    ["Кико", "Авторский ролл — уточните состав", 480, 2, "/images/menu/kiko.svg"],
    ["То-токи", "Фирменный ролл — уточните состав", 490, 2, "/images/menu/to-toki.svg"],
    ["Япошка", "Авторский ролл — уточните состав", 510, 2, "/images/menu/yaposhka.svg"],
    // Запечённые роллы
    ["Филадельфия запеченная", "Лосось, сливочный сыр, огурец, запечен под сырной шапочкой", 540, 3, "/images/menu/philadelphia-baked.webp"],
    ["Скала", "Запеченный ролл с высокой сырной шапочкой и морепродуктами", 580, 3, "/images/menu/skala.webp"],
    ["Ойси", "Запеченный ролл со сливочным сыром и пикантной шапочкой", 520, 3, "/images/menu/oysi.webp"],
    ["Яки с крабом", "Запеченный ролл с крабом под сырным соусом", 490, 3, "/images/menu/yaki-crab.webp"],
    ["Яки с лососем", "Запеченный ролл с лососем под спайси соусом", 530, 3, "/images/menu/yaki-salmon.webp"],
    ["Яки с мидиями", "Запеченный ролл с мидиями под сырной шапкой", 480, 3, "/images/menu/yaki-mussels.webp"],
    // Горячие роллы
    ["Филадельфия горячая", "Классическая Филадельфия, обжаренная в темпуре", 520, 4, "/images/menu/philadelphia-hot.webp"],
    ["Теплый ролл с креветкой", "Тигровая креветка, сливочный сыр, огурец в темпуре", 490, 4, "/images/menu/warm-shrimp.webp"],
    // Спецпозиции
    ["Суши пицца", "Хрустящая рисовая основа, сливочный сыр, морепродукты, овощи, запечены под сыром", 650, 5, "/images/menu/sushi-pizza.webp"],
    ["Сэндвич ролл", "Сытный суши-сэндвич из риса и нори с плотной начинкой", 420, 5, "/images/menu/sandwich-roll.webp"],
  ];

  const items = [];
  for (const [name, desc, price, catIndex, photo] of rolls) {
    items.push(await db.item.create({
      data: {
        name,
        description: desc,
        price,
        cost: Math.floor(price * 0.35),
        dineInPrice: price,
        deliveryPrice: price + 50,
        pickupPrice: price - 20,
        workshop: "холодный",
        cookingMinutes: 12,
        allergens: "рыба, морепродукты",
        nutrition: "Б 15 г · Ж 10 г · У 35 г",
        calories: 250,
        photo: photo || "",
        category: {
          connect: { id: categories[catIndex].id }
        }
      },
    }));
  }
  console.log(`✅ Создано ${items.length} роллов`);
  console.log("👥 Создание гостей...");
  const guests=[]; for(let i=0;i<9;i++) guests.push(await db.guest.create({data:{name:["Анна Петрова","Дмитрий Орлов","Мария Смирнова","Илья Волков","Ольга Ким","Никита Соколов","Елена Морозова","Роман Белый","София Лебедева"][i],phone:`+7 900 000-00-${String(i+1).padStart(2,"0")}`,bonuses:100+i*85,passwordHash:await bcryptHash("demo123")}}));

  console.log("📦 Создание заказов...");
  for(let day=0;day<14;day++){for(let j=0;j<2;j++){const guest=guests[(day+j)%guests.length], item=items[(day*2+j)%items.length], age=day===0?j:day;const order=await db.order.create({data:{number:String(400+day*10+j),source:["Сайт","Киоск","Зал","Доставка"][day%4],status:day===0&&j===0?"NEW":"DONE",total:item.price,guestId:guest.id,createdAt:new Date(Date.now()-age*86400000),lines:{create:{itemId:item.id,qty:1,price:item.price}}}});await db.payment.create({data:{orderId:order.id,type:"Карта",amount:item.price}});}}

  console.log("💰 Создание расходов...");
  for(const x of [["Продукты",85000,"Закупка рыбы и морепродуктов"],["Аренда",120000,"Аренда помещения"],["Маркетинг",25000,"Реклама"],["Коммунальные",18000,"Электричество, вода"]]) await db.expense.create({data:{category:x[0],amount:x[1],note:x[2]}});

  console.log("🚚 Создание зон доставки...");
  for(const x of [["Центр",500,0,25],["Север",800,150,40],["Парк",1200,250,55]]) await db.deliveryZone.create({data:{name:x[0],minOrder:x[1],fee:x[2],eta:x[3]}});

  console.log("👤 Создание пользователей...");
  const accounts = [["admin","Администратор","Владелец"],["manager","Управляющий","Управляющий"],["cashier","Кассир","Кассир"],["cook","Повар","Повар"]];
  for (const [login, name, role] of accounts) await db.user.create({ data: { login, name, role, passwordHash: await bcryptHash(login === "admin" ? "admin" : "cashier"), pin: login === "cashier" ? "1234" : "", payType: login === "admin" ? "Оклад" : "Почасовая", baseSalary: login === "admin" ? 100000 : 0, hourlyRate: login === "admin" ? 0 : 400, revenuePercent: login === "cashier" ? 3 : 1, bonusPercent: login === "cashier" ? 5 : 2, averageCheckPlan: 600 } });

  const payrollUsers = await db.user.findMany({ orderBy: { id: "asc" } });
  const historicalOrders = await db.order.findMany({ orderBy: { id: "asc" } });
  for (let i = 0; i < historicalOrders.length; i++) await db.order.update({ where: { id: historicalOrders[i].id }, data: { employeeId: payrollUsers[i % payrollUsers.length].id } });

  console.log("🏪 Создание поставщиков...");
  for (const x of [["ООО Рыбный мир","fish@example.ru","+7 900 555-10-10"],["Морские деликатесы","sea@example.ru","+7 900 555-20-20"]]) await db.supplier.create({ data: { name: x[0], email: x[1], phone: x[2] } });

  console.log("🏢 Создание зала и столиков...");
  const hall = await db.hall.create({ data: { name: "Основной зал" } });
  for (let i = 1; i <= 10; i++) await db.diningTable.create({ data: { number: String(i), seats: i < 6 ? 2 : 4, hallId: hall.id, x: (i - 1) % 5, y: Math.floor((i - 1) / 5) } });

  await db.reservation.create({ data: { guestName: "Анна Петрова", phone: "+7 900 000-00-01", guests: 2, date: new Date(Date.now() + 2 * 60 * 60 * 1000), status: "Подтверждена", hallId: hall.id, tableId: (await db.diningTable.findFirst({ where: { hallId: hall.id, number: "1" } }))!.id } });
  await db.reservation.create({ data: { guestName: "Дмитрий Орлов", phone: "+7 900 000-00-02", guests: 4, date: new Date(Date.now() + 4 * 60 * 60 * 1000), status: "Новая", hallId: hall.id, tableId: (await db.diningTable.findFirst({ where: { hallId: hall.id, number: "5" } }))!.id } });

  console.log("🚴 Создание курьеров...");
  for (const x of [["Иван Курьеров","+7 900 111-22-33"],["Олег Доставкин","+7 900 111-22-44"]]) await db.courier.create({ data: { name: x[0], phone: x[1] } });

  console.log("🎁 Создание промо и настроек...");
  await db.promotion.create({ data: { name: "Счастливые часы", condition: "Будни 12:00–16:00", action: "Скидка 10%" } });
  await db.promocode.create({ data: { code: "SUSHI10", discount: 10, usageLimit: 100 } });
  await db.campaign.create({ data: { name: "Добро пожаловать", segment: "Новые", channel: "Telegram", status: "Доставлено", sent: 12, delivered: 11 } });
  for (const [key, value, section] of [["venue_name","Суши-бар Luna","Заведение"],["opening_hours","11:00–23:00","Заведение"],["channel_site","true","Каналы"],["channel_kiosk","true","Каналы"],["channel_delivery","true","Каналы"],["payment_card","true","Оплата"],["integration_1c","false","Интеграции"],["integration_telegram","false","Интеграции"]]) await db.setting.create({ data: { key, value, section } });

  console.log("✅ Seed завершен успешно!");
}
async function bcryptHash(value: string) {
  const bcrypt = await import("bcryptjs");
  return bcrypt.hash(value, 10);
}
main().finally(()=>db.$disconnect());
