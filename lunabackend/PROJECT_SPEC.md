# Техническое задание: Система управления рестораном "Луна"

## Обзор проекта

**Проект**: CRM-система для ресторана с сайтом доставки  
**Стек**: Next.js 16.3 (App Router), React 19, TypeScript, Prisma, SQLite  
**Статус**: В разработке (основной функционал реализован)

## Архитектура

### Frontend
- **Next.js 16.3** с App Router (не Pages Router!)
- **React 19** - server components по умолчанию, 'use client' для интерактивности
- **TypeScript** для типобезопасности
- **Tailwind CSS** с кастомной дизайн-системой

### Backend
- **Next.js API Routes** (app/api)
- **Prisma ORM** с SQLite (dev), PostgreSQL (production)
- **JWT** для авторизации (библиотека jsonwebtoken)
- **bcryptjs** для хеширования паролей
- **Socket.io** для real-time обновлений (планируется)

### База данных
- **SQLite** (dev) - `luna/prisma/prisma/dev.db`
- **PostgreSQL** (production) - готов для миграции
- **Prisma** - ORM и миграции

## Реализованные модули

### 1. Административная панель (CRM)
**Путь**: `/admin`  
**Файлы**: `luna/app/admin/**`

#### Авторизация
- **Путь**: `/admin/login`
- **Файл**: `luna/app/admin/login/page.tsx`
- **API**: `luna/app/api/auth/login/route.ts`
- **Функции**: `authenticate()`, `createSession()` из `luna/lib/auth.ts`
- **Cookie**: `luna_session` (JWT, 7 дней)

#### Роли и доступ
**Файл**: `luna/lib/auth.ts` - функция `canAccess(role, section)`

Роли и их разделы:
```typescript
Владелец: все разделы
Управляющий: все разделы
Кассир: dashboard, orders, guests, hall, shifts
Повар: dashboard, recipes
Кладовщик: dashboard, stock, suppliers
Маркетолог: dashboard, guests, loyalty, reports
```

#### Guard-функция
**Файл**: `luna/app/api/admin/control/route.ts`
```typescript
async function guard(entity = "dashboard") {
  const user = await currentUser();
  if (!user) return { error: NextResponse.json({ error: "Не авторизован" }, { status: 401 }) };
  if (!canAccess(user.role, sectionFor(entity))) 
    return { error: NextResponse.json({ error: "Недостаточно прав" }, { status: 403 }) };
  return { user };
}
```

#### Текущий пользователь
**Файл**: `luna/lib/auth.ts` - `currentUser()`
- Проверяет `luna_access_token` (15 мин)
- Fallback на `luna_session` (обратная совместимость)
- Автоматически обновляет через `luna_refresh_token` (7 дней)

### 2. Сайт доставки (публичный)

#### Меню
- **Путь**: `/menu`
- **Файл**: `luna/app/menu/page.tsx`
- **API**: `/api/items`, `/api/categories`
- **Функции**: 
  - Каталог блюд с фото и ценами
  - Фильтрация по категориям
  - Поиск по названию
  - Корзина (localStorage)
  - Sticky навигация

#### Авторизация гостей
- **Путь**: `/auth`
- **Файл**: `luna/app/auth/page.tsx`
- **API**: `/api/auth/login`, `/api/auth/register`
- **Хранение**: localStorage (`guestToken`, `guestId`)
- **Режимы**: вход / регистрация в одной форме

#### Оформление заказа
- **Путь**: `/checkout`
- **Файл**: `luna/app/checkout/page.tsx`
- **API**: `/api/orders` (POST), `/api/guests/[id]/addresses`
- **Функции**:
  - Выбор адреса доставки
  - Добавление нового адреса
  - Списание бонусов (до 50% суммы)
  - Способ оплаты (карта/наличные)
  - Комментарий к заказу

#### Личный кабинет
- **Путь**: `/profile`
- **Файл**: `luna/app/profile/page.tsx`
- **API**: `/api/guests/[id]`, `/api/guests/[id]/orders`, `/api/guests/[id]/bonuses`
- **Вкладки**:
  - Мои заказы (история)
  - История бонусов (начисления/списания)
  - Адреса доставки

#### Отслеживание заказа
- **Путь**: `/orders/[id]`
- **Файл**: `luna/app/orders/[id]/page.tsx`
- **API**: `/api/orders/[id]`
- **Функции**:
  - Real-time статус (опрос каждые 10 сек)
  - Прогресс-бар с этапами
  - Состав заказа
  - Адрес доставки
  - Расчётное время

## API Endpoints

### Авторизация
```typescript
POST /api/auth/login
Body: { login: string, password: string }
Response: { user: { id, name, role } }
Cookie: luna_session

POST /api/auth/register
Body: { name, phone, password, email? }
Response: { token, guest }
```

### Гости
```typescript
GET /api/guests/[id]
Headers: Authorization: Bearer <token>
Response: { id, name, phone, email, bonuses, segment, createdAt }

GET /api/guests/[id]/orders
Response: Order[]

GET /api/guests/[id]/bonuses
Response: BonusTransaction[]

GET /api/guests/[id]/addresses
Response: Address[]

POST /api/guests/[id]/addresses
Body: { label, street, building, apartment?, ... }
Response: Address
```

