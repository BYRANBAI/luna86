import type {
  User,
  Guest,
  Order,
  OrderLine,
  Item,
  Category,
  Ingredient,
  RecipeIngredient,
  Payment,
  StockMovement,
  DiningTable,
  Hall,
  Reservation,
  Courier,
  Promocode,
  Supplier,
  Shift,
  TimeEntry,
  AuditLog,
  Setting,
  Modifier,
  ModifierGroup,
  ModifierOption,
  OrderStatusHistory,
  DeliveryZone
} from "@prisma/client";

// Расширенные типы с include
export type OrderWithDetails = Order & {
  lines: (OrderLine & { item: Item })[];
  guest?: Guest | null;
  statusHistory: OrderStatusHistory[];
  payments: Payment[];
};

export type ItemWithDetails = Item & {
  category: Category;
  ingredients: (RecipeIngredient & { ingredient: Ingredient })[];
  modifiers: Modifier[];
  modifierGroups: (ModifierGroup & { options: ModifierOption[] })[];
};

export type IngredientWithMovements = Ingredient & {
  movements: StockMovement[];
};

export type HallWithTables = Hall & {
  tables: DiningTable[];
  reservations: Reservation[];
};

export type ReservationWithDetails = Reservation & {
  hall: Hall;
  table?: DiningTable | null;
};

export type UserWithDetails = User & {
  shifts: Shift[];
  timeEntries: TimeEntry[];
  auditLogs: AuditLog[];
};

// Типы для API responses
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Типы для состояния приложения
export interface AppState {
  orders: OrderWithDetails[];
  items: ItemWithDetails[];
  guests: Guest[];
  categories: Category[];
  halls?: HallWithTables[];
  deliveryZones?: DeliveryZone[];
  promocodes?: Promocode[];
  suppliers?: Supplier[];
}

// Типы для WebSocket событий
export interface SocketEvents {
  "order:update": OrderWithDetails;
  "stock:update": { itemId: number; stock?: number };
  "menu:update": { type: "item" | "category"; id: number };
}

// Типы для форм
export interface LoginForm {
  login: string;
  password: string;
}

export interface OrderForm {
  source: string;
  lines: { itemId: number; qty: number }[];
  guestId?: number;
  tableNumber?: string;
  promocode?: string;
  bonus?: number;
  deliveryFee?: number;
  paymentType?: string;
}

export interface ItemForm {
  name: string;
  description?: string;
  price: number;
  cost: number;
  categoryId: number;
  stock?: number;
  dailyLimit?: number;
  cookingMinutes?: number;
  workshop?: string;
  photo?: string;
  allergens?: string;
  nutrition?: string;
  calories?: number;
  active?: boolean;
}

export interface GuestForm {
  name: string;
  phone: string;
  email?: string;
  birthday?: number;
  gender?: string;
}

// Типы для отчетов
export interface RevenueReport {
  date: string;
  revenue: number;
  orders: number;
  averageCheck: number;
}

export interface FoodCostReport {
  itemId: number;
  itemName: string;
  cost: number;
  price: number;
  margin: number;
  foodCostPercent: number;
}

export interface StaffReport {
  userId: number;
  userName: string;
  hours: number;
  revenue: number;
  ordersCount: number;
  salary: number;
}

// Типы для метрик дашборда
export interface DashboardMetrics {
  revenue: number;
  revenue7: RevenueReport[];
  active: number;
  foodCost: number;
  occupied: number;
  tables: number;
  topItems: { id: number; name: string; count: number }[];
  lowStock: { id: number; name: string; stock: number }[];
}

// Utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncResult<T> = Promise<T | null>;

// Константы
export const ORDER_STATUSES = ["NEW", "COOKING", "READY", "DONE", "CANCELLED"] as const;
export const PAYMENT_TYPES = ["Карта", "Наличные", "СБП", "Бонусы", "Онлайн"] as const;
export const STOCK_MOVEMENT_TYPES = ["Приход", "Списание", "Возврат", "Инвентаризация", "Автосписание"] as const;
export const USER_ROLES = ["Владелец", "Управляющий", "Кассир", "Повар", "Кладовщик", "Маркетолог", "Курьер"] as const;

export type OrderStatus = typeof ORDER_STATUSES[number];
export type PaymentType = typeof PAYMENT_TYPES[number];
export type StockMovementType = typeof STOCK_MOVEMENT_TYPES[number];
export type UserRole = typeof USER_ROLES[number];

// Экспорт Prisma типов
export type {
  User,
  Guest,
  Order,
  OrderLine,
  Item,
  Category,
  Ingredient,
  RecipeIngredient,
  Payment,
  StockMovement,
  DiningTable,
  Hall,
  Reservation,
  Courier,
  Promocode,
  Supplier,
  Shift,
  TimeEntry,
  AuditLog,
  Setting,
  Modifier,
  ModifierGroup,
  ModifierOption,
  OrderStatusHistory,
  DeliveryZone
};
