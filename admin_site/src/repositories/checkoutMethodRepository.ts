import { pool } from "../db";

export async function findAllShippingMethods() {
  const { rows } = await pool.query(
    `SELECT id, code, name, description, price, sort_order, is_active, created_at, updated_at
     FROM shipping_methods ORDER BY sort_order ASC, id ASC`
  );
  return rows;
}

export async function findAllPaymentMethods() {
  const { rows } = await pool.query(
    `SELECT id, code, name, description, requires_card, sort_order, is_active, created_at, updated_at
     FROM payment_methods ORDER BY sort_order ASC, id ASC`
  );
  return rows;
}

export interface ShippingMethodData {
  code: string;
  name: string;
  description: string | null;
  price: number;
  sort_order: number;
  is_active: boolean;
}

export interface PaymentMethodData {
  code: string;
  name: string;
  description: string | null;
  requires_card: boolean;
  sort_order: number;
  is_active: boolean;
}

export async function createShippingMethod(data: ShippingMethodData) {
  const { rows } = await pool.query(
    `INSERT INTO shipping_methods (code, name, description, price, sort_order, is_active)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [data.code, data.name, data.description, data.price, data.sort_order, data.is_active]
  );
  return rows[0];
}

export async function updateShippingMethod(id: number, data: ShippingMethodData) {
  const { rows } = await pool.query(
    `UPDATE shipping_methods
     SET code=$1, name=$2, description=$3, price=$4, sort_order=$5, is_active=$6, updated_at=NOW()
     WHERE id=$7 RETURNING *`,
    [data.code, data.name, data.description, data.price, data.sort_order, data.is_active, id]
  );
  return rows[0] ?? null;
}

export async function deleteShippingMethod(id: number) {
  const { rows } = await pool.query(
    "DELETE FROM shipping_methods WHERE id=$1 RETURNING id, code, name",
    [id]
  );
  return rows[0] ?? null;
}

export async function createPaymentMethod(data: PaymentMethodData) {
  const { rows } = await pool.query(
    `INSERT INTO payment_methods (code, name, description, requires_card, sort_order, is_active)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [data.code, data.name, data.description, data.requires_card, data.sort_order, data.is_active]
  );
  return rows[0];
}

export async function updatePaymentMethod(id: number, data: PaymentMethodData) {
  const { rows } = await pool.query(
    `UPDATE payment_methods
     SET code=$1, name=$2, description=$3, requires_card=$4, sort_order=$5, is_active=$6, updated_at=NOW()
     WHERE id=$7 RETURNING *`,
    [data.code, data.name, data.description, data.requires_card, data.sort_order, data.is_active, id]
  );
  return rows[0] ?? null;
}

export async function deletePaymentMethod(id: number) {
  const { rows } = await pool.query(
    "DELETE FROM payment_methods WHERE id=$1 RETURNING id, code, name",
    [id]
  );
  return rows[0] ?? null;
}
