const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  const items = await db.item.findMany({
    where: { description: { contains: "уточните состав" } },
    select: { id: true, name: true, description: true },
  });
  for (const item of items) {
    const description = item.description.replaceAll("уточните состав", "уточнить состав");
    await db.item.update({ where: { id: item.id }, data: { description } });
    console.log(`${item.id}\t${item.name}\t${description}`);
  }
  console.log(`updated ${items.length}`);
}

main().finally(() => db.$disconnect());
