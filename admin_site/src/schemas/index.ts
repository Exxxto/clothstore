import { z } from "zod";

// ---------------------------------------------------------------------------
// Общие переиспользуемые типы
// ---------------------------------------------------------------------------

/** Непустая строка после trim */
const nonEmptyString = (label: string) =>
  z.string({ required_error: `${label} обязателен` }).trim().min(1, `${label} не может быть пустым`);

/** Положительное число (принимает строку или число) */
const positiveNumber = (label: string) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number({ required_error: `${label} обязателен`, invalid_type_error: `${label} должен быть числом` }).positive(`${label} должен быть больше 0`)
  );

/** Неотрицательное число */
const nonNegativeNumber = (label: string) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number({ invalid_type_error: `${label} должен быть числом` }).min(0, `${label} не может быть отрицательным`)
  );

/** Опциональное число (null/undefined → undefined) */
const optionalNumber = () =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number().optional()
  );

/** Опциональная дата в виде ISO-строки */
const optionalDateString = (label: string) =>
  z
    .string()
    .trim()
    .refine((v) => !v || !Number.isNaN(new Date(v).getTime()), { message: `${label}: некорректная дата` })
    .optional()
    .nullable();

// ---------------------------------------------------------------------------
// Admins
// ---------------------------------------------------------------------------

export const CreateAdminSchema = z.object({
  last_name: nonEmptyString("Фамилия"),
  first_name: nonEmptyString("Имя"),
  middle_name: z.string().trim().optional().nullable(),
  username: nonEmptyString("Логин"),
  password: z
    .string({ required_error: "Пароль обязателен" })
    .min(6, "Пароль должен быть не менее 6 символов"),
});

export const UpdateAdminSchema = z.object({
  last_name: nonEmptyString("Фамилия"),
  first_name: nonEmptyString("Имя"),
  middle_name: z.string().trim().optional().nullable(),
  username: nonEmptyString("Логин"),
  is_active: z.boolean().optional().default(true),
});

export const ChangePasswordSchema = z.object({
  password: z
    .string({ required_error: "Пароль обязателен" })
    .min(6, "Пароль должен быть не менее 6 символов"),
});

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export const CreateUserSchema = z.object({
  last_name: nonEmptyString("Фамилия"),
  first_name: nonEmptyString("Имя"),
  middle_name: z.string().trim().optional().nullable(),
  email: z
    .string({ required_error: "Email обязателен" })
    .trim()
    .email("Укажите корректный email"),
  password: z
    .string({ required_error: "Пароль обязателен" })
    .min(6, "Пароль должен быть не менее 6 символов"),
  phone: z.string().trim().optional().nullable(),
});

export const UpdateUserSchema = z.object({
  last_name: nonEmptyString("Фамилия"),
  first_name: nonEmptyString("Имя"),
  middle_name: z.string().trim().optional().nullable(),
  email: z
    .string({ required_error: "Email обязателен" })
    .trim()
    .email("Укажите корректный email"),
  phone: z.string().trim().optional().nullable(),
  is_active: z.boolean().optional().default(true),
});

// ChangePasswordSchema переиспользуется для users тоже

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const CategorySchema = z.object({
  name: nonEmptyString("Название категории"),
  slug: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  is_active: z.boolean().optional().default(true),
});

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

export const CollectionSchema = z.object({
  name: nonEmptyString("Название коллекции"),
  slug: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  is_active: z.boolean().optional().default(true),
  sort_order: z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number().int().min(0).default(0)),
});

// ---------------------------------------------------------------------------
// Warehouses
// ---------------------------------------------------------------------------

export const WarehouseSchema = z.object({
  name: nonEmptyString("Название склада"),
  code: z.string().trim().optional().nullable(),
  city: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
  is_active: z.boolean().optional().default(true),
});

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

const PRODUCT_GENDERS = ["men", "women", "kids", "unisex"] as const;
const PRODUCT_SEASONS = ["spring", "summer", "autumn", "winter", "all"] as const;

export const ProductSchema = z.object({
  name: nonEmptyString("Название товара"),
  type: nonEmptyString("Тип товара"),
  gender: z
    .string({ required_error: "Пол товара обязателен" })
    .trim()
    .min(1, "Укажите пол товара"),
  price: positiveNumber("Цена"),
  old_price: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().positive("Старая цена должна быть больше 0").nullable().optional()
  ),
  image_url: z.string().trim().url("Некорректный URL изображения").optional().nullable(),
  season: z.enum(PRODUCT_SEASONS, { errorMap: () => ({ message: "Укажите корректный сезон" }) }),
  category_id: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().int().positive().nullable().optional()
  ),
  is_new: z.boolean().optional().default(false),
  sizes: z.array(z.string()).optional().default([]),
  description: z.string().trim().optional().default(""),
});

// ---------------------------------------------------------------------------
// Product Variants
// ---------------------------------------------------------------------------

export const CreateProductVariantSchema = z.object({
  product_id: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number({ required_error: "Товар обязателен" }).int().positive("Укажите корректный товар")
  ),
  variant_name: z.string().trim().optional().nullable(),
  size: z.string().trim().optional().nullable(),
  color: z.string().trim().optional().nullable(),
  barcode: z.string().trim().optional().nullable(),
  sku: z.string().trim().optional().nullable(),
  price: positiveNumber("Цена варианта"),
  old_price: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().positive().nullable().optional()
  ),
  cost_price: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().min(0).nullable().optional()
  ),
  stock_tracking: z.boolean().optional().default(true),
  is_active: z.boolean().optional().default(true),
  attributes: z.record(z.unknown()).optional().default({}),
});

