# Сопоставление Luna Project с референсным дизайном

## 📊 Общий анализ

### Что реализовано ✅
Ваш проект **Luna** — это полноценная система доставки еды с CRM-админкой. Референсный дизайн показывает **мобильное приложение в стиле Foodie** (агрегатор ресторанов типа Delivery Club/Яндекс.Еда).

### Ключевые различия

| Аспект | Ваш проект | Референсный дизайн |
|--------|------------|-------------------|
| **Тип** | Сайт одного ресторана | Агрегатор ресторанов |
| **Платформа** | Next.js веб-приложение | Мобильное приложение |
| **Стиль** | Warm amber/caramel (#C8853F, #8b9dc3) | Яркий красно-розовый (#E91E63, #FF4081) |
| **Структура** | Одно меню | Список ресторанов → меню ресторана |
| **Навигация** | Desktop-first | Mobile-first с tab bar |

---

## 🎨 Визуальное сравнение по экранам

### 1. **Главная страница / Список ресторанов**

#### Референс показывает:
- **Заголовок**: адрес доставки + переключатель "Доставка/Самовывоз"
- **Поиск**: "Ресторан или блюдо" с иконкой поиска
- **Фильтры**: горизонтальный скролл (Кухня, Завтрак, Обед, Фастфуд)
- **Карточки ресторанов**:
  - Фото ресторана (широкоформатное)
  - Название ресторана
  - Описание кухни
  - Рейтинг (⭐ 4.5), ценовой сегмент (₽₽₽₽), время работы
  - Стоимость доставки + время

#### Ваша реализация (`/menu`):
```typescript
// ✅ ЕСТЬ:
- Поиск по блюдам
- Категорийные фильтры (Роллы, Бургеры, Салаты...)
- Sticky навигация
- Карточки товаров с фото

// ❌ НЕТ:
- Адрес доставки в хедере
- Переключатель доставка/самовывоз
- Списка ресторанов (у вас один ресторан)
- Рейтинга ресторана
```

**Рекомендация**: Ваш дизайн корректен для **одного ресторана**. Если нужен агрегатор — добавьте модель `Restaurant` и экран списка.

---

### 2. **Страница ресторана / Меню**

#### Референс показывает:
- **Hero-блок**: галерея фото ресторана (слайдер)
- **Шапка**:
  - Название ресторана
  - Ценовой сегмент, рейтинг, время работы
  - Кнопки: "Построить маршрут", "Заказать такси"
- **Табы**: Популярные, Набор суши, Промо товары
- **Карточки блюд**: 
  - Фото блюда
  - Название
  - Цена
  - Кнопка "+" (добавить в корзину)
  - Минимальная сумма заказа внизу
  - Большая кнопка "В корзину" (sticky)

#### Ваша реализация (`/menu`):
```typescript
// ✅ ЕСТЬ:
- Hero-баннер с акцией
- Категорийная навигация (sticky)
- Карточки блюд с фото и ценой
- Кнопки +/- для количества
- Sticky корзина внизу

// ❌ НЕТ:
- Галереи фото ресторана
- Кнопок "Построить маршрут" / "Заказать такси"
- Информации о минимальной сумме заказа (только в тексте)
- Ценового сегмента ₽₽₽₽
```

**Код сейчас:**
```tsx
// luna/app/menu/page.tsx:152
<div style={{borderRadius: 20, background: "linear-gradient(135deg, #a8b9d8 0%, #8b9dc3 100%)", ...}}>
  <div style={{color: "#fff", fontSize: 28, fontWeight: 900}}>
    БЕСПЛАТНАЯ ДОСТАВКА<br/>ОТ 1 000 ₽
  </div>
</div>
```

**Что добавить**:
1. Слайдер фото ресторана (можно через `react-slick` или Swiper)
2. Блок с ценовым сегментом и рейтингом
3. Кнопки интеграции с картами (Яндекс.Карты API)

---

### 3. **Карточка товара (модалка)**

#### Референс показывает:
- **Полноэкранная модалка** с:
  - Большое фото блюда (галерея если несколько)
  - Кнопки: назад, поделиться, избранное
  - Доставка 0-149 ₽, от 450 ₽, ~60 мин
  - Название блюда
  - Рейтинг + отзывы
  - Описание
  - Размеры (23 см, 30 см, 40 см) с выбором
  - Дополнительно: маслины +45 ₽, соус пронто +23 ₽
  - Количество (-, 1, +)
  - Большая кнопка "В корзину 450 ₽"

#### Ваша реализация:
```typescript
// ❌ НЕТ модального окна с деталями товара
// У вас товары добавляются сразу из карточки
```

**Рекомендация**: Добавьте модальное окно для товаров с:
```tsx
// Новый компонент: app/menu/ItemModal.tsx
interface ItemModalProps {
  item: Item;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (itemId: number, qty: number, options: any) => void;
}

// Функции:
- Выбор размера (если применимо)
- Выбор добавок (модификаторы)
- Галерея фото
- Полное описание
```

---

### 4. **Корзина**

#### Референс показывает:
- **Заголовок**: "Корзина (2)" — количество наименований
- **Табы**: Доставка, Самовывоз, Накрыть стол
- **Позиции**:
  - Фото блюда (маленькое)
  - Название
  - Размер (если есть)
  - Цена за единицу
  - Кнопки -, количество, +
- **Количество приборов**: отдельный контрол
- **Доставка**: 99 ₽
- **Что-то ещё?**: карусель рекомендаций
- **Итого**: большая кнопка "Оформить заказ 1119 ₽"

#### Ваша реализация (`/checkout`):
```typescript
// ✅ ЕСТЬ:
- Список товаров в корзине
- Кнопки +/-
- Выбор адреса доставки
- Способ оплаты
- Бонусы

// ❌ НЕТ:
- Табов доставка/самовывоз/накрыть стол
- Количества приборов
- Блока "Что-то ещё?" (upsell)
- Отдельной страницы корзины (у вас сразу checkout)
```

**Рекомендация**: Создайте отдельную страницу `/cart`:
```tsx
// app/cart/page.tsx
export default function CartPage() {
  return (
    <div>
      <h1>Корзина ({cartCount})</h1>
      <Tabs>
        <Tab label="Доставка" />
        <Tab label="Самовывоз" />
      </Tabs>
      {/* Список товаров */}
      {/* Upsell блок */}
      <Link href="/checkout">Оформить заказ</Link>
    </div>
  );
}
```

---

### 5. **Checkout / Оформление заказа**

#### Референс показывает:
- **Вход по телефону** (модалка)
- **Оформление заказа** (модалка поверх корзины)
- **Шаги**: адрес → оплата → подтверждение
- **Отслеживание**: карта с курьером, статус заказа

#### Ваша реализация (`/checkout`):
```typescript
// ✅ ЕСТЬ:
- Выбор адреса из списка
- Добавление нового адреса
- Использование бонусов (до 50%)
- Способ оплаты (карта/наличные)
- Комментарий к заказу

// ❌ НЕТ:
- Модального окна (у вас отдельная страница)
- Карты с курьером
- Real-time статуса заказа (есть опрос каждые 10 сек)
```

**Рекомендация**: Референс использует модалки для лучшего UX. Можете оставить страницу, но добавьте:
1. Прогресс-бар шагов (Адрес → Оплата → Готово)
2. Карту с маркером адреса (Яндекс.Карты)

---

### 6. **User Flow / Структура навигации**

#### Референс показывает:
```
Загрузка → Онбординг → [Первый раз]
                          ↓
                   Добавить адрес
                          ↓
Главная (список ресторанов) ← Tab Bar (Главная, Поиск, Корзина, Профиль)
    ↓
Ресторан (меню)
    ↓
Карточка товара
    ↓
Корзина
    ↓
Вход по телефону → Оформление заказа → Отслеживание
```

#### Ваша реализация:
```
/menu (главная) ← Header навигация (Главная, Войти, Корзина)
    ↓
Клик на товар → добавление в корзину (без модалки)
    ↓
/checkout (если не авторизован → /auth)
    ↓
/orders/[id] (отслеживание)

/profile (личный кабинет)
```

**Различие**: У вас **desktop-first** навигация (header), в референсе — **mobile tab bar**.

---

## 🎨 Цветовая схема и типографика

### Референсный дизайн:
```css
/* Основные цвета */
--primary: #E91E63; /* ярко-розовый */
--primary-dark: #C2185B;
--accent: #FF4081;
--background: #FFFFFF;
--surface: #F5F5F5;
--text: #212121;
--text-secondary: #757575;

/* Типографика */
font-family: 'Roboto', sans-serif;
/* Жирные заголовки (700-900) */
/* Обычный текст (400-500) */
```

### Ваш проект:
```css
/* Теплая amber/caramel палитра */
--bg-paper: #F6F1E8;
--accent: #C8853F; /* amber */
--accent-hover: #A86B2C; /* caramel */
--secondary: #8b9dc3; /* мягкий синий */

font-family: 'Inter', sans-serif;
/* Заголовки: DM Serif Display */
```

**Вывод**: Ваша палитра более **теплая и элегантная** (кафе/ресторан премиум-сегмента), референс — **яркая и молодёжная** (mass-market агрегатор).

---

## 🔧 Технические различия

### Референс (предположительно):
- **React Native** (мобильное приложение)
- **Нативные компоненты**: Tab Navigator, ScrollView, FlatList
- **Карты**: Google Maps SDK / Яндекс MapKit
- **Push-уведомления**: Firebase Cloud Messaging
- **Оплата**: SDK ЮKassa / Stripe

### Ваш проект:
- **Next.js 16.3** (веб-приложение)
- **React 19** (Server Components)
- **API Routes** (Next.js)
- **Prisma + SQLite/PostgreSQL**
- **JWT авторизация**

---

## 📋 Что нужно добавить для полного соответствия

### Критичные фичи (из референса):

1. **Модальные окна товаров**
   ```tsx
   // app/components/ItemModal.tsx
   - Большое фото
   - Выбор размера/модификаторов
   - Детальное описание
   ```

2. **Страница корзины** (отдельная от checkout)
   ```tsx
   // app/cart/page.tsx
   - Табы доставка/самовывоз
   - Upsell блок
   - Количество приборов
   ```

3. **Карта на странице отслеживания**
   ```tsx
   // app/orders/[id]/page.tsx
   import { YMaps, Map, Placemark } from '@pbe/react-yandex-maps';
   ```

4. **Tab Bar навигация** (для мобильной версии)
   ```tsx
   // app/components/TabBar.tsx
   <nav className="fixed bottom-0 w-full bg-white">
     <Link href="/">Главная</Link>
     <Link href="/search">Поиск</Link>
     <Link href="/cart">Корзина</Link>
     <Link href="/profile">Профиль</Link>
   </nav>
   ```

5. **Рейтинги и отзывы**
   ```prisma
   model Review {
     id        Int      @id @default(autoincrement())
     guestId   Int
     itemId    Int
     rating    Int      // 1-5
     comment   String?
     createdAt DateTime @default(now())
   }
   ```

6. **Онбординг** (для первого входа)
   ```tsx
   // app/onboarding/page.tsx
   - Слайды с преимуществами
   - Выбор адреса доставки
   ```

---

## 🎯 Рекомендации по приоритетам

### 🔥 Высокий приоритет (core UX):
1. ✅ Модальное окно товара (с модификаторами)
2. ✅ Страница корзины (отдельная)
3. ✅ Карта на tracking странице
4. ✅ Рейтинги и отзывы

### 🟡 Средний приоритет (nice-to-have):
5. Tab bar навигация (для мобильной версии)
6. Онбординг для новых пользователей
7. Upsell блок в корзине
8. Кнопки "Построить маршрут" / "Заказать такси"

### 🟢 Низкий приоритет (polish):
9. Анимации переходов
10. Скелетоны загрузки
11. Push-уведомления
12. Офлайн режим (PWA)

---

## 📐 Пример доработки: Модальное окно товара

```tsx
// app/components/ItemModal.tsx
'use client';
import { useState } from 'react';
import Image from 'next/image';

interface ItemModalProps {
  item: Item;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (qty: number, options: ModifierSelection) => void;
}

export default function ItemModal({ item, isOpen, onClose, onAddToCart }: ItemModalProps) {
  const [qty, setQty] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [modifiers, setModifiers] = useState<Record<number, boolean>>({});

  if (!isOpen) return null;

  const sizes = item.sizes || []; // [{ id: 1, label: "23 см", price: 450 }, ...]
  const availableModifiers = item.modifiers || []; // [{ id: 1, name: "Маслины", price: 45 }, ...]

  const totalPrice = (
    (selectedSize ? sizes.find(s => s.id === selectedSize)?.price : item.price) +
    Object.entries(modifiers).reduce((sum, [id, selected]) => 
      selected ? sum + (availableModifiers.find(m => m.id === +id)?.price || 0) : sum, 0
    )
  ) * qty;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center">
      <div className="bg-white w-full md:max-w-2xl md:rounded-t-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative h-64">
          <Image src={item.photo} alt={item.name} fill className="object-cover" />
          <button onClick={onClose} className="absolute top-4 left-4 bg-white rounded-full p-2">
            ← 
          </button>
          <button className="absolute top-4 right-12 bg-white rounded-full p-2">
            🔗
          </button>
          <button className="absolute top-4 right-4 bg-white rounded-full p-2">
            ❤️
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-sm text-gray-600 mb-2">
            Доставка 0-149 ₽ · от {item.price} ₽ · ~60 мин
          </div>
          
          <h2 className="text-2xl font-bold mb-2">{item.name}</h2>
          
          <div className="flex items-center gap-2 mb-4">
            <span>⭐ {item.rating || 4.8}</span>
            <span className="text-gray-600">({item.reviewCount || 134})</span>
          </div>

          <p className="text-gray-700 mb-6">{item.description}</p>

          {/* Sizes */}
          {sizes.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Размер</h3>
              <div className="flex gap-3">
                {sizes.map(size => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSize(size.id)}
                    className={`px-4 py-2 rounded-lg border-2 ${
                      selectedSize === size.id ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Modifiers */}
          {availableModifiers.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Дополнительно</h3>
              {availableModifiers.map(mod => (
                <label key={mod.id} className="flex items-center justify-between py-2">
                  <span>{mod.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600">{mod.price} ₽</span>
                    <input
                      type="checkbox"
                      checked={!!modifiers[mod.id]}
                      onChange={(e) => setModifiers({...modifiers, [mod.id]: e.target.checked})}
                    />
                  </div>
                </label>
              ))}
            </div>
          )}

          {/* Quantity */}
          <div className="flex items-center justify-between mb-6">
            <span className="font-semibold">Количество приборов</span>
            <div className="flex items-center gap-4 border rounded-lg">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2">−</button>
              <span className="font-bold">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="px-3 py-2">+</button>
            </div>
          </div>

          {/* Add to cart button */}
          <button
            onClick={() => {
              onAddToCart(qty, { size: selectedSize, modifiers });
              onClose();
            }}
            className="w-full bg-red-500 text-white py-4 rounded-xl font-bold text-lg"
          >
            В корзину · {totalPrice} ₽
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## ✅ Итоговый чеклист

### Структура приложения
- [ ] Добавить модель `Restaurant` (если нужен агрегатор)
- [x] Страница `/menu` (есть)
- [ ] Модальное окно товара
- [ ] Страница `/cart` (отдельная)
- [x] Страница `/checkout` (есть)
- [ ] Страница `/orders/[id]` с картой
- [ ] Tab bar навигация

### Функциональность
- [ ] Размеры товаров (пиццы: 23/30/40 см)
- [ ] Модификаторы (добавки)
- [ ] Количество приборов
- [ ] Рейтинги и отзывы
- [ ] Upsell блок в корзине
- [ ] Карта с курьером
- [ ] Построить маршрут (Яндекс.Карты)
- [ ] Онбординг

### Дизайн
- [ ] Решить: оставить теплую палитру ИЛИ перейти на яркую (как в референсе)
- [ ] Добавить анимации модалок
- [ ] Скелетоны загрузки
- [ ] Мобильная оптимизация (tab bar)

---

## 🚀 План внедрения (по дням)

### День 1: Модальное окно товара
1. Создать `app/components/ItemModal.tsx`
2. Добавить модели `ItemSize` и `ItemModifier` в Prisma
3. Обновить `app/menu/page.tsx` для открытия модалки

### День 2: Страница корзины
1. Создать `app/cart/page.tsx`
2. Перенести логику корзины из checkout
3. Добавить табы доставка/самовывоз
4. Добавить upsell блок

### День 3: Карта на tracking
1. Установить `@pbe/react-yandex-maps`
2. Обновить `app/orders/[id]/page.tsx`
3. Добавить API для получения координат курьера

### День 4: Рейтинги и отзывы
1. Добавить модель `Review` в Prisma
2. Создать API `/api/reviews`
3. Добавить компонент `ReviewList` в модалку товара

### День 5: Tab bar и мобильная оптимизация
1. Создать `app/components/TabBar.tsx`
2. Добавить медиа-запросы для мобильной версии
3. Протестировать на разных устройствах

---

**Готово!** Теперь у вас есть полный план для приведения проекта к референсному дизайну. 🎉
