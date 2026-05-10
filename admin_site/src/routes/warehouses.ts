import { Router, Request, Response } from "express";
import { pool, logAuditAction } from "../db";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

function makeCode(value: string) {
  return value
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

router.get("/", async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT w.id,
              w.name,
              w.code,
              w.city,
              w.address,
              w.is_active,
              w.created_at,
              w.updated_at,
              COUNT(sb.id)::int AS balances_count,
              COALESCE(SUM(sb.quantity_on_hand), 0)::int AS total_items
       FROM warehouses w
       LEFT JOIN stock_balances sb ON sb.warehouse_id = w.id
       GROUP BY w.id
       ORDER BY w.name ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  const { name, code, city, address, is_active } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Укажите название склада" });
  }

  const finalCode = typeof code === "string" && code.trim() ? makeCode(code) : makeCode(name);

  try {
    const { rows } = await pool.query(
      `INSERT INTO warehouses (name, code, city, address, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, code, city, address, is_active, created_at, updated_at`,
      [name, finalCode, city || null, address || null, is_active ?? true]
    );

    await pool.query(
      `
        INSERT INTO stock_balances (warehouse_id, product_variant_id, quantity_on_hand, quantity_reserved, reorder_point, updated_at)
        SELECT $1, pv.id, 0, 0, 0, NOW()
        FROM product_variants pv
        ON CONFLICT (warehouse_id, product_variant_id) DO NOTHING
      `,
      [rows[0].id]
    );

    await logAuditAction({
      adminId: req.user?.id ?? null,
      action: "create",
      entityType: "warehouse",
      entityId: rows[0].id,
      details: { name, code: finalCode },
      ipAddress: req.ip,
    });

    res.status(201).json(rows[0]);
  } catch (err) {
    if ((err as { code?: string }).code === "23505") {
      return res.status(409).json({ error: "Название или код уже заняты" });
    }
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  const { name, code, city, address, is_active } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Укажите название склада" });
  }

  const finalCode = typeof code === "string" && code.trim() ? makeCode(code) : makeCode(name);

  try {
    const { rows } = await pool.query(
      `UPDATE warehouses
       SET name = $1,
           code = $2,
           city = $3,
           address = $4,
           is_active = $5,
           updated_at = NOW()
       WHERE id = $6
       RETURNING id, name, code, city, address, is_active, created_at, updated_at`,
      [name, finalCode, city || null, address || null, is_active ?? true, req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Склад не найден" });
    }

    await logAuditAction({
      adminId: req.user?.id ?? null,
      action: "update",
      entityType: "warehouse",
      entityId: rows[0].id,
      details: { name, code: finalCode, is_active: is_active ?? true },
      ipAddress: req.ip,
    });

    res.json(rows[0]);
  } catch (err) {
    if ((err as { code?: string }).code === "23505") {
      return res.status(409).json({ error: "Название или код уже заняты" });
    }
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      "DELETE FROM warehouses WHERE id = $1 RETURNING id, name, code",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Склад не найден" });
    }

    await logAuditAction({
      adminId: req.user?.id ?? null,
      action: "delete",
      entityType: "warehouse",
      entityId: rows[0].id,
      details: { name: rows[0].name, code: rows[0].code },
      ipAddress: req.ip,
    });

    res.json({ message: "Склад удалён", id: rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

export default router;
