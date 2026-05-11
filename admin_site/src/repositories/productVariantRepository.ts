import { pool } from "../db";

export interface VariantFilters {
  product_id?: number;
  search?: string;
  active?: string;
}

export async function findAllVariants(filters: VariantFilters = {}) {
  const conditions: string[] = [];
  const params: Array<string | number | boolean> = [];

  if (filters.product_id) {
    params.push(filters.product_id);
    conditions.push(`pv.product_id = $${params.length}`);
  }

  if (filters.active && filters.active !== "all") {
    params.push(filters.active === "true");
    conditions.push(`pv.is_active = $${params.length}`);
  }

  if (filters.search?.trim()) {
    params.push(`%${filters.search.trim()}%`);
    conditions.push(`(
      p.name ILIKE $${params.length}
      OR pv.variant_name ILIKE $${params.length}
      OR pv.sku ILIKE $${params.length}
      OR COALESCE(pv.size, '') ILIKE $${params.length}
      OR COALESCE(pv.color, '') ILIKE $${params.length}
    )`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const { rows } = await pool.query(
    `SELECT pv.id, pv.product_id, pv.sku, pv.variant_name, pv.size, pv.color,
            pv.barcode, pv.price, pv.old_price, pv.cost_price, pv.stock_tracking,
            pv.is_active, pv.auto_generated, pv.attributes, pv.created_at, pv.updated_at,
            p.name AS product_name, p.gender AS product_gender, p.type AS product_type,
            COALESCE(SUM(sb.quantity_on_hand), 0)::int AS total_stock,
            COALESCE(SUM(sb.quantity_reserved), 0)::int AS total_reserved
     FROM product_variants pv
     INNER JOIN products p ON p.id = pv.product_id
     LEFT JOIN stock_balances sb ON sb.product_variant_id = pv.id
     ${whereClause}
     GROUP BY pv.id, p.id
     ORDER BY p.name ASC, pv.id ASC`,
    params
  );
  return rows;
}

export async function findVariantById(id: number) {
  const { rows } = await pool.query(
    `SELECT pv.*, p.name AS product_name, p.gender AS product_gender, p.type AS product_type
     FROM product_variants pv
     INNER JOIN products p ON p.id = pv.product_id
     WHERE pv.id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function findVariantBalances(variantId: number) {
  const { rows } = await pool.query(
    `SELECT sb.id, sb.warehouse_id, sb.product_variant_id, sb.quantity_on_hand,
            sb.quantity_reserved, sb.reorder_point, sb.updated_at,
            w.name AS warehouse_name, w.code AS warehouse_code
     FROM stock_balances sb
     INNER JOIN warehouses w ON w.id = sb.warehouse_id
     WHERE sb.product_variant_id = $1
     ORDER BY w.name ASC`,
    [variantId]
  );
  return rows;
}

export async function findProductById(id: number) {
  const { rows } = await pool.query("SELECT id, name FROM products WHERE id = $1", [id]);
  return rows[0] ?? null;
}

export async function findVariantPriceById(id: number) {
  const { rows } = await pool.query(
    "SELECT id, product_id, price, old_price FROM product_variants WHERE id = $1",
    [id]
  );
  return rows[0] ?? null;
}

export async function createVariant(data: {
  product_id: number;
  sku: string;
  variant_name: string;
  size: string | null;
  color: string | null;
  barcode: string | null;
  price: number;
  old_price: number | null;
  cost_price: number | null;
  stock_tracking: boolean;
  is_active: boolean;
  attributes: Record<string, unknown>;
}) {
  const { rows } = await pool.query(
    `INSERT INTO product_variants
       (product_id, sku, variant_name, size, color, barcode, price, old_price,
        cost_price, stock_tracking, is_active, auto_generated, attributes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, FALSE, $12)
     RETURNING *`,
    [
      data.product_id, data.sku, data.variant_name, data.size, data.color,
      data.barcode, data.price, data.old_price, data.cost_price,
      data.stock_tracking, data.is_active, data.attributes,
    ]
  );
  return rows[0];
}

export async function initVariantStockBalances(variantId: number) {
  await pool.query(
    `INSERT INTO stock_balances (warehouse_id, product_variant_id, quantity_on_hand, quantity_reserved, reorder_point, updated_at)
     SELECT w.id, $1, 0, 0, 0, NOW()
     FROM warehouses w
     ON CONFLICT (warehouse_id, product_variant_id) DO NOTHING`,
    [variantId]
  );
}

export async function updateVariant(
  id: number,
  data: {
    variant_name: string;
    size: string | null;
    color: string | null;
    barcode: string | null;
    sku: string;
    price: number;
    old_price: number | null;
    cost_price: number | null;
    stock_tracking: boolean;
    is_active: boolean;
    attributes: Record<string, unknown>;
  }
) {
  const { rows } = await pool.query(
    `UPDATE product_variants
     SET variant_name=$1, size=$2, color=$3, barcode=$4, sku=$5, price=$6,
         old_price=$7, cost_price=$8, stock_tracking=$9, is_active=$10,
         attributes=$11, updated_at=NOW()
     WHERE id=$12
     RETURNING *`,
    [
      data.variant_name, data.size, data.color, data.barcode, data.sku,
      data.price, data.old_price, data.cost_price, data.stock_tracking,
      data.is_active, data.attributes, id,
    ]
  );
  return rows[0] ?? null;
}

export async function deactivateVariant(id: number) {
  const { rows } = await pool.query(
    `UPDATE product_variants SET is_active=FALSE, updated_at=NOW()
     WHERE id=$1 RETURNING id, sku`,
    [id]
  );
  return rows[0] ?? null;
}