### Заказы
```typescript
POST /api/orders
Body: { guestId, items: [{itemId, qty, price}], addressId, bonusesToUse?, paymentMethod, comment?, source }
Response: Order

GET /api/orders/[id]
Headers: Authorization: Bearer <token>
Response: Order с lines и item данными
```

### Меню
```typescript
GET /api/items
Response: Item[] { id, name, price, photo, description, category }

GET /api/categories
Response: Category[] { id, name, icon }
```

### Административные
```typescript
GET /api/admin/control?section=<section>
Response: данные для конкретного раздела админки
Требует: авторизацию через luna_session cookie
```

## Дизайн-система

### Палитра (warm amber/caramel)
```css
/* Фоны */
--bg-paper: #F6F1E8        /* основной фон */
--bg-surface: #FBF7EF      /* карточки */
--bg-white: #FFFFFF        /* белые блоки */
--bg-tint: #F0E3D0         /* мягкий акцент */

/* Акценты */
--accent: #C8853F          /* amber - кнопки, ссылки */
--accent-hover: #A86B2C    /* caramel - hover состояния */

/* Границы и линии */
--border: #E2D9C8          /* тёплые границы */

/* Текст */
--text: #1F2421            /* основной текст (чернила) */
--text-muted: #8A8A80      /* вторичный текст */

/* Контраст */
--dark: #2A2723            /* тёмный блок для контраста */
```

### Типографика
```css
/* Заголовки */
font-family: 'DM Serif Display', serif;  /* или Roboto Slab 700, Fraunces 600-700 */
font-weight: 600-700;
font-style: italic для акцента;
color: #C8853F для выделения фраз;

/* Текст и UI */
font-family: 'Inter', sans-serif;
font-weight: 400-600;
```

### Компоненты
```tsx
// Кнопка (primary)
className="rounded-full bg-[#C8853F] px-6 py-3 font-medium text-white transition hover:bg-[#A86B2C]"

// Кнопка (secondary)
className="rounded-full border border-[#C8853F] px-6 py-3 font-medium text-[#C8853F] transition hover:bg-[#F0E3D0]"

// Карточка
className="rounded-2xl border border-[#E2D9C8] bg-white p-6 shadow-lg"

// Инпут
className="w-full rounded-lg border border-[#E2D9C8] bg-[#FBF7EF] p-3 text-[#1F2421] outline-none transition focus:border-[#C8853F] focus:ring-2 focus:ring-[#F0E3D0]"

// Навигация (sticky)
className="sticky top-0 z-50 border-b border-[#E2D9C8] bg-[#FBF7EF]/95 backdrop-blur-md"
```

## Схема базы данных

### Основные таблицы

#### User (админ-пользователи)
```prisma
model User {
  id           Int       @id @default(autoincrement())
  login        String    @unique
  passwordHash String
  name         String
  role         String    // Владелец, Управляющий, Кассир, etc.
  active       Boolean   @default(true)
  createdAt    DateTime  @default(now())
}
```

#### Guest (клиенты)
```prisma
model Guest {
  id        Int       @id @default(autoincrement())
  phone     String    @unique
  name      String
  email     String?
  password  String
  bonuses   Int       @default(0)
  segment   String    @default("Новый")
  active    Boolean   @default(true)
  createdAt DateTime  @default(now())
}
```

#### Order (заказы)
```prisma
model Order {
  id          Int          @id @default(autoincrement())
  number      String       @unique
  guestId     Int?
  guest       Guest?       @relation(fields: [guestId], references: [id])
  status      String       @default("NEW")  // NEW, CONFIRMED, COOKING, READY, DELIVERING, DELIVERED, CANCELLED
  total       Float
  source      String       // "Сайт", "Телефон", "Зал"
  tableNumber String?      // адрес доставки или номер столика
  paymentMethod String?
  comment     String?
  createdAt   DateTime     @default(now())
  readyAt     DateTime?
  lines       OrderLine[]
}
```

#### OrderLine (позиции заказа)
```prisma
model OrderLine {
  id      Int   @id @default(autoincrement())
  orderId Int
  order   Order @relation(fields: [orderId], references: [id])
  itemId  Int
  item    Item  @relation(fields: [itemId], references: [id])
  qty     Int
  price   Float
}
```

#### Item (блюда)
```prisma
model Item {
  id          Int     @id @default(autoincrement())
  name        String
  categoryId  Int?
  category    Category? @relation(fields: [categoryId], references: [id])
  price       Float
  photo       String?
  description String?
  active      Boolean @default(true)
}
```

#### Address (адреса доставки)
```prisma
model Address {
  id        Int     @id @default(autoincrement())
  guestId   Int
  guest     Guest   @relation(fields: [guestId], references: [id])
  label     String  // "Дом", "Работа", etc.
  street    String
  building  String
  apartment String?
  entrance  String?
  floor     String?
  intercom  String?
  comment   String?
  isDefault Boolean @default(false)
}
```

