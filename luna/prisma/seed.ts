/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  await db.auditLog.deleteMany(); await db.timeEntry.deleteMany(); await db.shift.deleteMany(); await db.recipeVersion.deleteMany(); await db.itemSchedule.deleteMany(); await db.modifierOption.deleteMany(); await db.modifierGroup.deleteMany(); await db.reservation.deleteMany(); await db.diningTable.deleteMany(); await db.hall.deleteMany(); await db.courier.deleteMany(); await db.supplier.deleteMany(); await db.promotion.deleteMany(); await db.promocode.deleteMany(); await db.campaign.deleteMany(); await db.setting.deleteMany(); await db.user.deleteMany();
  await db.payment.deleteMany(); await db.orderLine.deleteMany(); await db.order.deleteMany(); await db.recipeIngredient.deleteMany(); await db.modifier.deleteMany(); await db.stockMovement.deleteMany(); await db.ingredient.deleteMany(); await db.item.deleteMany(); await db.category.deleteMany(); await db.expense.deleteMany(); await db.deliveryZone.deleteMany(); await db.guest.deleteMany();
  const categories = await Promise.all(["Кофе и напитки", "Завтраки", "Основные блюда", "Десерты", "Комбо"].map((name, i) => db.category.create({ data: { name, sort: i } })));
  const specs = [["Латте Луна","Эспрессо, молоко и ванильная пена",320,92,"бар",5],["Капучино","Плотная молочная пенка и двойной эспрессо",290,84,"бар",5],["Матча-тоник","Матча, тоник, лайм и лёд",360,110,"бар",6],["Фильтр-кофе","Эфиопия, ферментированный фильтр",280,76,"бар",7],["Сырники с кремом","Творожные сырники, сметанный крем, ягоды",490,165,"горячий",14],["Круассан с лососем","Сливочный сыр, лосось, зелень",560,230,"холодный",10],["Тост с авокадо","Авокадо, яйцо пашот, зерновой хлеб",520,190,"горячий",12],["Каша с ягодами","Овсяная каша, кокос, сезонные ягоды",390,125,"горячий",10],["Паста с грибами","Тальятелле, сливочный соус, пармезан",620,230,"горячий",18],["Боул с лососем","Рис, лосось, авокадо, эдамаме",690,280,"холодный",15],["Курица терияки","Куриное бедро, рис, овощи",590,210,"горячий",16],["Салат с креветкой","Креветка, микс салата, манго",650,260,"холодный",12],["Чизкейк юдзу","Нежный чизкейк с цитрусовой нотой",390,130,"кондитерский",8],["Шоколадный тарт","Тёмный шоколад, карамель, соль",420,145,"кондитерский",9],["Медовик","Медовые коржи, сметанный крем",370,120,"кондитерский",8],["Комбо Луна","Капучино, сырники и чизкейк",890,300,"горячий",18],["Обеденное комбо","Суп дня, тост и напиток",790,260,"горячий",20],["Кофе + круассан","Капучино и круассан с лососем",760,280,"бар",10]];
  const items=[]; for (let i=0;i<specs.length;i++){const s=specs[i]; items.push(await db.item.create({data:{name:s[0],description:s[1],price:s[2],cost:s[3],dineInPrice:s[2],deliveryPrice:s[2]+50,pickupPrice:s[2]-20,workshop:s[4],cookingMinutes:s[5],categoryId:categories[i<4?0:i<8?1:i<12?2:i<15?3:4].id,dailyLimit:i%3===0?20:null,allergens:i%4===0?"молоко":"",nutrition:"Б 12 г · Ж 8 г · У 24 г",calories:200+i*15,modifiers:{create:i<4?[{name:"Большой размер",price:60},{name:"Сироп",price:50}]:[{name:"Добавить авокадо",price:90}]}}}));}
  const ingNames=[["Зёрна кофе","г",3000,1.8],["Молоко","мл",12000,.08],["Авокадо","г",6000,.35],["Лосось","г",4000,1.4],["Творог","г",5000,.3],["Яйцо","шт",120,.55],["Мука","г",10000,.05],["Шоколад","г",3000,.5],["Рис","г",7000,.12],["Пармезан","г",2000,.7],["Ягоды","г",3000,.45]];
  const ingredients=[]; for(const x of ingNames) ingredients.push(await db.ingredient.create({data:{name:x[0],unit:x[1],stock:x[2],minStock:x[2]*0.12,costPerUnit:x[3]}}));
  const recipeNames: Record<string, string[]> = {
    "Латте Луна": ["Зёрна кофе", "Молоко"],
    "Капучино": ["Зёрна кофе", "Молоко"],
    "Матча-тоник": ["Молоко", "Ягоды"],
    "Фильтр-кофе": ["Зёрна кофе", "Молоко"],
    "Сырники с кремом": ["Творог", "Ягоды"],
    "Круассан с лососем": ["Лосось", "Мука"],
    "Тост с авокадо": ["Авокадо", "Яйцо"],
    "Каша с ягодами": ["Мука", "Ягоды"],
    "Паста с грибами": ["Мука", "Пармезан"],
    "Боул с лососем": ["Рис", "Лосось"],
    "Курица терияки": ["Рис", "Ягоды"],
    "Салат с креветкой": ["Авокадо", "Ягоды"],
    "Чизкейк юдзу": ["Творог", "Мука"],
    "Шоколадный тарт": ["Шоколад", "Мука"],
    "Медовик": ["Мука", "Шоколад"]
  };
  for (const item of items) {
    for (const name of recipeNames[item.name] ?? ["Мука"]) {
      const ing = ingredients.find(x => x.name === name)!;
      await db.recipeIngredient.create({ data: { itemId: item.id, ingredientId: ing.id, grams: name === "Яйцо" ? 1 : 80 } });
    }
  }
  const guests=[]; for(let i=0;i<9;i++) guests.push(await db.guest.create({data:{name:["Анна Петрова","Дмитрий Орлов","Мария Смирнова","Илья Волков","Ольга Ким","Никита Соколов","Елена Морозова","Роман Белый","София Лебедева"][i],phone:`+7 900 000-00-${String(i+1).padStart(2,"0")}`,bonuses:100+i*85}}));
  for(let day=0;day<14;day++){for(let j=0;j<2;j++){const guest=guests[(day+j)%guests.length], item=items[(day*2+j)%items.length], age=day===0?j:day;const order=await db.order.create({data:{number:String(400+day*10+j),source:["Сайт","Киоск","Зал","Доставка"][day%4],status:day===0&&j===0?"NEW":"DONE",total:item.price,guestId:guest.id,createdAt:new Date(Date.now()-age*86400000),lines:{create:{itemId:item.id,qty:1,price:item.price}}}});await db.payment.create({data:{orderId:order.id,type:"Карта",amount:item.price}});}}
  for(const x of [["Продукты",52000,"Закупка недели"],["Аренда",80000,"Аренда помещения"],["Маркетинг",18000,"Реклама"],["Коммунальные",12000,"Счета"]]) await db.expense.create({data:{category:x[0],amount:x[1],note:x[2]}});
  for(const x of [["Центр",500,0,25],["Север",800,150,40],["Парк",1200,250,55]]) await db.deliveryZone.create({data:{name:x[0],minOrder:x[1],fee:x[2],eta:x[3]}});
  const accounts = [["owner","Владелец","Владелец"],["manager","Управляющий","Управляющий"],["cashier","Кассир","Кассир"],["cook","Повар","Повар"],["stock","Кладовщик","Кладовщик"],["marketing","Маркетолог","Маркетолог"]];
  for (const [login, name, role] of accounts) await db.user.create({ data: { login, name, role, passwordHash: await bcryptHash("luna123"), pin: login === "cashier" ? "1234" : "", payType: login === "owner" ? "Оклад" : "Почасовая", baseSalary: login === "owner" ? 80000 : 0, hourlyRate: login === "owner" ? 0 : 350, revenuePercent: login === "cashier" ? 3 : 1, bonusPercent: login === "cashier" ? 5 : 2, averageCheckPlan: 500 } });
  const payrollUsers = await db.user.findMany({ orderBy: { id: "asc" } });
  const historicalOrders = await db.order.findMany({ orderBy: { id: "asc" } });
  for (let i = 0; i < historicalOrders.length; i++) await db.order.update({ where: { id: historicalOrders[i].id }, data: { employeeId: payrollUsers[i % payrollUsers.length].id } });
  for (const x of [["ООО Луна-Снаб","supplier@example.ru","+7 900 555-10-10"],["Ферма Север","farm@example.ru","+7 900 555-20-20"]]) await db.supplier.create({ data: { name: x[0], email: x[1], phone: x[2] } });
  const hall = await db.hall.create({ data: { name: "Основной зал" } });
  for (let i = 1; i <= 8; i++) await db.diningTable.create({ data: { number: String(i), seats: i < 5 ? 2 : 4, hallId: hall.id, x: (i - 1) % 4, y: Math.floor((i - 1) / 4) } });
  await db.reservation.create({ data: { guestName: "Анна Петрова", phone: "+7 900 000-00-01", guests: 2, date: new Date(Date.now() + 2 * 60 * 60 * 1000), status: "Подтверждена", hallId: hall.id, tableId: (await db.diningTable.findFirst({ where: { hallId: hall.id, number: "1" } }))!.id } });
  await db.reservation.create({ data: { guestName: "Дмитрий Орлов", phone: "+7 900 000-00-02", guests: 4, date: new Date(Date.now() + 4 * 60 * 60 * 1000), status: "Новая", hallId: hall.id, tableId: (await db.diningTable.findFirst({ where: { hallId: hall.id, number: "5" } }))!.id } });
  for (const x of [["Иван Курьер","+7 900 111-22-33"],["Олег Доставка","+7 900 111-22-44"]]) await db.courier.create({ data: { name: x[0], phone: x[1] } });
  await db.promotion.create({ data: { name: "Счастливые часы", condition: "Будни 12:00–16:00", action: "Скидка 10%" } });
  await db.promocode.create({ data: { code: "LUNA10", discount: 10, usageLimit: 100 } });
  await db.campaign.create({ data: { name: "Добро пожаловать", segment: "Новые", channel: "Telegram", status: "Доставлено", sent: 12, delivered: 11 } });
  for (const [key, value, section] of [["venue_name","Кафе «Луна»","Заведение"],["opening_hours","08:00–23:00","Заведение"],["channel_site","true","Каналы"],["channel_kiosk","true","Каналы"],["channel_delivery","true","Каналы"],["payment_card","true","Оплата"],["integration_1c","false","Интеграции"],["integration_telegram","false","Интеграции"]]) await db.setting.create({ data: { key, value, section } });
}
async function bcryptHash(value: string) {
  const bcrypt = await import("bcryptjs");
  return bcrypt.hash(value, 10);
}
main().finally(()=>db.$disconnect());
