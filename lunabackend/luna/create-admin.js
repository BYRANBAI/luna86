const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123456', 10);

  const admin = await prisma.user.create({
    data: {
      login: 'admin1',
      name: 'Admin User',
      role: 'Администратор',
      passwordHash,
      pin: '0000',
      active: true,
      payType: 'Почасовая',
      baseSalary: 0,
      hourlyRate: 0,
      revenuePercent: 0,
      bonusPercent: 0,
      averageCheckPlan: 0,
    },
  });

  console.log('Admin created:', admin);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
