const fs = require('fs');
const path = require('path');

const rolls = [
  { name: 'atlantika', title: 'Атлантика', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { name: 'imperiya', title: 'Империя', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { name: 'inari', title: 'Инари', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { name: 'tigrovye', title: 'Тигровые', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { name: 'shakhmat', title: 'Шахмат', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { name: 'adak-shik', title: 'Адак шик', gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' },
  { name: 'kiko', title: 'Кико', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
  { name: 'to-toki', title: 'То-токи', gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
  { name: 'yaposhka', title: 'Япошка', gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
  { name: 'philadelphia-baked', title: 'Филадельфия запечённая', gradient: 'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)' },
  { name: 'skala', title: 'Скала', gradient: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)' },
  { name: 'oysi', title: 'Ойси', gradient: 'linear-gradient(135deg, #f77062 0%, #fe5196 100%)' },
  { name: 'yaki-crab', title: 'Яки с крабом', gradient: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)' },
  { name: 'yaki-salmon', title: 'Яки с лососем', gradient: 'linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)' },
  { name: 'yaki-mussels', title: 'Яки с мидиями', gradient: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)' },
  { name: 'philadelphia-hot', title: 'Филадельфия горячая', gradient: 'linear-gradient(135deg, #fee140 0%, #fa709a 100%)' },
  { name: 'warm-shrimp', title: 'Тёплый ролл с креветкой', gradient: 'linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)' },
  { name: 'sushi-pizza', title: 'Суши-пицца', gradient: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)' },
  { name: 'sandwich-roll', title: 'Сэндвич-ролл', gradient: 'linear-gradient(135deg, #fdcbf1 0%, #e6dee9 100%)' }
];

const outputDir = path.join(__dirname, '..', 'public', 'images', 'menu');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function generateSVG(roll, gradient) {
  const colors = gradient.match(/#[0-9a-f]{6}/gi);
  const color1 = colors[0];
  const color2 = colors[1];

  return `<svg width="1200" height="900" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad-${roll.name}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="1200" height="900" fill="url(#grad-${roll.name})" />
  <text x="600" y="450" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="white" text-anchor="middle" opacity="0.9">${roll.title}</text>
  <text x="600" y="520" font-family="Arial, sans-serif" font-size="32" fill="white" text-anchor="middle" opacity="0.7">Фото скоро появится</text>
</svg>`;
}

console.log('Генерация placeholder-изображений...\n');

rolls.forEach(roll => {
  const svg = generateSVG(roll, roll.gradient);
  const filePath = path.join(outputDir, `${roll.name}.svg`);
  fs.writeFileSync(filePath, svg, 'utf8');
  console.log(`✓ ${roll.name}.svg`);
});

console.log(`\nГотово! Создано ${rolls.length} файлов в ${outputDir}`);
console.log('\nСледующий шаг: обновите seed.ts с путями к изображениям');
