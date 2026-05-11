import { Router, Request, Response } from "express";
import logger from "../lib/logger";
import { pool, logAuditAction } from "../db";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { UpdateOrderStatusSchema, UpdateOrderPaymentSchema, UpdateOrderFulfillmentSchema } from "../schemas";

const router = Router();

router.use(requireAuth);

router.get("/", async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit || 100), 500);
  const { status, search } = req.query;

  try {
    const conditions: string[] = [];
    const params: Array<string | number> = [limit];

    if (typeof status === "string" && status && status !== "all") {
      conditions.push(`o.status = $${params.length + 1}`);
      params.push(status);
    }

    if (typeof search === "string" && search.trim()) {
      conditions.push(`(
        o.customer_name ILIKE $${params.length + 1}
        OR o.email ILIKE $${params.length + 1}
        OR o.phone ILIKE $${params.length + 1}
      )`);
      params.push(`%${search.trim()}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const { rows } = await pool.query(
      `SELECT o.id,
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
              u.email AS user_email,
              COUNT(oi.id)::int AS items_count
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       ${whereClause}
       GROUP BY o.id,
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
                u.id,
                u.last_name,
                u.first_name,
                u.middle_name,
                u.email
       ORDER BY o.created_at DESC
       LIMIT $1`,
      params
    );

    res.json(rows);
  } catch (err) {
    logger.error("Route error", { error: err });
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { rows: orderRows } = await pool.query(
      `SELECT o.id,
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
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       WHERE o.id = $1`,
      [req.params.id]
    );

    if (orderRows.length === 0) {
      return res.status(404).json({ error: "Заказ не найден" });
    }

    const { rows: itemRows } = await pool.query(
      `SELECT id,
              order_id,
              product_id,
              product_name,
              product_price,
              quantity,
              size,
              created_at
       FROM order_items
       WHERE order_id = $1
       ORDER BY id ASC`,
      [req.params.id]
    );

    res.json({
      ...orderRows[0],
      items: itemRows,
      items_count: itemRows.length,
    });
  } catch (err) {
    logger.error("Route error", { error: err });
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.put("/:id/status", validate(UpdateOrderStatusSchema), async (req: Request, res: Response) => {
  const { status } = req.body;

  try {
    const { rows: existingRows } = await pool.query(
      "SELECT id, status FROM orders WHERE id = $1",
      [req.params.id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({ error: "Заказ не найден" });
    }

    const { rows } = await pool.query(
      `UPDATE orders
       SET status = $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING id, status, updated_at`,
      [status, req.params.id]
    );

    const admin = req.user;
    await pool.query(
      `INSERT INTO order_status_history (order_id, previous_status, next_status, admin_id, note)
       VALUES ($1, $2, $3, $4, $5)`,
      [rows[0].id, existingRows[0].status, status, admin?.id ?? null, "Status updated from admin panel"]
    );

    await logAuditAction({
      adminId: admin?.id ?? null,
      action: "update_status",
      entityType: "order",
      entityId: rows[0].id,
      details: { status },
      ipAddress: req.ip,
    });

    res.json(rows[0]);
  } catch (err) {
    logger.error("Route error", { error: err });
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.put("/:id/payment", validate(UpdateOrderPaymentSchema), async (req: Request, res: Response) => {
  const status = req.body.payment_status as string;
  const provider = typeof req.body.payment_provider === "string" ? req.body.payment_provider.trim() : null;
  const reference = typeof req.body.payment_reference === "string" ? req.body.payment_reference.trim() : null;

  try {
    const { rows } = await pool.query(
      `UPDATE orders
       SET payment_status = $1,
           payment_provider = $2,
           payment_reference = $3,
           paid_at = CASE
             WHEN $1 = 'paid' AND paid_at IS NULL THEN NOW()
             WHEN $1 <> 'paid' THEN NULL
             ELSE paid_at
           END,
           updated_at = NOW()
       WHERE id = $4
       RETURNING id, payment_status, payment_provider, payment_reference, paid_at, updated_at`,
      [status, provider || null, reference || null, req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Заказ не найден" });
    }

    await logAuditAction({
      adminId: req.user?.id ?? null,
      action: "update_payment",
      entityType: "order",
      entityId: rows[0].id,
      details: { payment_status: status, payment_provider: provider, payment_reference: reference },
      ipAddress: req.ip,
    });

    res.json(rows[0]);
  } catch (err) {
    logger.error("Route error", { error: err });
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.put("/:id/fulfillment", validate(UpdateOrderFulfillmentSchema), async (req: Request, res: Response) => {
  const carrier = typeof req.body.carrier === "string" ? req.body.carrier.trim() : null;
  const trackingNumber = typeof req.body.tracking_number === "string" ? req.body.tracking_number.trim() : null;
  const shippedAt = typeof req.body.shipped_at === "string" && req.body.shipped_at.trim()
    ? new Date(req.body.shipped_at)
    : null;

  try {
    const { rows } = await pool.query(
      `UPDATE orders
       SET carrier = $1,
           tracking_number = $2,
           shipped_at = $3,
           updated_at = NOW()
       WHERE id = $4
       RETURNING id, carrier, tracking_number, shipped_at, updated_at`,
      [carrier || null, trackingNumber || null, shippedAt, req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Заказ не найден" });
    }

    await logAuditAction({
      adminId: req.user?.id ?? null,
      action: "update_fulfillment",
      entityType: "order",
      entityId: rows[0].id,
      details: { carrier, tracking_number: trackingNumber, shipped_at: shippedAt },
      ipAddress: req.ip,
    });

    res.json(rows[0]);
  } catch (err) {
    logger.error("Route error", { error: err });
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

export default router;
