import { pool } from "../db";

export async function findAllWarehouses() {
  const { rows } = await pool.query(
    `SELECT w.id, w.name, w.code, w.city, w.address, w.is_active,
            w.created_at, w.updated_at,
            COUNT(sb.id)::int AS balances_count,
            COALESCE(SUM(sb.quantity_on_hand), 0)::int AS total_items
     FROM warehouses w
     LEFT JOIN stock_balances sb ON sb.warehouse_id = w.id
     GROUP BY w.id
     ORDER BY w.name ASC`
  );
  return rows;
}

export async function createWarehouse(data: {
  name: string;
  code: string;
  city: string | null;
  address: string | null;
  is_active: boolean;
}) {
  const { rows } = await pool.query(
    `INSERT INTO warehouses (name, code, city, address, is_active)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, code, city, address, is_active, created_at, updated_at`,
    [data.name, data.code, data.city, data.address, data.is_active]
  );
  return rows[0];
}

export async function initWarehouseStockBalances(warehouseId: number) {
  await pool.query(
    `INSERT INTO stock_balances (warehouse_id, product_variant_id, quantity_on_hand, quantity_reserved, reorder_point, updated_at)
     SELECT $1, pv.id, 0, 0, 0, NOW()
     FROM product_variants pv
     ON CONFLICT (warehouse_id, product_variant_id) DO NOTHING`,
    [warehouseId]
  );
}

export async function updateWarehouse(
  id: number,
  data: { name: string; code: string; city: string | null; address: string | null; is_active: boolean }
) {
  const { rows } = await pool.query(
    `UPDATE warehouses
     SET name=$1, code=$2, city=$3, address=$4, is_active=$5, updated_at=NOW()
     WHERE id=$6
     RETURNING id, name, code, city, address, is_active, created_at, updated_at`,
    [data.name, data.code, data.city, data.address, data.is_active, id]
  );
  return rows[0] ?? null;
}

export async function deleteWarehouse(id: number) {
  const { rows } = await pool.query(
    "DELETE FROM warehouses WHERE id=$1 RETURNING id, name, code",
    [id]
  );
  return rows[0] ?? null;
}
