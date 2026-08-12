import { z } from "zod";

// Схемы валидации для заказов
export const CreateOrderSchema = z.object({
  source: z.string().min(1),
  lines: z.array(z.object({
    itemId: z.number().positive(),
    qty: z.number().min(1).max(100)
  })).min(1),
  guestId: z.number().positive().optional(),
  tableNumber: z.string().optional(),
  promocode: z.string().optional(),
  bonus: z.number().min(0).optional(),
  deliveryFee: z.number().min(0).optional(),
  paymentType: z.string().optional(),
  modifiers: z.record(z.number()).optional(),
  modifierNames: z.record(z.string()).optional(),
  payments: z.array(z.object({
    type: z.string(),
    amount: z.number().min(0)
  })).optional()
});

export const UpdateOrderSchema = z.object({
  id: z.number().positive().optional(),
  lineId: z.number().positive().optional(),
  status: z.enum(["NEW", "COOKING", "READY", "DONE", "CANCELLED"]),
  note: z.string().optional()
});

// Схемы для авторизации
export const LoginSchema = z.object({
  login: z.string().min(1),
  password: z.string().min(4)
});

export const RegisterGuestSchema = z.object({
  name: z.string().min(2),
  phone: z.string().regex(/^\+?[0-9\s\-()]+$/),
  email: z.string().email().optional(),
  birthday: z.number().optional(),
  gender: z.string().optional()
});

// Схемы для меню
export const CreateItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().min(0),
  cost: z.number().min(0),
  categoryId: z.number().positive(),
  stock: z.number().min(0).optional(),
  dailyLimit: z.number().min(0).optional(),
  cookingMinutes: z.number().min(1).optional(),
  workshop: z.string().optional(),
  photo: z.string().optional(),
  allergens: z.string().optional(),
  nutrition: z.string().optional(),
  calories: z.number().min(0).optional()
});

export const UpdateItemSchema = CreateItemSchema.partial().extend({
  id: z.number().positive()
});

// Схемы для склада
export const StockMovementSchema = z.object({
  type: z.enum(["Приход", "Списание", "Возврат", "Инвентаризация", "Автосписание"]),
  ingredientId: z.number().positive(),
  quantity: z.number(),
  reason: z.string().optional(),
  price: z.number().min(0).optional(),
  supplierId: z.number().positive().optional()
});

// Схемы для техкарт
export const RecipeIngredientSchema = z.object({
  itemId: z.number().positive(),
  ingredientId: z.number().positive(),
  grams: z.number().min(0)
});

// Утилита для валидации
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join(", ");
      return { success: false, error: messages };
    }
    return { success: false, error: "Ошибка валидации" };
  }
}
