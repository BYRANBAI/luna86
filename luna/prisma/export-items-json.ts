import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const items = await db.item.findMany({
    include: { category: true },
    orderBy: [{ category: { sort: "asc" } }, { id: "asc" }],
  });
  for (const i of items) {
    console.log(
      JSON.stringify({
        cat: i.category?.name ?? "?",
        name: i.name,
        desc: i.description ?? "",
        photo: i.photo ?? "",
      })
    );
  }
}

main().finally(() => db.$disconnect());
