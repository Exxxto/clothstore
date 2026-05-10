import { Router, Request, Response } from "express";
import { pool, logAuditAction, logPriceHistory, syncProductImages, syncProductVariants } from "../db";
import { requireAuth } from "../middleware/auth";
import { normalizeGenderInput } from "../lib/productNormalization";

const router = Router();

// GET /api/products — public, with optional filters
router.get("/", async (req: Request, res: Response) => {
  try {
    const { gender, type, season, search } = req.query;
    let query = "SELECT * FROM products WHERE 1=1";
    const params: Array<string | number> = [];
    let idx = 1;

    if (typeof gender === "string") {
      const normalizedGender = normalizeGenderInput(gender);
      if (normalizedGender) {
        query += ` AND CASE
          WHEN LOWER(gender) IN ('men', 'male', 'man', 'мужское', 'мужские', 'мужской', 'для мужчин') THEN 'men'
          WHEN LOWER(gender) IN ('women', 'female', 'woman', 'женское', 'женские', 'женский', 'для женщин') THEN 'women'
          WHEN LOWER(gender) IN ('kids', 'child', 'children', 'детское', 'детские', 'детский', 'для детей') THEN 'kids'
          ELSE LOWER(gender)
        END = $${idx++}`;
        params.push(normalizedGender);
      }
    }
    if (typeof type === "string") {
      query += ` AND type = $${idx++}`;
      params.push(type);
    }
    if (typeof season === "string") {
      query += ` AND season = $${idx++}`;
      params.push(season);
    }
    if (typeof search === "string") {
      query += ` AND (name ILIKE $${idx} OR description ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }

    query += " ORDER BY id ASC";

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// GET /api/products/:id — public
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query("SELECT * FROM products WHERE id = $1", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Товар не найден" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// POST /api/products — admin only
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, type, gender, price, old_price, image_url, season, category_id, is_new, sizes, description } = req.body;
    const normalizedGender = normalizeGenderInput(typeof gender === "string" ? gender : undefined);

    if (!name || !type || !gender || !price || !season) {
      return res.status(400).json({ error: "Заполните обязательные поля: name, type, gender, price, season" });
    }
    if (!normalizedGender) {
      return res.status(400).json({ error: "Укажите корректный пол товара" });
    }

    const { rows } = await pool.query(
      `INSERT INTO products (name, type, gender, price, old_price, image_url, season, category_id, is_new, sizes, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [name, type, normalizedGender, price, old_price || null, image_url || null, season, category_id || null, is_new || false, sizes || [], description || ""]
    );

    const admin = req.user;
    await logAuditAction({
      adminId: admin?.id ?? null,
      action: "create",
      entityType: "product",
      entityId: rows[0].id,
      details: { name, type, gender: normalizedGender, price, category_id: category_id || null },
      ipAddress: req.ip,
    });

    await logPriceHistory({
      productId: rows[0].id,
      adminId: admin?.id ?? null,
      source: "product_create",
      oldPrice: null,
      newPrice: rows[0].price,
      oldOldPrice: null,
      newOldPrice: rows[0].old_price,
    });

    await syncProductImages(pool);
    await syncProductVariants(pool, rows[0].id);

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// PUT /api/products/:id — admin only
router.put("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, type, gender, price, old_price, image_url, season, category_id, is_new, sizes, description } = req.body;
    const normalizedGender = normalizeGenderInput(typeof gender === "string" ? gender : undefined);

    if (!name || !type || !gender || !price || !season) {
      return res.status(400).json({ error: "Заполните обязательные поля: name, type, gender, price, season" });
    }
    if (!normalizedGender) {
      return res.status(400).json({ error: "Укажите корректный пол товара" });
    }

    const { rows: existingRows } = await pool.query(
      "SELECT id, price, old_price FROM products WHERE id = $1",
      [req.params.id]
    );

    if (existingRows.length === 0) return res.status(404).json({ error: "Товар не найден" });

    const { rows } = await pool.query(
      `UPDATE products
       SET name=$1, type=$2, gender=$3, price=$4, old_price=$5, image_url=$6,
           season=$7, category_id=$8, is_new=$9, sizes=$10, description=$11, updated_at=NOW()
       WHERE id=$12
       RETURNING *`,
      [name, type, normalizedGender, price, old_price || null, image_url || null, season, category_id || null, is_new || false, sizes || [], description || "", req.params.id]
    );

    const admin = req.user;
    await logAuditAction({
      adminId: admin?.id ?? null,
      action: "update",
      entityType: "product",
      entityId: rows[0].id,
      details: { name, type, gender: normalizedGender, price, category_id: category_id || null },
      ipAddress: req.ip,
    });

    const previousProduct = existingRows[0];
    if (previousProduct.price !== rows[0].price || previousProduct.old_price !== rows[0].old_price) {
      await logPriceHistory({
        productId: rows[0].id,
        adminId: admin?.id ?? null,
        source: "product_update",
        oldPrice: previousProduct.price,
        newPrice: rows[0].price,
        oldOldPrice: previousProduct.old_price,
        newOldPrice: rows[0].old_price,
      });
    }

    await syncProductImages(pool);
    await syncProductVariants(pool, rows[0].id);

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// DELETE /api/products/:id — admin only
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query("DELETE FROM products WHERE id = $1 RETURNING id, name", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Товар не найден" });

    const admin = req.user;
    await logAuditAction({
      adminId: admin?.id ?? null,
      action: "delete",
      entityType: "product",
      entityId: rows[0].id,
      details: { name: rows[0].name },
      ipAddress: req.ip,
    });

    await syncProductImages(pool);

    res.json({ message: "Товар удалён", id: rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

export default router;
