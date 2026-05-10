import { Router, Request, Response } from "express";
import { pool, logAuditAction } from "../db";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNumber(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

router.get("/", async (_req: Request, res: Response) => {
  try {
    const [shippingRows, paymentRows] = await Promise.all([
      pool.query(
        `SELECT id, code, name, description, price, sort_order, is_active, created_at, updated_at
         FROM shipping_methods
         ORDER BY sort_order ASC, id ASC`
      ),
      pool.query(
        `SELECT id, code, name, description, requires_card, sort_order, is_active, created_at, updated_at
         FROM payment_methods
         ORDER BY sort_order ASC, id ASC`
      ),
    ]);

    res.json({
      shipping_methods: shippingRows.rows,
      payment_methods: paymentRows.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.post("/shipping", async (req: Request, res: Response) => {
  const code = normalizeText(req.body.code);
  const name = normalizeText(req.body.name);

  if (!code || !name) {
    return res.status(400).json({ error: "Укажите code и name" });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO shipping_methods (code, name, description, price, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        code,
        name,
        normalizeText(req.body.description) || null,
        Math.max(0, normalizeNumber(req.body.price)),
        normalizeNumber(req.body.sort_order),
        req.body.is_active ?? true,
      ]
    );

    await logAuditAction({
      adminId: req.user?.id ?? null,
      action: "create",
      entityType: "shipping_method",
      entityId: rows[0].id,
      details: { code: rows[0].code, name: rows[0].name, price: rows[0].price },
      ipAddress: req.ip,
    });

    res.status(201).json(rows[0]);
  } catch (err) {
    if ((err as { code?: string }).code === "23505") {
      return res.status(409).json({ error: "Способ доставки с таким кодом уже существует" });
    }
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.put("/shipping/:id", async (req: Request, res: Response) => {
  const code = normalizeText(req.body.code);
  const name = normalizeText(req.body.name);

  if (!code || !name) {
    return res.status(400).json({ error: "Укажите code и name" });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE shipping_methods
       SET code = $1,
           name = $2,
           description = $3,
           price = $4,
           sort_order = $5,
           is_active = $6,
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [
        code,
        name,
        normalizeText(req.body.description) || null,
        Math.max(0, normalizeNumber(req.body.price)),
        normalizeNumber(req.body.sort_order),
        req.body.is_active ?? true,
        req.params.id,
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Способ доставки не найден" });
    }

    await logAuditAction({
      adminId: req.user?.id ?? null,
      action: "update",
      entityType: "shipping_method",
      entityId: rows[0].id,
      details: { code: rows[0].code, name: rows[0].name, price: rows[0].price, is_active: rows[0].is_active },
      ipAddress: req.ip,
    });

    res.json(rows[0]);
  } catch (err) {
    if ((err as { code?: string }).code === "23505") {
      return res.status(409).json({ error: "Способ доставки с таким кодом уже существует" });
    }
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.delete("/shipping/:id", async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      "DELETE FROM shipping_methods WHERE id = $1 RETURNING id, code, name",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Способ доставки не найден" });
    }

    await logAuditAction({
      adminId: req.user?.id ?? null,
      action: "delete",
      entityType: "shipping_method",
      entityId: rows[0].id,
      details: { code: rows[0].code, name: rows[0].name },
      ipAddress: req.ip,
    });

    res.json({ message: "Способ доставки удалён", id: rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.post("/payment", async (req: Request, res: Response) => {
  const code = normalizeText(req.body.code);
  const name = normalizeText(req.body.name);

  if (!code || !name) {
    return res.status(400).json({ error: "Укажите code и name" });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO payment_methods (code, name, description, requires_card, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        code,
        name,
        normalizeText(req.body.description) || null,
        req.body.requires_card === true,
        normalizeNumber(req.body.sort_order),
        req.body.is_active ?? true,
      ]
    );

    await logAuditAction({
      adminId: req.user?.id ?? null,
      action: "create",
      entityType: "payment_method",
      entityId: rows[0].id,
      details: { code: rows[0].code, name: rows[0].name, requires_card: rows[0].requires_card },
      ipAddress: req.ip,
    });

    res.status(201).json(rows[0]);
  } catch (err) {
    if ((err as { code?: string }).code === "23505") {
      return res.status(409).json({ error: "Способ оплаты с таким кодом уже существует" });
    }
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.put("/payment/:id", async (req: Request, res: Response) => {
  const code = normalizeText(req.body.code);
  const name = normalizeText(req.body.name);

  if (!code || !name) {
    return res.status(400).json({ error: "Укажите code и name" });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE payment_methods
       SET code = $1,
           name = $2,
           description = $3,
           requires_card = $4,
           sort_order = $5,
           is_active = $6,
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [
        code,
        name,
        normalizeText(req.body.description) || null,
        req.body.requires_card === true,
        normalizeNumber(req.body.sort_order),
        req.body.is_active ?? true,
        req.params.id,
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Способ оплаты не найден" });
    }

    await logAuditAction({
      adminId: req.user?.id ?? null,
      action: "update",
      entityType: "payment_method",
      entityId: rows[0].id,
      details: { code: rows[0].code, name: rows[0].name, requires_card: rows[0].requires_card, is_active: rows[0].is_active },
      ipAddress: req.ip,
    });

    res.json(rows[0]);
  } catch (err) {
    if ((err as { code?: string }).code === "23505") {
      return res.status(409).json({ error: "Способ оплаты с таким кодом уже существует" });
    }
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.delete("/payment/:id", async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      "DELETE FROM payment_methods WHERE id = $1 RETURNING id, code, name",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Способ оплаты не найден" });
    }

    await logAuditAction({
      adminId: req.user?.id ?? null,
      action: "delete",
      entityType: "payment_method",
      entityId: rows[0].id,
      details: { code: rows[0].code, name: rows[0].name },
      ipAddress: req.ip,
    });

    res.json({ message: "Способ оплаты удалён", id: rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

export default router;
