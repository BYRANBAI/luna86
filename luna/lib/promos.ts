import { CAFE_INFO } from "./cafe";

// Акции и полезные блоки в шапке меню.
// Чтобы добавить новую — допишите объект в массив, вёрстка подхватит автоматически.
export type PromoAction =
  | { kind: "tab"; value: "cart" | "orders" | "profile"; label: string }
  | { kind: "tel"; value: string; label: string }
  | { kind: "map"; label: string };

export type Promo = {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  action?: PromoAction;
};

export const PROMOS: Promo[] = [
  {
    id: "delivery",
    badge: "АКЦИЯ",
    title: "Бесплатная доставка\nот 1 000 ₽",
    subtitle: "Заказывайте онлайн — привезём горячим",
  },
  {
    id: "bonuses",
    badge: "БОНУСЫ",
    title: "Копите бонусы\nс каждого заказа",
    subtitle: "Списывайте их при оформлении следующего",
    action: { kind: "tab", value: "profile", label: "Войти" },
  },
  {
    id: "booking",
    badge: "СТОЛИК",
    title: "Забронируйте стол\nзаранее",
    subtitle: `Звоните ${CAFE_INFO.phone}`,
    action: { kind: "tel", value: CAFE_INFO.phoneHref, label: "Позвонить" },
  },
  {
    id: "address",
    badge: "МЫ ЗДЕСЬ",
    title: CAFE_INFO.address.replace(", г. Покачи", ""),
    subtitle: "Будни 10:00–23:00 · Выходные 10:00–24:00",
    action: { kind: "map", label: "На карте" },
  },
];
