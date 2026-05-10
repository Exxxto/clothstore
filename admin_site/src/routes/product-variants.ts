import { Router, Request, Response } from "express";
import { createStockMovement, logAuditAction, logPriceHistory, pool } from "../db";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

function makeSku(base: string) {
  return base
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

router.get("/", async (req: Request, res: Response) => {
  const { product_id, search, active } = req.query;

  try {
    const conditions: string[] = [];
    const params: Array<string | number | boolean> = [];

    if (typeof product_id === "string" && product_id.trim()) {
      params.push(Number(product_id));
      conditions.push(`pv.product_id = $${params.length}`);
    }

    if (typeof active === "string" && active !== "all") {
      params.push(active === "true");
      conditions.push(`pv.is_active = $${params.length}`);
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

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const { rows } = await pool.query(
      `SELECT pv.id,
              pv.product_id,
              pv.sku,
              pv.variant_name,
              pv.size,
              pv.color,
              pv.barcode,
              pv.price,
              pv.old_price,
              pv.cost_price,
              pv.stock_tracking,
              pv.is_active,
              pv.auto_generated,
              pv.attributes,
              pv.created_at,
              pv.updated_at,
              p.name AS product_name,
              p.gender AS product_gender,
              p.type AS product_type,
              COALESCE(SUM(sb.quantity_on_hand), 0)::int AS total_stock,
              COALESCE(SUM(sb.quantity_reserved), 0)::int AS total_reserved
       FROM product_variants pv
       INNER JOIN products p ON p.id = pv.product_id
       LEFT JOIN stock_balances sb ON sb.product_variant_id = pv.id
       ${whereClause}
       GROUP BY pv.id, p.id
       ORDER BY p.name ASC, pv.id ASC`,
      params
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT pv.*,
              p.name AS product_name,
              p.gender AS product_gender,
              p.type AS product_type
       FROM product_variants pv
       INNER JOIN products p ON p.id = pv.product_id
       WHERE pv.id = $1`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Вариант товара не найден" });
    }

    const { rows: balances } = await pool.query(
      `SELECT sb.id,
              sb.warehouse_id,
              sb.product_variant_id,
              sb.quantity_on_hand,
              sb.quantity_reserved,
              sb.reorder_point,
              sb.updated_at,
              w.name AS warehouse_name,
              w.code AS warehouse_code
       FROM stock_balances sb
       INNER JOIN warehouses w ON w.id = sb.warehouse_id
       WHERE sb.product_variant_id = $1
       ORDER BY w.name ASC`,
      [req.params.id]
    );

    res.json({ ...rows[0], balances });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  const {
    product_id,
    variant_name,
    size,
    color,
    barcode,
    sku,
    price,
    old_price,
    cost_price,
    stock_tracking,
    is_active,
    attributes,
  } = req.body;

  if (!product_id || !price) {
    return res.status(400).json({ error: "Укажите товар и цену варианта" });
  }

  try {
    const { rows: productRows } = await pool.query(
      "SELECT id, name FROM products WHERE id = $1",
      [product_id]
    );

    if (productRows.length === 0) {
      return res.status(404).json({ error: "Товар не найден" });
    }

    const product = productRows[0];
    const finalVariantName = variant_name || `${product.name}${size ? ` / ${size}` : ""}${color ? ` / ${color}` : ""}`;
    const finalSku = makeSku(sku || `${product.name}-${size || "std"}-${color || product.id}-${Date.now()}`);

    const { rows } = await pool.query(
      `INSERT INTO product_variants (
         product_id,
         sku,
         variant_name,
         size,
         color,
         barcode,
         price,
         old_price,
         cost_price,
         stock_tracking,
         is_active,
         auto_generated,
         attributes
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, FALSE, $12)
       RETURNING *`,
      [
        product_id,
        finalSku,
        finalVariantName,
        size || null,
        color || null,
        barcode || null,
        price,
        old_price || null,
        cost_price || null,
        stock_tracking ?? true,
        is_active ?? true,
        attributes && typeof attributes === "object" ? attributes : {},
      ]
    );

    await pool.query(
      `
        INSERT INTO stock_balances (warehouse_id, product_variant_id, quantity_on_hand, quantity_reserved, reorder_point, updated_at)
        SELECT w.id, $1, 0, 0, 0, NOW()
        FROM warehouses w
        ON CONFLICT (warehouse_id, product_variant_id) DO NOTHING
      `,
      [rows[0].id]
    );

    await logPriceHistory({
      productId: product_id,
      productVariantId: rows[0].id,
      adminId: req.user?.id ?? null,
      source: "variant_create",
      oldPrice: null,
      newPrice: rows[0].price,
      oldOldPrice: null,
      newOldPrice: rows[0].old_price,
    });

    await logAuditAction({
      adminId: req.user?.id ?? null,
      action: "create",
      entityType: "product_variant",
      entityId: rows[0].id,
      details: { product_id, sku: finalSku, size: size || null, color: color || null },
      ipAddress: req.ip,
    });

    res.status(201).json(rows[0]);
  } catch (err) {
    if ((err as { code?: string }).code === "23505") {
      return res.status(409).json({ error: "SKU уже используется" });
    }
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  const {
    variant_name,
    size,
    color,
    barcode,
    sku,
    price,
    old_price,
    cost_price,
    stock_tracking,
    is_active,
    attributes,
  } = req.body;

  try {
    const { rows: existingRows } = await pool.query(
      "SELECT id, product_id, price, old_price FROM product_variants WHERE id = $1",
      [req.params.id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({ error: "Вариант товара не найден" });
    }

    const existing = existingRows[0];

    const { rows } = await pool.query(
      `UPDATE product_variants
       SET variant_name = $1,
           size = $2,
           color = $3,
           barcode = $4,
           sku = $5,
           price = $6,
           old_price = $7,
           cost_price = $8,
           stock_tracking = $9,
           is_active = $10,
           attributes = $11,
           updated_at = NOW()
       WHERE id = $12
       RETURNING *`,
      [
        variant_name,
        size || null,
        color || null,
        barcode || null,
        makeSku(sku || variant_name || `VARIANT-${req.params.id}`),
        price,
        old_price || null,
        cost_price || null,
        stock_tracking ?? true,
        is_active ?? true,
        attributes && typeof attributes === "object" ? attributes : {},
        req.params.id,
      ]
    );

    if (existing.price !== rows[0].price || existing.old_price !== rows[0].old_price) {
      await logPriceHistory({
        productId: existing.product_id,
        productVariantId: rows[0].id,
        adminId: req.user?.id ?? null,
        source: "variant_update",
        oldPrice: existing.price,
        newPrice: rows[0].price,
        oldOldPrice: existing.old_price,
        newOldPrice: rows[0].old_price,
      });
    }

    await logAuditAction({
      adminId: req.user?.id ?? null,
      action: "update",
      entityType: "product_variant",
      entityId: rows[0].id,
      details: { sku: rows[0].sku, size: rows[0].size, color: rows[0].color, is_active: rows[0].is_active },
      ipAddress: req.ip,
    });

    res.json(rows[0]);
  } catch (err) {
    if ((err as { code?: string }).code === "23505") {
      return res.status(409).json({ error: "SKU уже используется" });
    }
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `UPDATE product_variants
       SET is_active = FALSE,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, sku`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Вариант товара не найден" });
    }

    await logAuditAction({
      adminId: req.user?.id ?? null,
      action: "deactivate",
      entityType: "product_variant",
      entityId: rows[0].id,
      details: { sku: rows[0].sku },
      ipAddress: req.ip,
    });

    res.json({ message: "Вариант товара деактивирован", id: rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

export default router;