export const UpdateProductVariantSchema = z.object({
  variant_name: z.string().trim().optional().nullable(),
  size: z.string().trim().optional().nullable(),
  color: z.string().trim().optional().nullable(),
  barcode: z.string().trim().optional().nullable(),
  sku: z.string().trim().optional().nullable(),
  price: positiveNumber("Цена варианта"),
  old_price: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().positive().nullable().optional()
  ),
  cost_price: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().min(0).nullable().optional()
  ),
  stock_tracking: z.boolean().optional().default(true),
  is_active: z.boolean().optional().default(true),
  attributes: z.record(z.unknown()).optional().default({}),
});

// ---------------------------------------------------------------------------
// Promo Codes
// ---------------------------------------------------------------------------

const DISCOUNT_TYPES = ["percent", "fixed"] as const;

export const PromoCodeSchema = z.object({
  code: nonEmptyString("Код промокода"),
  description: z.string().trim().optional().nullable(),
  discount_type: z.enum(DISCOUNT_TYPES, {
    errorMap: () => ({ message: "discount_type должен быть 'percent' или 'fixed'" }),
  }),
  discount_value: positiveNumber("Размер скидки"),
  min_order_amount: nonNegativeNumber("Минимальная сумма заказа").optional().default(0),
  max_discount_amount: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().positive().nullable().optional()
  ),
  starts_at: optionalDateString("Дата начала"),
  ends_at: optionalDateString("Дата окончания"),
  usage_limit: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().int().positive().nullable().optional()
  ),
  is_active: z.boolean().optional().default(true),
});

// ---------------------------------------------------------------------------
// Inventory (Stock Movements)
// ---------------------------------------------------------------------------

const MOVEMENT_TYPES = ["receipt", "sale", "adjustment", "return", "transfer_in", "transfer_out", "write_off"] as const;

export const StockMovementSchema = z.object({
  warehouse_id: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number({ required_error: "Склад обязателен" }).int().positive("Укажите корректный склад")
  ),
  product_variant_id: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number({ required_error: "Вариант товара обязателен" }).int().positive("Укажите корректный вариант товара")
  ),
  quantity_delta: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z
      .number({ required_error: "Количество обязательно" })
      .int("Количество должно быть целым числом")
      .refine((n) => n !== 0, "Количество не может быть равно нулю")
  ),
  movement_type: z.enum(MOVEMENT_TYPES, {
    errorMap: () => ({
      message: `Тип движения должен быть одним из: ${MOVEMENT_TYPES.join(", ")}`,
    }),
  }),
  reason: z.string().trim().optional().nullable(),
  reference_type: z.string().trim().optional().nullable(),
  reference_id: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().int().positive().nullable().optional()
  ),
  notes: z.string().trim().optional().nullable(),
});

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

const ORDER_STATUSES = ["new", "confirmed", "packing", "shipped", "completed", "cancelled"] as const;
const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"] as const;

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES, {
    errorMap: () => ({ message: "Укажите корректный статус заказа" }),
  }),
});

export const UpdateOrderPaymentSchema = z.object({
  payment_status: z.enum(PAYMENT_STATUSES, {
    errorMap: () => ({ message: "Укажите корректный статус оплаты" }),
  }),
  payment_provider: z.string().trim().optional().nullable(),
  payment_reference: z.string().trim().optional().nullable(),
});

export const UpdateOrderFulfillmentSchema = z.object({
  carrier: z.string().trim().optional().nullable(),
  tracking_number: z.string().trim().optional().nullable(),
  shipped_at: optionalDateString("Дата отправки"),
});

// ---------------------------------------------------------------------------
// Complaints
// ---------------------------------------------------------------------------

const COMPLAINT_STATUSES = ["new", "in_review", "resolved", "rejected"] as const;

export const CreateComplaintSchema = z.object({
  requester_name: nonEmptyString("Имя"),
  email: z
    .string({ required_error: "Email обязателен" })
    .trim()
    .email("Укажите корректный email"),
  phone: z.string().trim().optional().nullable(),
  order_number: z.string().trim().optional().nullable(),
  category: nonEmptyString("Категория жалобы"),
  message: nonEmptyString("Текст жалобы"),
});

export const UpdateComplaintStatusSchema = z.object({
  status: z.enum(COMPLAINT_STATUSES, {
    errorMap: () => ({ message: "Укажите корректный статус жалобы" }),
  }),
});

// ---------------------------------------------------------------------------
// Checkout Methods (Shipping & Payment)
// ---------------------------------------------------------------------------

export const ShippingMethodSchema = z.object({
  code: nonEmptyString("Код"),
  name: nonEmptyString("Название"),
  description: z.string().trim().optional().nullable(),
  price: nonNegativeNumber("Цена доставки").optional().default(0),
  sort_order: z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number().int().min(0).default(0)),
  is_active: z.boolean().optional().default(true),
});

export const PaymentMethodSchema = z.object({
  code: nonEmptyString("Код"),
  name: nonEmptyString("Название"),
  description: z.string().trim().optional().nullable(),
  requires_card: z.boolean().optional().default(false),
  sort_order: z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number().int().min(0).default(0)),
  is_active: z.boolean().optional().default(true),
});
