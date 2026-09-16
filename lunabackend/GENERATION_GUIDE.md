# Пошаговая инструкция по генерации изображений для меню Luna

## Шаг 1: Уточнить состав авторских роллов

Свяжитесь с поваром/заказчиком и получите полный состав для:
- **Адак шик** — `adak-shik.webp`
- **Кико** — `kiko.webp`
- **То-токи** — `to-toki.webp`
- **Япошка** — `yaposhka.webp`

Для каждого нужно:
- Ингредиенты внутри (рыба, овощи, сыр)
- Внешняя обсыпка или обёртка
- Соусы и шапочка (если есть)
- Способ приготовления (холодный, запечённый, темпура)
- Количество кусочков
- Пример реальной подачи

## Шаг 2: Выбрать AI-генератор

Рекомендуемые сервисы:
- **Midjourney** (лучшее качество фуд-фотографии) — midjourney.com
- **DALL-E 3** (через ChatGPT Plus) — chat.openai.com
- **Stable Diffusion** (бесплатно, нужна настройка) — stability.ai

## Шаг 3: Сгенерировать изображения

### Для каждого ролла:

1. Откройте файл `IMAGE_GENERATION_PROMPTS.md`
2. Скопируйте **общий промпт** (начало файла)
3. Добавьте **индивидуальный промпт** для конкретного ролла
4. Вставьте в генератор
5. Выберите лучший вариант из 4 предложенных
6. Скачайте в разрешении 1200×900 (4:3)

### Пример для Midjourney:

```
Professional food photography, sushi roll on matte black ceramic plate, dark graphite background, soft side lighting, 35-45 degree angle, visible cross-section. Roll occupies 75-80% of frame. Realistic textures of rice, fish, nori and cheese. No text, logos, watermarks, hands, chopsticks or extra decor. No moon or stars on photo. Image size 1200x900 (4:3), composition suitable for 1:1 crop.

Atlantika roll: salmon, cream cheese, tobiko caviar, fresh cucumber. Clean cut with distinguishable ingredients, natural caviar texture.

--ar 4:3 --style raw --v 6
```

## Шаг 4: Обработать изображения

Для каждого изображения:

1. **Проверить качество:**
   - Разрешение 1200×900 пикселей
   - Композиция подходит для квадратного кропа
   - Нет обрезанных частей порции
   - Нет текста, водяных знаков, дефектов

2. **Конвертировать в WebP:**
   ```bash
   # Установить ImageMagick или использовать онлайн конвертер
   convert atlantika.jpg -quality 85 atlantika.webp
   ```
   Или онлайн: cloudconvert.com/jpg-to-webp

3. **Оптимизировать размер (до 200 КБ):**
   ```bash
   # Уменьшить качество при необходимости
   convert atlantika.webp -quality 75 atlantika.webp
   ```

4. **Переименовать по списку:**
   - `atlantika.webp`
   - `imperiya.webp`
   - `inari.webp`
   - `tigrovye.webp`
   - `shakhmat.webp`
   - `adak-shik.webp`
   - `kiko.webp`
   - `to-toki.webp`
   - `yaposhka.webp`
   - `philadelphia-baked.webp`
   - `skala.webp`
   - `oysi.webp`
   - `yaki-crab.webp`
   - `yaki-salmon.webp`
   - `yaki-mussels.webp`
   - `philadelphia-hot.webp`
   - `warm-shrimp.webp`
   - `sushi-pizza.webp`
   - `sandwich-roll.webp`

## Шаг 5: Загрузить в проект

Скопируйте все 19 файлов `.webp` в:
```
C:\Users\BYRANBAI\Desktop\luna-project\luna\public\images\menu\
```

## Шаг 6: Обновить базу данных

Запустите скрипт обновления:
```bash
cd C:\Users\BYRANBAI\Desktop\luna-project\luna
node scripts/update-menu-photos.js
```

Или вручную обновите `prisma/seed.ts` — добавьте пути к фото:
```typescript
photo: '/images/menu/atlantika.webp'
```

Затем перезаполните базу:
```bash
npm run db:seed
```

## Шаг 7: Проверить результат

1. Запустите dev-сервер:
   ```bash
   npm run dev
   ```

2. Откройте меню:
   ```
   http://localhost:3000/menu
   ```

3. Проверьте:
   - Все 43 ролла имеют изображения
   - Изображения загружаются корректно
   - Кроп 1:1 выглядит хорошо
   - Нет битых ссылок

## Шаг 8: Согласование с поваром

Перед публикацией покажите изображения повару для подтверждения:
- Соответствие состава
- Правильная подача
- Количество кусочков

## Чек-лист готовности

- [ ] Получен состав 4 авторских роллов
- [ ] Сгенерированы 19 изображений
- [ ] Все файлы конвертированы в WebP
- [ ] Размер каждого файла < 200 КБ
- [ ] Файлы скопированы в `luna/public/images/menu/`
- [ ] База данных обновлена
- [ ] Изображения проверены в браузере
- [ ] Повар подтвердил соответствие
- [ ] Урегулированы права на фото "Суши Восток"

## Примечания

- **Не генерируйте концепты как финальные фото** — если состав неизвестен, сначала уточните
- **Не добавляйте лишние ингредиенты** — только то, что в описании
- **Единый стиль серии** — все фото должны выглядеть как одна съёмка
- **Для коммерческого использования** — проверьте лицензию сгенерированных изображений

---

**Готово!** После выполнения всех шагов все 43 ролла будут иметь профессиональные фотографии в едином стиле.
