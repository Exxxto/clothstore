import { pool } from "../db";

export async function findAllPromoCodes() {
  const { rows } = await pool.query(
    `SELECT pc.id, pc.code, pc.description, pc.discount_type, pc.discount_value,
            pc.min_order_amount, pc.max_discount_amount, pc.starts_at, pc.ends_at,
            pc.usage_limit, pc.usage_count, pc.is_active, pc.created_at, pc.updated_at,
            COUNT(pcr.id)::int AS redemptions_count
     FROM promo_codes pc
     LEFT JOIN promo_code_redemptions pcr ON pcr.promo_code_id = pc.id
     GROUP BY pc.id
     ORDER BY pc.created_at DESC, pc.id DESC`
  );
  return rows;
}

export interface PromoCodeData {
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  starts_at: string | null;
  ends_at: string | null;
  usage_limit: number | null;
  is_active: boolean;
}

export async function createPromoCode(data: PromoCodeData) {
  const { rows } = await pool.query(
    `INSERT INTO promo_codes
       (code, description, discount_type, discount_value, min_order_amount,
        max_discount_amount, starts_at, ends_at, usage_limit, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      data.code, data.description, data.discount_type, data.discount_value,
      data.min_order_amount, data.max_discount_amount, data.starts_at,
      data.ends_at, data.usage_limit, data.is_active,
    ]
  );
  return rows[0];
}

export async function updatePromoCode(id: number, data: PromoCodeData) {
  const { rows } = await pool.query(
    `UPDATE promo_codes
     SET code=$1, description=$2, discount_type=$3, discount_value=$4,
         min_order_amount=$5, max_discount_amount=$6, starts_at=$7,
         ends_at=$8, usage_limit=$9, is_active=$10, updated_at=NOW()
     WHERE id=$11
     RETURNING *`,
    [
      data.code, data.description, data.discount_type, data.discount_value,
      data.min_order_amount, data.max_discount_amount, data.starts_at,
      data.ends_at, data.usage_limit, data.is_active, id,
    ]
  );
  return rows[0] ?? null;
}

export async function deletePromoCode(id: number) {
  const { rows } = await pool.query(
    "DELETE FROM promo_codes WHERE id=$1 RETURNING id, code",
    [id]
  );
  return rows[0] ?? null;
}