#### BonusTransaction (история бонусов)
```prisma
model BonusTransaction {
  id        Int      @id @default(autoincrement())
  guestId   Int
  guest     Guest    @relation(fields: [guestId], references: [id])
  amount    Int      // положительное = начисление, отрицательное = списание
  type      String   // "accrual", "deduction"
  reason    String   // "Заказ #123", "Списание по заказу #456"
  orderId   Int?
  createdAt DateTime @default(now())
}
```

## Безопасность

### Аутентификация
1. **Админ-панель**: JWT в HttpOnly cookie `luna_session` (7 дней)
2. **Гости**: JWT Bearer token в localStorage (клиент) + `guestToken`
3. **Пароли**: bcrypt с salt rounds = 10

### Авторизация
1. **Ролевой доступ**: функция `canAccess(role, section)` проверяет права
2. **Guard middleware**: функция `guard()` проверяет авторизацию в каждом API эндпоинте
3. **Гостевые API**: проверка Bearer token из заголовка Authorization

### Cookies
```typescript
httpOnly: true                           // защита от XSS
secure: process.env.NODE_ENV === "production"  // только HTTPS в проде
sameSite: "lax"                          // защита от CSRF
path: "/"
maxAge: 7 * 24 * 60 * 60                // 7 дней
```

## Структура проекта

```
luna-project/
├── luna/                           # Next.js приложение
│   ├── app/
│   │   ├── admin/                 # CRM админ-панель
│   │   │   ├── login/page.tsx     # вход в админку
│   │   │   └── section.tsx        # компонент раздела
│   │   ├── auth/page.tsx          # авторизация гостей
│   │   ├── menu/page.tsx          # каталог меню
│   │   ├── checkout/page.tsx      # оформление заказа
│   │   ├── profile/page.tsx       # личный кабинет
│   │   ├── orders/[id]/page.tsx   # отслеживание заказа
│   │   └── api/                   # API routes
│   │       ├── auth/              # авторизация
│   │       ├── admin/             # административные API
│   │       ├── guests/            # гостевые API
│   │       ├── orders/            # заказы
│   │       ├── items/             # меню
│   │       └── categories/        # категории
│   ├── lib/
│   │   ├── auth.ts                # JWT, авторизация, роли
│   │   ├── db.ts                  # Prisma client
│   │   ├── schemas.ts             # Zod схемы валидации
│   │   ├── idempotency.ts         # идемпотентность API
│   │   └── socket.ts              # Socket.io (планируется)
│   ├── prisma/
│   │   ├── schema.prisma          # схема БД
│   │   └── prisma/dev.db          # SQLite БД
│   └── types/
│       └── index.ts               # TypeScript типы
├── .dockerignore
├── Dockerfile                      # Docker образ
├── docker-compose.yml              # Docker Compose конфигурация
├── MIGRATION_GUIDE.md              # руководство по миграции
├── PROGRESS.md                     # прогресс разработки
└── README.md                       # основная документация
```

## Запуск проекта

### Development
```bash
cd luna
npm install
npm run dev
# http://localhost:3000
```

### Создание админа
```bash
cd luna
node create-admin.js
# Логин: admin1, Пароль: admin123456, Роль: Владелец
```

### Docker
```bash
docker-compose up -d
# http://localhost:3000
```

### Тестовые данные

**Админ-пользователи** (пароль у всех: `luna123`):
- `owner` - Владелец (полный доступ)
- `manager` - Управляющий (полный доступ)
- `cashier` - Кассир (orders, guests, hall, shifts)
- `cook` - Повар (recipes)
- `stock` - Кладовщик (stock, suppliers)
- `marketing` - Маркетолог (guests, loyalty, reports)

## Следующие шаги (TODO)

### Критичные задачи
1. **Socket.io интеграция** для real-time обновлений заказов
2. **Payment gateway** интеграция (Stripe/Yookassa)
3. **Email/SMS** уведомления (заказ принят, готов, в пути)
4. **Тесты** (Jest, React Testing Library)

### Функции
1. **Админ-панель разделы**:
   - Dashboard с аналитикой
   - Управление меню (CRUD блюд)
   - Управление заказами (статусы, назначение)
   - Управление гостями (сегментация, бонусы)
   - Склад и поставщики
   - Финансы и отчёты
   - Настройки системы

2. **Сайт доставки**:
   - Избранное (localStorage)
   - Промокоды
   - Онлайн-оплата
   - Push-уведомления
   - Рейтинги и отзывы

3. **Мобильное приложение**:
   - React Native или Flutter
   - Использует существующие API

### Оптимизации
1. **Производительность**:
   - Redis для кеширования
   - Image optimization (Next.js Image)
   - Bundle size анализ

2. **SEO**:
   - Meta tags
   - Open Graph
   - Sitemap
   - Robots.txt

3. **Мониторинг**:
   - Sentry для ошибок
   - Analytics (Google Analytics / Yandex Metrica)
   - Логирование (Winston/Pino)

## Контакты и поддержка

Для вопросов и предложений по проекту обращайтесь к разработчику.

---

**Последнее обновление**: 2026-08-13  
**Версия**: 0.2.0  
**Статус**: В активной разработке
