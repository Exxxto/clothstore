import { Router, Request, Response } from "express";
import logger from "../lib/logger";
import { createStockMovement, logAuditAction, pool } from "../db";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { StockMovementSchema } from "../schemas";

const router = Router();

router.use(requireAuth);

router.get("/", async (req: Request, res: Response) => {
  const { search, warehouse_id, low_stock } = req.query;

  try {
    const conditions: string[] = [];
    const params: Array<string | number> = [];

    if (typeof warehouse_id === "string" && warehouse_id.trim()) {
      params.push(Number(warehouse_id));
      conditions.push(`w.id = $${params.length}`);
    }

    if (typeof search === "string" && search.trim()) {
      params.push(`%${search.trim()}%`);
      conditions.push(`(
        p.name ILIKE $${params.length}
        OR pv.variant_name ILIKE $${params.length}
        OR pv.sku ILIKE $${params.length}
        OR COALESCE(pv.size, '') ILIKE $${params.length}
        OR COALESCE(pv.color, '') ILIKE $${params.length}
      )`);
    }

    if (low_stock === "true") {
      conditions.push(`sb.quantity_on_hand <= sb.reorder_point`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const { rows } = await pool.query(
      `SELECT sb.id,
              sb.warehouse_id,
              sb.product_variant_id,
              sb.quantity_on_hand,
              sb.quantity_reserved,
              sb.reorder_point,
              sb.updated_at,
              w.name AS warehouse_name,
              w.code AS warehouse_code,
              pv.sku,
              pv.variant_name,
              pv.size,
              pv.color,
              pv.price,
              pv.is_active AS variant_is_active,
              p.id AS product_id,
              p.name AS product_name,
              p.gender AS product_gender,
              p.type AS product_type
       FROM stock_balances sb
       INNER JOIN warehouses w ON w.id = sb.warehouse_id
       INNER JOIN product_variants pv ON pv.id = sb.product_variant_id
       INNER JOIN products p ON p.id = pv.product_id
       ${whereClause}
       ORDER BY p.name ASC, pv.id ASC, w.name ASC`,
      params
    );

    res.json(rows);
  } catch (err) {
    logger.error("Route error", { error: err });
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.get("/movements", async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit || 100), 300);

  try {
    const { rows } = await pool.query(
      `SELECT sm.id,
              sm.warehouse_id,
              sm.product_variant_id,
              sm.movement_type,
              sm.quantity_delta,
              sm.quantity_after,
              sm.reason,
              sm.reference_type,
              sm.reference_id,
              sm.notes,
              sm.created_at,
              w.name AS warehouse_name,
              pv.sku,
              pv.variant_name,
              p.name AS product_name,
              a.username AS admin_username
       FROM stock_movements sm
       INNER JOIN warehouses w ON w.id = sm.warehouse_id
       INNER JOIN product_variants pv ON pv.id = sm.product_variant_id
       INNER JOIN products p ON p.id = pv.product_id
       LEFT JOIN admins a ON a.id = sm.admin_id
       ORDER BY sm.created_at DESC
       LIMIT $1`,
      [limit]
    );

    res.json(rows);
  } catch (err) {
    logger.error("Route error", { error: err });
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.post("/movements", validate(StockMovementSchema), async (req: Request, res: Response) => {
  const { warehouse_id, product_variant_id, quantity_delta, movement_type, reason, reference_type, reference_id, notes } = req.body;

  try {
    const updatedBalance = await createStockMovement({
      warehouseId: Number(warehouse_id),
      productVariantId: Number(product_variant_id),
      quantityDelta: Number(quantity_delta),
      movementType: String(movement_type),
      reason: typeof reason === "string" ? reason : null,
      referenceType: typeof reference_type === "string" ? reference_type : null,
      referenceId: Number.isFinite(Number(reference_id)) ? Number(reference_id) : null,
      adminId: req.user?.id ?? null,
      notes: typeof notes === "string" ? notes : null,
    });

    await logAuditAction({
      adminId: req.user?.id ?? null,
      action: "stock_movement",
      entityType: "inventory",
      entityId: updatedBalance.id,
      details: {
        warehouse_id: Number(warehouse_id),
        product_variant_id: Number(product_variant_id),
        quantity_delta: Number(quantity_delta),
        movement_type: String(movement_type),
      },
      ipAddress: req.ip,
    });

    res.status(201).json(updatedBalance);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ошибка сервера";
    res.status(message === "Недостаточно остатка для списания" ? 400 : 500).json({ error: message });
  }
});

export default router;
