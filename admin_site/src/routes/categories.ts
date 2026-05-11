import { Router, Request, Response } from "express";
import logger from "../lib/logger";
import { pool, logAuditAction } from "../db";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { CategorySchema } from "../schemas";

const router = Router();

router.use(requireAuth);

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

router.get("/", async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.id,
              c.name,
              c.slug,
              c.description,
              c.is_active,
              c.created_at,
              c.updated_at,
              COUNT(p.id)::int AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       GROUP BY c.id, c.name, c.slug, c.description, c.is_active, c.created_at, c.updated_at
       ORDER BY c.name ASC`
    );
    res.json(rows);
  } catch (err) {
    logger.error("Route error", { error: err });
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.id,
              c.name,
              c.slug,
              c.description,
              c.is_active,
              c.created_at,
              c.updated_at,
              COUNT(p.id)::int AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       WHERE c.id = $1
       GROUP BY c.id, c.name, c.slug, c.description, c.is_active, c.created_at, c.updated_at`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Категория не найдена" });
    res.json(rows[0]);
  } catch (err) {
    logger.error("Route error", { error: err });
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.post("/", validate(CategorySchema), async (req: Request, res: Response) => {
  const { name, slug, description, is_active } = req.body;

  const finalSlug = (slug || makeSlug(name)).toString();

  try {
    const { rows } = await pool.query(
      `INSERT INTO categories (name, slug, description, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, slug, description, is_active, created_at`,
      [name, finalSlug, description || null, is_active ?? true]
    );

    const admin = req.user;
    await logAuditAction({
      adminId: admin?.id ?? null,
      action: "create",
      entityType: "category",
      entityId: rows[0].id,
      details: { name, slug: finalSlug },
      ipAddress: req.ip,
    });

    res.status(201).json(rows[0]);
  } catch (err) {
    if ((err as { code?: string }).code === "23505") {
      return res.status(409).json({ error: "Название или slug уже заняты" });
    }
    logger.error("Route error", { error: err });
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.put("/:id", validate(CategorySchema), async (req: Request, res: Response) => {
  const { name, slug, description, is_active } = req.body;

  const finalSlug = (slug || makeSlug(name)).toString();

  try {
    const { rows } = await pool.query(
      `UPDATE categories
       SET name=$1, slug=$2, description=$3, is_active=$4, updated_at=NOW()
       WHERE id=$5
       RETURNING id, name, slug, description, is_active, updated_at`,
      [name, finalSlug, description || null, is_active ?? true, req.params.id]
    );

    if (rows.length === 0) return res.status(404).json({ error: "Категория не найдена" });

    const admin = req.user;
    await logAuditAction({
      adminId: admin?.id ?? null,
      action: "update",
      entityType: "category",
      entityId: rows[0].id,
      details: { name, slug: finalSlug, is_active: is_active ?? true },
      ipAddress: req.ip,
    });

    res.json(rows[0]);
  } catch (err) {
    if ((err as { code?: string }).code === "23505") {
      return res.status(409).json({ error: "Название или slug уже заняты" });
    }
    logger.error("Route error", { error: err });
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      "DELETE FROM categories WHERE id=$1 RETURNING id, name, slug",
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Категория не найдена" });

    const admin = req.user;
    await logAuditAction({
      adminId: admin?.id ?? null,
      action: "delete",
      entityType: "category",
      entityId: rows[0].id,
      details: { name: rows[0].name, slug: rows[0].slug },
      ipAddress: req.ip,
    });

    res.json({ message: "Категория удалена", id: rows[0].id });
  } catch (err) {
    logger.error("Route error", { error: err });
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

export default router;
