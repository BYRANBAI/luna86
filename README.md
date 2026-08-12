# 🌙 Luna Café — Цифровая экосистема

Полноценная платформа управления кафе с POS, CRM, киоском, доставкой и аналитикой.

---

## 📋 Содержание

- [Возможности](#возможности)
- [Технологии](#технологии)
- [Архитектура](#архитектура)
- [Быстрый старт](#быстрый-старт)
- [Модули](#модули)
- [API](#api)
- [Деплой](#деплой)

---

## ✨ Возможности

### Для гостей
- 🍽️ **Меню** — каталог блюд с фото, категориями, аллергенами
- 🛒 **Заказ онлайн** — доставка, самовывоз, в зале
- 💳 **Оплата** — карта, СБП, бонусы, наличные
- 🎁 **Лояльность** — бонусы, промокоды, уровни
- 📱 **Мобильное приложение** — PWA для iOS/Android

### Для персонала
- 💻 **POS-терминал** — схема зала, быстрый ввод заказа
- 🍳 **KDS (кухонный экран)** — очередь заказов по цехам
- 🏪 **Киоск самообслуживания** — для ресторанов быстрого питания
- 📦 **Склад** — учет ингредиентов, поставщики, автосписание
- 📊 **Техкарты** — рецепты, фудкост, калькуляция

### Для управления
- 📈 **CRM** — база гостей, сегментация, RFM-анализ
- 💰 **Финансы** — P&L, расходы, зарплаты
- 📉 **Аналитика** — продажи, топ блюд, часы пик
- 🚚 **Доставка** — зоны, курьеры, трекинг
- 👥 **Персонал** — смены, табель, аудит действий

---

## 🛠 Технологии

### Backend
- **Framework**: Next.js 16 (App Router + API Routes)
- **Database**: PostgreSQL 16 + Prisma ORM
- **Real-time**: Socket.io (WebSocket)
- **Validation**: Zod
- **Auth**: JWT (Access + Refresh tokens)

### Frontend
- **Framework**: React 19 + TypeScript
- **Styling**: Tailwind CSS 4
- **Charts**: Recharts
- **State**: React hooks + WebSocket

### DevOps
- **Container**: Docker + Docker Compose
- **Desktop**: Electron (для Windows/macOS/Linux)
- **Deploy**: Node.js standalone

### Планируемые интеграции
- 💳 **Эквайринг**: ЮKassa, CloudPayments
- 📟 **Фискализация**: АТОЛ, Orange Data (54-ФЗ)
- 📱 **SMS**: Twilio, SMSC
- 📲 **Push**: Firebase Cloud Messaging
- 🚚 **Доставка**: Яндекс.Доставка
- 📊 **1С**: выгрузка для бухгалтерии

---

## 🏗 Архитектура

```
luna-project/
├── docker-compose.yml          # PostgreSQL + Adminer
├── PROGRESS.md                 # Текущий прогресс разработки
├── MIGRATION_GUIDE.md          # Инструкция по миграции БД
│
└── luna/                       # Основное приложение
    ├── app/                    # Next.js App Router
    │   ├── page.tsx           # Главная страница
    │   ├── admin/             # CRM / Admin панель
    │   ├── pos/               # POS-терминал
    │   ├── kiosk/             # Киоск самообслуживания
    │   ├── kds/               # Kitchen Display System
    │   ├── api/               # REST API
    │   │   ├── orders/        # CRUD заказов
    │   │   ├── auth/          # Авторизация
    │   │   └── state/         # Текущее состояние (WebSocket)
    │   └── [slug]/            # Гостевые страницы
    │       ├── menu/          # Меню и заказ
    │       ├── queue/         # Электронная очередь
    │       └── cds/           # Customer Display System
    │
    ├── lib/                    # Утилиты
    │   ├── db.ts              # Prisma client
    │   ├── auth.ts            # JWT + роли
    │   ├── socket.ts          # WebSocket сервер
    │   ├── useSocket.ts       # React хуки для WS
    │   ├── schemas.ts         # Zod валидация
    │   └── idempotency.ts     # Защита от дублей
    │
    ├── types/                  # TypeScript типы
    │   └── index.ts
    │
    ├── prisma/
    │   ├── schema.prisma      # Схема БД (32 модели)
    │   └── seed.ts            # Тестовые данные
    │
    ├── electron/              # Electron обертка (desktop)
    ├── public/                # Статика
    ├── server.js              # Custom server (WebSocket)
    └── package.json
```

---

## 🚀 Быстрый старт

### Требования
- Node.js 20+
- PostgreSQL 16 (или Docker)
- npm/yarn/pnpm

### 1. Клонирование
```bash
git clone <repo-url>
cd luna-project
```

### 2. База данных

#### Вариант A: Docker (рекомендуется)
```bash
docker-compose up -d postgres
```

#### Вариант B: Локальная PostgreSQL
```bash
psql -U postgres
CREATE DATABASE luna_db;
CREATE USER luna WITH PASSWORD 'luna123';
GRANT ALL PRIVILEGES ON DATABASE luna_db TO luna;
\q
```

### 3. Установка и запуск
```bash
cd luna

# Установить зависимости
npm install

# Скопировать .env
cp .env.example .env

# Применить схему БД
npm run db:push

# Заполнить тестовыми данными
npm run db:seed

# Запустить dev сервер (с WebSocket)
npm run dev
```

Откройте http://localhost:3000

### 4. Тестовые аккаунты

**Admin:**
- Логин: `admin`
- Пароль: `admin`

**Кассир:**
- Логин: `cashier`
- Пароль: `cashier`

---

## 📦 Модули

### 1. Главная страница (/)
Презентация платформы с демо всех модулей.

### 2. Гостевой сайт (/menu)
- Каталог блюд с категориями
- Корзина с промокодами
- Онлайн-заказ
- Оплата картой/бонусами

### 3. Киоск (/kiosk)
- Режим привлечения (attract mode)
- Здесь/С собой
- Апсейл (допродажи)
- Автосброс через 20 сек

### 4. POS-терминал (/pos)
- Визуальная схема зала
- Быстрый ввод заказа
- Поиск гостя + бонусы
- Смешанная оплата
- Разделение счета
- Брони
- Оффлайн-режим (в разработке)

### 5. KDS — Кухонный экран (/kds)
- Фильтр по цехам (Горячий, Холодный, Бар)
- SLA-таймеры готовки
- Статусы позиций
- Техкарты по тапу

### 6. CRM / Admin (/admin)
16 секций управления:
- **Dashboard** — метрики, графики, топ блюд
- **Меню** — CRUD блюд, категорий, модификаторов
- **Техкарты** — рецепты, ингредиенты, фудкост
- **Склад** — остатки, движение, инвентаризация
- **Поставщики** — контакты, заявки
- **Заказы** — список, фильтры, статусы
- **Доставка** — зоны, курьеры, тарифы
- **Гости** — CRM, сегменты, история
- **Лояльность** — бонусы, промокоды, акции
- **Зал** — столики, брони, схемы
- **Персонал** — роли, права, зарплаты
- **Смены** — открытие/закрытие, кассовые операции
- **Отчеты** — продажи, фудкост, персонал
- **Финансы** — P&L, расходы, прогнозы
- **Настройки** — график, контакты, SEO
- **Аудит** — логи всех действий

### 7. Очередь (/queue)
Электронная очередь с номерами заказов.

### 8. CDS (/cds)
Customer Display System — экран покупателя (в разработке).

---

## 🔌 API

### База URL
```
http://localhost:3000/api
```

### Авторизация

**POST /api/auth/login**
```json
{
  "login": "admin",
  "password": "admin"
}
```

Response: устанавливает cookies `luna_access_token` и `luna_refresh_token`.

**POST /api/auth/logout**
Очищает токены.

### Заказы

**GET /api/orders**
Список заказов (можно фильтровать по статусу).

**POST /api/orders**
Создать заказ (с идемпотентностью).

Headers:
```
Content-Type: application/json
Idempotency-Key: unique-key-123
```

Body:
```json
{
  "source": "Киоск",
  "lines": [
    { "itemId": 1, "qty": 2 }
  ],
  "guestId": 1,
  "promocode": "LUNA10",
  "bonus": 100,
  "paymentType": "Карта"
}
```

**PATCH /api/orders**
Обновить статус заказа.
```json
{
  "id": 123,
  "status": "COOKING",
  "note": "Без лука"
}
```

### Меню

**GET /api/menu**
Каталог блюд с категориями.

**POST /api/menu**
Создать блюдо (требуется авторизация).

### WebSocket

Подключение: `ws://localhost:3000`

События:
- `subscribe:orders` — подписка на заказы
- `subscribe:stock` — подписка на склад
- `subscribe:menu` — подписка на меню
- `order:update` — новый/изменение заказа
- `stock:update` — изменение остатков
- `menu:update` — изменение меню/стоп-лист

---

## 📊 База данных

### Модели (32 таблицы)

**Меню:**
- Category, Item, Modifier, ModifierGroup, ModifierOption

**Техкарты:**
- Ingredient, RecipeIngredient, RecipeVersion

**Склад:**
- StockMovement, PurchaseRequest, Supplier

**Заказы:**
- Order, OrderLine, Payment, OrderStatusHistory, OrderCancellation

**Гости:**
- Guest, BonusRule, Promocode, Promotion, Campaign

**Доставка:**
- DeliveryZone, Courier

**Зал:**
- Hall, DiningTable, Reservation

**Персонал:**
- User, Shift, TimeEntry, AuditLog

**Финансы:**
- Expense, FinancialTransaction, Combo

**Настройки:**
- Setting, ItemSchedule

**Служебные:**
- IdempotencyKey (защита от дублей)

---

## 🔒 Безопасность

### Реализовано
- ✅ JWT авторизация (Access + Refresh tokens)
- ✅ Zod валидация всех API запросов
- ✅ Транзакции БД (защита от race conditions)
- ✅ Идемпотентность (защита от дублей)
- ✅ bcrypt для паролей
- ✅ httpOnly cookies для токенов

### В планах
- ⏳ Rate limiting
- ⏳ CORS настройка для production
- ⏳ Helmet.js для HTTP headers
- ⏳ Input sanitization (XSS защита)

---

## 🐳 Деплой

### Docker

```bash
# Собрать образ
docker build -t luna-cafe .

# Запустить с PostgreSQL
docker-compose up -d
```

### Production

```bash
# Билд
npm run build

# Запуск
NODE_ENV=production npm start
```

Переменные окружения для production:
```bash
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_ACCESS_SECRET=strong-secret-here
JWT_REFRESH_SECRET=another-strong-secret
SESSION_SECRET=session-secret
NODE_ENV=production
```

---

## 📱 Мобильное приложение

**PWA** (прогрессивное веб-приложение):
- Работает на iOS/Android через браузер
- Можно установить на главный экран
- Оффлайн-поддержка (в разработке)

**Нативное приложение** (в планах):
- React Native или Flutter
- Push-уведомления
- Deeplinks

---

## 🧪 Тесты

```bash
# Unit тесты (в разработке)
npm test

# E2E тесты (в разработке)
npm run test:e2e
```

---

## 📈 Прогресс разработки

**Текущая готовность: ~65%**

См. [PROGRESS.md](PROGRESS.md) для детального отчета.

### Готово
- ✅ База данных (PostgreSQL)
- ✅ Транзакции и валидация
- ✅ WebSocket real-time
- ✅ JWT авторизация
- ✅ Все UI модули (CRM, POS, Киоск, KDS)
- ✅ Типизация TypeScript

### В разработке
- 🔄 Интеграция платежей (ЮKassa)
- 🔄 Оффлайн-режим POS
- 🔄 Рефакторинг больших компонентов
- 🔄 Unit-тесты

### Запланировано
- ⏳ Telegram-бот
- ⏳ Фискализация (54-ФЗ)
- ⏳ ЕГАИС / Честный знак
- ⏳ 1С интеграция
- ⏳ Агрегаторы доставки
- ⏳ Продвинутая аналитика

---

## 🤝 Команда

Проект разработан для демонстрации современного full-stack стека.

---

## 📄 Лицензия

MIT

---

## 🔗 Полезные ссылки

- [Техническое задание](tz_cafe_luna.docx)
- [Прогресс разработки](PROGRESS.md)
- [Гайд по миграции](MIGRATION_GUIDE.md)
- [Prisma документация](https://www.prisma.io/docs)
- [Next.js документация](https://nextjs.org/docs)
