import { Router, Request, Response } from "express";
import { pool, logAuditAction } from "../db";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/", async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT pc.id,
              pc.code,
              pc.description,
              pc.discount_type,
              pc.discount_value,
              pc.min_order_amount,
              pc.max_discount_amount,
              pc.starts_at,
              pc.ends_at,
              pc.usage_limit,
              pc.usage_count,
              pc.is_active,
              pc.created_at,
              pc.updated_at,
              COUNT(pcr.id)::int AS redemptions_count
       FROM promo_codes pc
       LEFT JOIN promo_code_redemptions pcr ON pcr.promo_code_id = pc.id
       GROUP BY pc.id
       ORDER BY pc.created_at DESC, pc.id DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  const {
    code,
    description,
    discount_type,
    discount_value,
    min_order_amount,
    max_discount_amount,
    starts_at,
    ends_at,
    usage_limit,
    is_active,
  } = req.body;

  if (!code || !discount_type || !Number.isFinite(Number(discount_value))) {
    return res.status(400).json({ error: "Укажите code, discount_type и discount_value" });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO promo_codes (
         code,
         description,
         discount_type,
         discount_value,
         min_order_amount,
         max_discount_amount,
         starts_at,
         ends_at,
         usage_limit,
         is_active
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        String(code).trim().toUpperCase(),
        description || null,
        discount_type,
        Number(discount_value),
        Number(min_order_amount) || 0,
        Number.isFinite(Number(max_discount_amount)) ? Number(max_discount_amount) : null,
        starts_at || null,
        ends_at || null,
        Number.isFinite(Number(usage_limit)) ? Number(usage_limit) : null,
        is_active ?? true,
      ]
    );

    await logAuditAction({
      adminId: req.user?.id ?? null,
      action: "create",
      entityType: "promo_code",
      entityId: rows[0].id,
      details: { code: rows[0].code, discount_type: rows[0].discount_type, discount_value: rows[0].discount_value },
      ipAddress: req.ip,
    });

    res.status(201).json(rows[0]);
  } catch (err) {
    if ((err as { code?: string }).code === "23505") {
      return res.status(409).json({ error: "Промокод уже существует" });
    }
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  const {
    code,
    description,
    discount_type,
    discount_value,
    min_order_amount,
    max_discount_amount,
    starts_at,
    ends_at,
    usage_limit,
    is_active,
  } = req.body;

  if (!code || !discount_type || !Number.isFinite(Number(discount_value))) {
    return res.status(400).json({ error: "Укажите code, discount_type и discount_value" });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE promo_codes
       SET code = $1,
           description = $2,
           discount_type = $3,
           discount_value = $4,
           min_order_amount = $5,
           max_discount_amount = $6,
           starts_at = $7,
           ends_at = $8,
           usage_limit = $9,
           is_active = $10,
           updated_at = NOW()
       WHERE id = $11
       RETURNING *`,
      [
        String(code).trim().toUpperCase(),
        description || null,
        discount_type,
        Number(discount_value),
        Number(min_order_amount) || 0,
        Number.isFinite(Number(max_discount_amount)) ? Number(max_discount_amount) : null,
        starts_at || null,
        ends_at || null,
        Number.isFinite(Number(usage_limit)) ? Number(usage_limit) : null,
        is_active ?? true,
        req.params.id,
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Промокод не найден" });
    }

    await logAuditAction({
      adminId: req.user?.id ?? null,
      action: "update",
      entityType: "promo_code",
      entityId: rows[0].id,
      details: { code: rows[0].code, discount_type: rows[0].discount_type, discount_value: rows[0].discount_value, is_active: rows[0].is_active },
      ipAddress: req.ip,
    });

    res.json(rows[0]);
  } catch (err) {
    if ((err as { code?: string }).code === "23505") {
      return res.status(409).json({ error: "Промокод уже существует" });
    }
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      "DELETE FROM promo_codes WHERE id = $1 RETURNING id, code",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Промокод не найден" });
    }

    await logAuditAction({
      adminId: req.user?.id ?? null,
      action: "delete",
      entityType: "promo_code",
      entityId: rows[0].id,
      details: { code: rows[0].code },
      ipAddress: req.ip,
    });

    res.json({ message: "Промокод удалён", id: rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

export default router;
