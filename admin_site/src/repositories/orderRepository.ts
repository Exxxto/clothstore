import { pool } from "../db";

export interface OrderFilters {
  limit?: number;
  status?: string;
  search?: string;
}

const ORDER_SELECT = `
  o.id,
  o.user_id,
  o.status,
  o.total_amount,
  o.customer_name,
  o.phone,
  o.email,
  o.delivery_address,
  o.payment_method,
  o.payment_status,
  o.payment_provider,
  o.payment_reference,
  o.paid_at,
  o.delivery_method,
  o.carrier,
  o.tracking_number,
  o.shipped_at,
  o.comment,
  o.is_test,
  o.test_run_id,
  o.source,
  o.created_at,
  o.updated_at,
  COALESCE(u.last_name || ' ' || u.first_name || COALESCE(' ' || u.middle_name, ''), o.customer_name) AS customer_display_name,
  u.email AS user_email
`;

export async function findAllOrders(filters: OrderFilters = {}) {
  const limit = Math.min(filters.limit ?? 100, 500);
  const conditions: string[] = [];
  const params: Array<string | number> = [limit];

  if (filters.status && filters.status !== "all") {
    conditions.push(`o.status = $${params.length + 1}`);
    params.push(filters.status);
  }

  if (filters.search?.trim()) {
    conditions.push(`(
      o.customer_name ILIKE $${params.length + 1}
      OR o.email ILIKE $${params.length + 1}
      OR o.phone ILIKE $${params.length + 1}
    )`);
    params.push(`%${filters.search.trim()}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const { rows } = await pool.query(
    `SELECT ${ORDER_SELECT},
            COUNT(oi.id)::int AS items_count
     FROM orders o
     LEFT JOIN users u ON u.id = o.user_id
     LEFT JOIN order_items oi ON oi.order_id = o.id
     ${whereClause}
     GROUP BY o.id, u.id, u.last_name, u.first_name, u.middle_name, u.email
     ORDER BY o.created_at DESC
     LIMIT $1`,
    params
  );
  return rows;
}

export async function findOrderById(id: number) {
  const { rows: orderRows } = await pool.query(
    `SELECT ${ORDER_SELECT}
     FROM orders o
     LEFT JOIN users u ON u.id = o.user_id
     WHERE o.id = $1`,
    [id]
  );

  if (orderRows.length === 0) return null;

  const { rows: itemRows } = await pool.query(
    `SELECT id, order_id, product_id, product_name, product_price, quantity, size, created_at
     FROM order_items
     WHERE order_id = $1
     ORDER BY id ASC`,
    [id]
  );

  return { ...orderRows[0], items: itemRows, items_count: itemRows.length };
}

export async function findOrderStatusById(id: number) {
  const { rows } = await pool.query(
    "SELECT id, status FROM orders WHERE id = $1",
    [id]
  );
  return rows[0] ?? null;
}

export async function updateOrderStatus(id: number, status: string) {
  const { rows } = await pool.query(
    `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2
     RETURNING id, status, updated_at`,
    [status, id]
  );
  return rows[0] ?? null;
}

export async function insertOrderStatusHistory(params: {
  orderId: number;
  previousStatus: string;
  nextStatus: string;
  adminId: number | null;
  note: string;
}) {
  await pool.query(
    `INSERT INTO order_status_history (order_id, previous_status, next_status, admin_id, note)
     VALUES ($1, $2, $3, $4, $5)`,
    [params.orderId, params.previousStatus, params.nextStatus, params.adminId, params.note]
  );
}

export async function updateOrderPayment(
  id: number,
  data: { payment_status: string; payment_provider: string | null; payment_reference: string | null }
) {
  const { rows } = await pool.query(
    `UPDATE orders
     SET payment_status = $1::varchar,
         payment_provider = $2::varchar,
         payment_reference = $3::varchar,
         paid_at = CASE
           WHEN $1::varchar = 'paid' AND paid_at IS NULL THEN NOW()
           WHEN $1::varchar <> 'paid' THEN NULL
           ELSE paid_at
         END,
         updated_at = NOW()
     WHERE id = $4
     RETURNING id, payment_status, payment_provider, payment_reference, paid_at, updated_at`,
    [data.payment_status, data.payment_provider, data.payment_reference, id]
  );
  return rows[0] ?? null;
}

export async function updateOrderFulfillment(
  id: number,
  data: { carrier: string | null; tracking_number: string | null; shipped_at: Date | null }
) {
  const { rows } = await pool.query(
    `UPDATE orders
     SET carrier = $1, tracking_number = $2, shipped_at = $3, updated_at = NOW()
     WHERE id = $4
     RETURNING id, carrier, tracking_number, shipped_at, updated_at`,
    [data.carrier, data.tracking_number, data.shipped_at, id]
  );
  return rows[0] ?? null;
}
