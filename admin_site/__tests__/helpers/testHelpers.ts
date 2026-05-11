/**
 * testHelpers.ts
 * Вспомогательные утилиты для интеграционных тестов.
 */
import { pool } from "../../src/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "siluet_admin_secret_key_2024";

// ─── Генерация токена без обращения к БД ────────────────────────────────────

export function generateAdminToken(overrides: Partial<{
  id: number;
  username: string;
  role: string;
  full_name: string;
}> = {}): string {
  const payload = {
    id: overrides.id ?? 9999,
    username: overrides.username ?? "test_admin",
    full_name: overrides.full_name ?? "Тест Тестов",
    role: overrides.role ?? "admin",
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
}

// ─── Работа с тестовыми данными в БД ────────────────────────────────────────

/** Создаёт тестового администратора и возвращает его id. */
export async function createTestAdmin(params: {
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}): Promise<number> {
  const hash = await bcrypt.hash(params.password, 10);
  const { rows } = await pool.query(
    `INSERT INTO admins (username, password_hash, first_name, last_name, is_active)
     VALUES ($1, $2, $3, $4, TRUE)
     ON CONFLICT (username) DO UPDATE
       SET password_hash = EXCLUDED.password_hash,
           is_active = TRUE
     RETURNING id`,
    [params.username, hash, params.firstName ?? "Тест", params.lastName ?? "Тестов"]
  );
  return rows[0].id as number;
}

/** Удаляет тестового администратора по username. */
export async function deleteTestAdmin(username: string): Promise<void> {
  await pool.query("DELETE FROM admins WHERE username = $1", [username]);
}

/** Создаёт тестовый продукт и возвращает его id. */
export async function createTestProduct(params: {
  name?: string;
  price?: number;
  gender?: string;
  type?: string;
  season?: string;
}): Promise<number> {
  const { rows } = await pool.query(
    `INSERT INTO products (name, price, gender, type, season, is_new, sizes, description)
     VALUES ($1, $2, $3, $4, $5, FALSE, '{}', '')
     RETURNING id`,
    [
      params.name ?? "Тестовый товар",
      params.price ?? 1000,
      params.gender ?? "men",
      params.type ?? "Футболка",
      params.season ?? "all",
    ]
  );
  return rows[0].id as number;
}

/** Удаляет тестовый продукт по id. */
export async function deleteTestProduct(id: number): Promise<void> {
  await pool.query("DELETE FROM product_variants WHERE product_id = $1", [id]);
  await pool.query("DELETE FROM products WHERE id = $1", [id]);
}

/** Создаёт тестовый промокод и возвращает его id. */
export async function createTestPromoCode(params: {
  code: string;
  discountType?: "percent" | "fixed";
  discountValue?: number;
  minOrderAmount?: number;
  isActive?: boolean;
  endsAt?: string | null;
}): Promise<number> {
  const { rows } = await pool.query(
    `INSERT INTO promo_codes
       (code, discount_type, discount_value, min_order_amount, is_active, ends_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (code) DO UPDATE
       SET discount_type = EXCLUDED.discount_type,
           discount_value = EXCLUDED.discount_value,
           min_order_amount = EXCLUDED.min_order_amount,
           is_active = EXCLUDED.is_active,
           ends_at = EXCLUDED.ends_at
     RETURNING id`,
    [
      params.code.toUpperCase(),
      params.discountType ?? "percent",
      params.discountValue ?? 10,
      params.minOrderAmount ?? 0,
      params.isActive ?? true,
      params.endsAt ?? null,
    ]
  );
  return rows[0].id as number;
}

/** Удаляет тестовый промокод по коду. */
export async function deleteTestPromoCode(code: string): Promise<void> {
  await pool.query("DELETE FROM promo_codes WHERE UPPER(code) = UPPER($1)", [code]);
}

/** Очищает корзину по session_id. */
export async function clearCart(sessionId: string): Promise<void> {
  await pool.query(
    `DELETE FROM cart_items ci
     USING carts c
     WHERE ci.cart_id = c.id AND c.session_id = $1`,
    [sessionId]
  );
  await pool.query("DELETE FROM carts WHERE session_id = $1", [sessionId]);
}

/** Закрывает пул соединений после всех тестов. */
export async function closePool(): Promise<void> {
  await pool.end();
}
