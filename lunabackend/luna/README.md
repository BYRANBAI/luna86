# Луна — демонстрационный сайт цифровой экосистемы кафе

## Запуск

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

Откройте http://localhost:3000. Для production-проверки: `npm run build && npm run start`.

## Демо-маршруты

- `/` — презентация платформы и ссылки на ТЗ.
- `/menu` — гостевой сайт: меню, модификаторы, бонусы, доставка и создание заказа.
- `/order/[id]` — живая страница статуса конкретного заказа.
- `/kiosk` — полноэкранный киоск: здесь/с собой, меню, корзина, апсейл, оплата и номер заказа.
- `/crm` — меню, техкарты, складские документы, гости, отчёты и финансы.
- `/pos` — касса: схема зала, позиции, бонусы, смешанные платежи и чек.
- `/kds` — кухонный экран с цехами, SLA-таймером и готовностью отдельных позиций.
- `/queue` — электронная очередь «Готовится / Готово».
- `/cds` — экран покупателя.

Все экраны читают одну SQLite-базу через Prisma и обновляются polling-запросом каждые 2.5 секунды. Оплата в демо имитируется; создание заказа уменьшает остаток блюда и пишет автосписание ингредиентов в историю склада.

Удаление категории с блюдами запрещено: сначала удалите блюда или перенесите их в другую категорию. В CRM удаление категории и блюда требует подтверждения.

## Админ-панель

`/admin` — постоянная админ-панель с ролевым меню, дашбордом, меню, техкартами,
складом, поставщиками, заказами, доставкой, гостями, лояльностью, залом,
сотрудниками, отчётами, финансами, настройками и журналом действий.

Старый `/crm` перенаправляет на `/admin`. Демо-учётки:

| Логин | Роль | Пароль |
|---|---|---|
| `owner` | Владелец | `luna123` |
| `manager` | Управляющий | `luna123` |
| `cashier` | Кассир | `luna123` |
| `cook` | Повар | `luna123` |
| `stock` | Кладовщик | `luna123` |
| `marketing` | Маркетолог | `luna123` |

Сессия хранится в httpOnly-cookie, подпись берётся из `SESSION_SECRET`
(для dev используется безопасный локальный fallback). Права проверяются и в
интерфейсе, и на серверном `/api/admin/control`.

Дашборд считает топ блюд по фактическим строкам заказов за 7 дней, выручку по
дням, food cost, занятость столов, стоп-лист и дефицит номенклатуры относительно
индивидуального `minStock`. Seed создаёт историю заказов за 14 дней, поэтому
отчёты, RFM и P&L заполнены сразу после `npm run db:seed`.

В админке доступны редактор блюда `/admin/menu/[id]`, группы модификаторов,
расписания доступности, документы склада, заявки по дефициту, отмена заказов с
возвратом ингредиентов, брони, курьеры, промокоды, бонусные правила, финансы,
сотрудники с PIN, рабочее время, X/Z-отчёты, инкассация, редактор залов и столов,
слияние дублей гостей и CSV-экспорт отчётов. Изменение канала в настройках отражается в общем
`/api/state` и скрывает блюда на соответствующих гостевых каналах.
Раздел «Сотрудники» также содержит расчёт payroll за период: оклад или почасовая
ставка, процент от личной выручки, премия при выполнении плана среднего чека,
итог к выплате и экспорт `payroll.csv`; тот же отчёт доступен в разделе «Отчёты».
Складские списания валидируются по текущему остатку и возвращают понятную ошибку
при попытке списать больше доступного; заказы также не создаются при нехватке
ингредиентов, а текущие отрицательные остатки нормализованы до нуля.

Операционные экраны используют общую историю статусов заказов: KDS показывает
только новые и готовящиеся заказы, а POS и админка отображают статусы по-русски.
В меню и киоске можно ввести промокод и увидеть размер скидки до оформления;
скидка сохраняется в карточке заказа и фискальном чеке. POS поддерживает поиск
блюд, гостя, списание бонусов, смешанную оплату, печать чека и разделение счёта.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
