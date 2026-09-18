// Переводит новые фото пиццы и узбекской кухни в WebP 1200 px и удаляет исходные JPG из public.
// Оригиналы остаются в папке ассетов проекта.
// Запуск: node scripts/convert-new-photos.js
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const dir = path.join(__dirname, "..", "public", "images", "menu");

async function main() {
  const files = fs
    .readdirSync(dir)
    .filter((f) => /^(pizza|uzbek)-.*\.jpg$/.test(f));

  for (const file of files) {
    const src = path.join(dir, file);
    const out = src.replace(/\.jpg$/, ".webp");
    await sharp(src).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 82 }).toFile(out);
    const before = Math.round(fs.statSync(src).size / 1024);
    const after = Math.round(fs.statSync(out).size / 1024);
    fs.unlinkSync(src);
    console.log(`${file} ${before} KB -> ${path.basename(out)} ${after} KB`);
  }
  console.log(`Готово: ${files.length} файлов`);
}

main();
