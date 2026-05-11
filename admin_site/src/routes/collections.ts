import { Router, Request, Response } from "express";
import logger from "../lib/logger";
import { pool, logAuditAction } from "../db";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { CollectionSchema } from "../schemas";

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
              c.sort_order,
              c.created_at,
              c.updated_at,
              COUNT(pc.id)::int AS product_count
       FROM collections c
       LEFT JOIN product_collections pc ON pc.collection_id = c.id
       GROUP BY c.id
       ORDER BY c.sort_order ASC, c.name ASC`
    );
    res.json(rows);
  } catch (err) {
    logger.error("Route error", { error: err });
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.post("/", validate(CollectionSchema), async (req: Request, res: Response) => {
  const { name, slug, description, is_active, sort_order } = req.body;

  const finalSlug = typeof slug === "string" && slug.trim() ? slug.trim() : makeSlug(name);

  try {
    const { rows } = await pool.query(
      `INSERT INTO collections (name, slug, description, is_active, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, slug, description, is_active, sort_order, created_at, updated_at`,
      [name, finalSlug, description || null, is_active ?? true, Number(sort_order) || 0]
    );

    await logAuditAction({
      adminId: req.user?.id ?? null,
      action: "create",
      entityType: "collection",
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

router.put("/:id", validate(CollectionSchema), async (req: Request, res: Response) => {
  const { name, slug, description, is_active, sort_order } = req.body;

  const finalSlug = typeof slug === "string" && slug.trim() ? slug.trim() : makeSlug(name);

  try {
    const { rows } = await pool.query(
      `UPDATE collections
       SET name = $1,
           slug = $2,
           description = $3,
           is_active = $4,
           sort_order = $5,
           updated_at = NOW()
       WHERE id = $6
       RETURNING id, name, slug, description, is_active, sort_order, created_at, updated_at`,
      [name, finalSlug, description || null, is_active ?? true, Number(sort_order) || 0, req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Коллекция не найдена" });
    }

    await logAuditAction({
      adminId: req.user?.id ?? null,
      action: "update",
      entityType: "collection",
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
      "DELETE FROM collections WHERE id = $1 RETURNING id, name, slug",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Коллекция не найдена" });
    }

    await logAuditAction({
      adminId: req.user?.id ?? null,
      action: "delete",
      entityType: "collection",
      entityId: rows[0].id,
      details: { name: rows[0].name, slug: rows[0].slug },
      ipAddress: req.ip,
    });

    res.json({ message: "Коллекция удалена", id: rows[0].id });
  } catch (err) {
    logger.error("Route error", { error: err });
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

export default router;
