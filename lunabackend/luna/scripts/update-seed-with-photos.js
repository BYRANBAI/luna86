const fs = require('fs');
const path = require('path');

// Маппинг названий роллов на файлы изображений
const photoMapping = {
  'Атлантика': '/images/menu/atlantika.svg',
  'Империя': '/images/menu/imperiya.svg',
  'Инари': '/images/menu/inari.svg',
  'Тигровые': '/images/menu/tigrovye.svg',
  'Шахмат': '/images/menu/shakhmat.svg',
  'Адак шик': '/images/menu/adak-shik.svg',
  'Кико': '/images/menu/kiko.svg',
  'То-токи': '/images/menu/to-toki.svg',
  'Япошка': '/images/menu/yaposhka.svg',
  'Филадельфия запеченная': '/images/menu/philadelphia-baked.svg',
  'Скала': '/images/menu/skala.svg',
  'Ойси': '/images/menu/oysi.svg',
  'Яки с крабом': '/images/menu/yaki-crab.svg',
  'Яки с лососем': '/images/menu/yaki-salmon.svg',
  'Яки с мидиями': '/images/menu/yaki-mussels.svg',
  'Филадельфия горячая': '/images/menu/philadelphia-hot.svg',
  'Теплый ролл с креветкой': '/images/menu/warm-shrimp.svg',
  'Суши пицца': '/images/menu/sushi-pizza.svg',
  'Сэндвич ролл': '/images/menu/sandwich-roll.svg',
};

const seedPath = path.join(__dirname, '..', 'prisma', 'seed.ts');
let content = fs.readFileSync(seedPath, 'utf8');

console.log('Обновление seed.ts с путями к изображениям...\n');

// Находим массив rolls и добавляем четвёртый элемент (photo) к каждому роллу
let updatedCount = 0;

Object.entries(photoMapping).forEach(([rollName, photoPath]) => {
  // Ищем строку с названием ролла в массиве
  const regex = new RegExp(`(\\["${rollName}",[^\\]]+\\])`, 'g');

  content = content.replace(regex, (match) => {
    // Проверяем, не добавлен ли уже photo
    if (match.includes('/images/menu/')) {
      return match;
    }

    // Добавляем photo как четвёртый элемент
    const withoutBracket = match.slice(0, -1);
    const updated = `${withoutBracket}, "${photoPath}"]`;
    updatedCount++;
    console.log(`✓ ${rollName}`);
    return updated;
  });
});

// Обновляем создание item, добавляя поле photo
const itemCreateRegex = /for \(const \[name, desc, price, catIndex\] of rolls\)/;
content = content.replace(
  itemCreateRegex,
  'for (const [name, desc, price, catIndex, photo] of rolls)'
);

const dataObjectRegex = /(data: \{[\s\S]*?calories: 250,)/;
content = content.replace(
  dataObjectRegex,
  '$1\n        photo: photo || null,'
);

fs.writeFileSync(seedPath, content, 'utf8');

console.log(`\n✅ Обновлено ${updatedCount} роллов`);
console.log('📝 seed.ts успешно обновлён');
console.log('\nТеперь запустите: npm run db:seed');
