import { Router, Request, Response } from "express";
import type { PoolClient } from "pg";
import { pool } from "../db";

const router = Router();

function normalizeSessionId(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

type ShippingMethod = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  price: number;
  sort_order: number;
};

type PaymentMethod = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  requires_card: boolean;
  sort_order: number;
};

async function getShippingMethods(queryable: Pick<PoolClient, "query"> = pool) {
  const { rows } = await queryable.query<ShippingMethod>(
    `SELECT id, code, name, description, price, sort_order
     FROM shipping_methods
     WHERE is_active = TRUE
     ORDER BY sort_order ASC, id ASC`
  );

  return rows;
}

async function getPaymentMethods(queryable: Pick<PoolClient, "query"> = pool) {
  const { rows } = await queryable.query<PaymentMethod>(
    `SELECT id, code, name, description, requires_card, sort_order
     FROM payment_methods
     WHERE is_active = TRUE
     ORDER BY sort_order ASC, id ASC`
  );

  return rows;
}

async function resolveShippingMethod(code: string, queryable: Pick<PoolClient, "query">) {
  const { rows } = await queryable.query<ShippingMethod>(
    `SELECT id, code, name, description, price, sort_order
     FROM shipping_methods
     WHERE code = $1 AND is_active = TRUE
     LIMIT 1`,
    [code]
  );

  return rows[0] ?? null;
}

async function resolvePaymentMethod(code: string, queryable: Pick<PoolClient, "query">) {
  const { rows } = await queryable.query<PaymentMethod>(
    `SELECT id, code, name, description, requires_card, sort_order
     FROM payment_methods
     WHERE code = $1 AND is_active = TRUE
     LIMIT 1`,
    [code]
  );

  return rows[0] ?? null;
}

function splitCustomerName(fullName: string | null) {
  const normalized = normalizeText(fullName);
  if (!normalized) {
    return {
      last_name: "",
      first_name: "",
      middle_name: null as string | null,
    };
  }

  const parts = normalized.split(/\s+/u);
  return {
    last_name: parts[0] || "",
    first_name: parts[1] || "",
    middle_name: parts.slice(2).join(" ") || null,
  };
}

async function getStoreProfile(sessionId: string) {
  const { rows } = await pool.query(
    `SELECT id, session_id, last_name, first_name, middle_name, email, phone, avatar_url, created_at, updated_at
     FROM store_profiles
     WHERE session_id = $1
     LIMIT 1`,
    [sessionId]
  );

  if (rows.length > 0) {
    return rows[0];
  }

  const { rows: orderRows } = await pool.query(
    `SELECT customer_name, email, phone, created_at, updated_at
     FROM orders
     WHERE session_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [sessionId]
  );

  if (orderRows.length > 0) {
    const nameParts = splitCustomerName(orderRows[0].customer_name);
    return {
      id: null,
      session_id: sessionId,
      ...nameParts,
      email: orderRows[0].email,
      phone: orderRows[0].phone,
      avatar_url: null,
      created_at: orderRows[0].created_at,
      updated_at: orderRows[0].updated_at,
    };
  }

  return {
    id: null,
    session_id: sessionId,
    last_name: "",
    first_name: "",
    middle_name: null,
    email: "",
    phone: null,
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function normalizeOrderStatus(value: unknown) {
  switch (normalizeText(value)) {
    case "confirmed":
    case "packing":
    case "shipped":
    case "completed":
    case "cancelled":
      return normalizeText(value) as "confirmed" | "packing" | "shipped" | "completed" | "cancelled";
    case "new":
    default:
      return "new" as const;
  }
}

async function upsertStoreProfile(sessionId: string, payload: {
  last_name?: string | null;
  first_name?: string | null;
  middle_name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
}) {
  const { rows } = await pool.query(
    `INSERT INTO store_profiles (
       session_id,
       last_name,
       first_name,
       middle_name,
       email,
       phone,
       avatar_url,
       updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     ON CONFLICT (session_id)
     DO UPDATE SET
       last_name = EXCLUDED.last_name,
       first_name = EXCLUDED.first_name,
       middle_name = EXCLUDED.middle_name,
       email = EXCLUDED.email,
       phone = EXCLUDED.phone,
       avatar_url = EXCLUDED.avatar_url,
       updated_at = NOW()
     RETURNING id, session_id, last_name, first_name, middle_name, email, phone, avatar_url, created_at, updated_at`,
    [
      sessionId,
      payload.last_name ?? null,
      payload.first_name ?? null,
      payload.middle_name ?? null,
      payload.email ?? null,
      payload.phone ?? null,
      payload.avatar_url ?? null,
    ]
  );

  return rows[0];
}

async function getAccountAddresses(sessionId: string) {
  const { rows } = await pool.query(
    `SELECT id,
            label,
            customer_name,
            email,
            phone,
            country,
            city,
            postal_code,
            address_line1,
            address_line2,
            is_default,
            created_at,
            updated_at
     FROM customer_addresses
     WHERE session_id = $1
     ORDER BY is_default DESC, updated_at DESC, created_at DESC, id DESC`,
    [sessionId]
  );

  return rows;
}

function normalizeAddressPayload(body: Record<string, unknown> = {}) {
  return {
    label: normalizeText(body.label) || null,
    customer_name: normalizeText(body.customer_name),
    email: normalizeText(body.email) || null,
    phone: normalizeText(body.phone) || null,
    country: normalizeText(body.country) || null,
    city: normalizeText(body.city) || null,
    postal_code: normalizeText(body.postal_code) || null,
    address_line1: normalizeText(body.address_line1),
    address_line2: normalizeText(body.address_line2) || null,
    is_default: body.is_default === true,
  };
}

function validateAddressPayload(payload: ReturnType<typeof normalizeAddressPayload>) {
  if (!payload.customer_name || !payload.address_line1 || !payload.city || !payload.country) {
    return "Укажите получателя, страну, город и адрес";
  }

  return null;
}

async function getOrCreateWishlist(sessionId: string) {
  const { rows: existingRows } = await pool.query(
    `SELECT id
     FROM wishlists
     WHERE session_id = $1
     LIMIT 1`,
    [sessionId]
  );

  if (existingRows.length > 0) {
    return existingRows[0].id as number;
  }

  const { rows } = await pool.query(
    `INSERT INTO wishlists (session_id)
     VALUES ($1)
     RETURNING id`,
    [sessionId]
  );

  return rows[0].id as number;
}

async function getWishlistProducts(sessionId: string) {
  const { rows } = await pool.query(
    `SELECT wi.id,
            wi.product_id,
            wi.created_at
     FROM wishlist_items wi
     INNER JOIN wishlists w ON w.id = wi.wishlist_id
     WHERE w.session_id = $1
     ORDER BY wi.created_at DESC, wi.id DESC`,
    [sessionId]
  );

  return rows;
}

async function getOrCreateCart(sessionId: string) {
  const { rows: existingRows } = await pool.query(
    `SELECT id, promo_code_id
     FROM carts
     WHERE session_id = $1 AND status = 'active'
     LIMIT 1`,
    [sessionId]
  );

  if (existingRows.length > 0) {
    return existingRows[0] as { id: number; promo_code_id: number | null };
  }

  const { rows } = await pool.query(
    `INSERT INTO carts (session_id, status, currency)
     VALUES ($1, 'active', 'RUB')
     RETURNING id, promo_code_id`,
    [sessionId]
  );

  return rows[0] as { id: number; promo_code_id: number | null };
}

async function resolveVariant(params: {
  productId: number;
  productVariantId?: number | null;
  size?: string | null;
}) {
  const { productId, productVariantId = null, size = null } = params;

  if (productVariantId) {
    const { rows } = await pool.query(
      `SELECT id, size, price, old_price
       FROM product_variants
       WHERE id = $1 AND product_id = $2 AND is_active = TRUE
       LIMIT 1`,
      [productVariantId, productId]
    );
    return rows[0] ?? null;
  }

  if (size) {
    const { rows } = await pool.query(
      `SELECT id, size, price, old_price
       FROM product_variants
       WHERE product_id = $1
         AND is_active = TRUE
         AND UPPER(COALESCE(size, '')) = UPPER($2)
       ORDER BY id ASC
       LIMIT 1`,
      [productId, size]
    );
    if (rows.length > 0) return rows[0];
  }

  const { rows } = await pool.query(
    `SELECT id, size, price, old_price
     FROM product_variants
     WHERE product_id = $1 AND is_active = TRUE
     ORDER BY id ASC
     LIMIT 1`,
    [productId]
  );
  return rows[0] ?? null;
}

async function buildCartResponse(sessionId: string) {
  const { rows: cartRows } = await pool.query(
    `SELECT c.id,
            c.status,
            c.currency,
            c.promo_code_id,
            pc.code AS promo_code
     FROM carts c
     LEFT JOIN promo_codes pc ON pc.id = c.promo_code_id
     WHERE c.session_id = $1 AND c.status = 'active'
     LIMIT 1`,
    [sessionId]
  );

  if (cartRows.length === 0) {
    return {
      id: null,
      status: "active",
      currency: "RUB",
      promo_code: null,
      items: [],
      item_count: 0,
      subtotal: 0,
    };
  }

  const cart = cartRows[0];

  const { rows: itemRows } = await pool.query(
    `SELECT ci.id,
            ci.cart_id,
            ci.product_id,
            ci.product_variant_id,
            ci.product_name,
            ci.image_url,
            ci.size,
            ci.unit_price,
            ci.quantity,
            ci.created_at,
            ci.updated_at,
            p.gender AS product_gender,
            p.type AS product_type,
            pv.sku AS variant_sku
     FROM cart_items ci
     LEFT JOIN products p ON p.id = ci.product_id
     LEFT JOIN product_variants pv ON pv.id = ci.product_variant_id
     WHERE ci.cart_id = $1
     ORDER BY ci.created_at ASC, ci.id ASC`,
    [cart.id]
  );

  const subtotal = itemRows.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const itemCount = itemRows.reduce((sum, item) => sum + item.quantity, 0);

  return {
    id: cart.id,
    status: cart.status,
    currency: cart.currency,
    promo_code: cart.promo_code,
    items: itemRows,
    item_count: itemCount,
    subtotal,
  };
}

async function validatePromoCode(code: string, subtotal: number) {
  const normalizedCode = code.trim().toUpperCase();
  if (!normalizedCode) return null;

  const { rows } = await pool.query<{
    id: number;
    code: string;
    discount_type: string;
    discount_value: number;
    min_order_amount: number;
    max_discount_amount: number | null;
    starts_at: string | null;
    ends_at: string | null;
    usage_limit: number | null;
    usage_count: number;
    is_active: boolean;
  }>(
    `SELECT id, code, discount_type, discount_value, min_order_amount, max_discount_amount,
            starts_at, ends_at, usage_limit, usage_count, is_active
     FROM promo_codes
     WHERE UPPER(code) = $1
     LIMIT 1`,
    [normalizedCode]
  );

  if (rows.length === 0) {
    return { ok: false, error: "Промокод не найден" } as const;
  }

  const promo = rows[0];
  const now = Date.now();

  if (!promo.is_active) {
    return { ok: false, error: "Промокод неактивен" } as const;
  }
  if (promo.starts_at && new Date(promo.starts_at).getTime() > now) {
    return { ok: false, error: "Промокод ещё не активен" } as const;
  }
  if (promo.ends_at && new Date(promo.ends_at).getTime() < now) {
    return { ok: false, error: "Срок действия промокода истёк" } as const;
  }
  if (subtotal < promo.min_order_amount) {
    return { ok: false, error: `Минимальная сумма заказа для промокода: ${promo.min_order_amount} ₽` } as const;
  }
  if (promo.usage_limit !== null && promo.usage_count >= promo.usage_limit) {
    return { ok: false, error: "Промокод исчерпал лимит использования" } as const;
  }

  let discountAmount = 0;
  if (promo.discount_type === "percent") {
    discountAmount = Math.round((subtotal * promo.discount_value) / 100);
  } else {
    discountAmount = promo.discount_value;
  }

  if (promo.max_discount_amount !== null) {
    discountAmount = Math.min(discountAmount, promo.max_discount_amount);
  }

  discountAmount = Math.min(discountAmount, subtotal);

  return {
    ok: true,
    promo,
    discountAmount,
  } as const;
}

router.get("/account/profile", async (req: Request, res: Response) => {
  const sessionId = normalizeSessionId(req.query.session_id);
  if (!sessionId) {
    return res.status(400).json({ error: "session_id обязателен" });
  }

  try {
    const profile = await getStoreProfile(sessionId);
    const addressRows = await getAccountAddresses(sessionId);
    res.json({ profile, addresses: addressRows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.put("/account/profile", async (req: Request, res: Response) => {
  const sessionId = normalizeSessionId(req.body.session_id);
  if (!sessionId) {
    return res.status(400).json({ error: "session_id обязателен" });
  }

  try {
    const profile = await upsertStoreProfile(sessionId, {
      last_name: normalizeText(req.body.last_name) || null,
      first_name: normalizeText(req.body.first_name) || null,
      middle_name: normalizeText(req.body.middle_name) || null,
      email: normalizeText(req.body.email) || null,
      phone: normalizeText(req.body.phone) || null,
      avatar_url: typeof req.body.avatar_url === "string" ? req.body.avatar_url : null,
    });

    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.get("/account/addresses", async (req: Request, res: Response) => {
  const sessionId = normalizeSessionId(req.query.session_id);
  if (!sessionId) {
    return res.status(400).json({ error: "session_id обязателен" });
  }

  try {
    const rows = await getAccountAddresses(sessionId);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.post("/account/addresses", async (req: Request, res: Response) => {
  const sessionId = normalizeSessionId(req.body.session_id);
  if (!sessionId) {
    return res.status(400).json({ error: "session_id обязателен" });
  }

  const payload = normalizeAddressPayload(req.body);
  const validationError = validateAddressPayload(payload);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: countRows } = await client.query(
      `SELECT COUNT(*)::int AS count
       FROM customer_addresses
       WHERE session_id = $1`,
      [sessionId]
    );
    const shouldBeDefault = payload.is_default || Number(countRows[0]?.count || 0) === 0;

    if (shouldBeDefault) {
      await client.query(
        `UPDATE customer_addresses
         SET is_default = FALSE,
             updated_at = NOW()
         WHERE session_id = $1
           AND is_default = TRUE`,
        [sessionId]
      );
    }

    await client.query(
      `INSERT INTO customer_addresses (
         user_id,
         session_id,
         label,
         customer_name,
         email,
         phone,
         country,
         city,
         postal_code,
         address_line1,
         address_line2,
         is_default,
         updated_at
       )
       VALUES (NULL, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
      [
        sessionId,
        payload.label,
        payload.customer_name,
        payload.email,
        payload.phone,
        payload.country,
        payload.city,
        payload.postal_code,
        payload.address_line1,
        payload.address_line2,
        shouldBeDefault,
      ]
    );

    await client.query("COMMIT");
    const rows = await getAccountAddresses(sessionId);
    res.status(201).json(rows);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  } finally {
    client.release();
  }
});

router.put("/account/addresses/:addressId", async (req: Request, res: Response) => {
  const sessionId = normalizeSessionId(req.body.session_id);
  const addressId = Number(req.params.addressId);

  if (!sessionId || !Number.isFinite(addressId)) {
    return res.status(400).json({ error: "Укажите session_id и address_id" });
  }

  const payload = normalizeAddressPayload(req.body);
  const validationError = validateAddressPayload(payload);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: existingRows } = await client.query(
      `SELECT id
       FROM customer_addresses
       WHERE id = $1 AND session_id = $2
       FOR UPDATE`,
      [addressId, sessionId]
    );

    if (existingRows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Адрес не найден" });
    }

    if (payload.is_default) {
      await client.query(
        `UPDATE customer_addresses
         SET is_default = FALSE,
             updated_at = NOW()
         WHERE session_id = $1
           AND id <> $2
           AND is_default = TRUE`,
        [sessionId, addressId]
      );
    }

    await client.query(
      `UPDATE customer_addresses
       SET label = $1,
           customer_name = $2,
           email = $3,
           phone = $4,
           country = $5,
           city = $6,
           postal_code = $7,
           address_line1 = $8,
           address_line2 = $9,
           is_default = $10,
           updated_at = NOW()
       WHERE id = $11 AND session_id = $12`,
      [
        payload.label,
        payload.customer_name,
        payload.email,
        payload.phone,
        payload.country,
        payload.city,
        payload.postal_code,
        payload.address_line1,
        payload.address_line2,
        payload.is_default,
        addressId,
        sessionId,
      ]
    );

    const { rows: defaultRows } = await client.query(
      `SELECT id
       FROM customer_addresses
       WHERE session_id = $1 AND is_default = TRUE
       LIMIT 1`,
      [sessionId]
    );

    if (defaultRows.length === 0) {
      await client.query(
        `UPDATE customer_addresses
         SET is_default = TRUE,
             updated_at = NOW()
         WHERE id = $1 AND session_id = $2`,
        [addressId, sessionId]
      );
    }

    await client.query("COMMIT");
    const rows = await getAccountAddresses(sessionId);
    res.json(rows);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  } finally {
    client.release();
  }
});

router.patch("/account/addresses/:addressId/default", async (req: Request, res: Response) => {
  const sessionId = normalizeSessionId(req.body.session_id);
  const addressId = Number(req.params.addressId);

  if (!sessionId || !Number.isFinite(addressId)) {
    return res.status(400).json({ error: "Укажите session_id и address_id" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: existingRows } = await client.query(
      `SELECT id
       FROM customer_addresses
       WHERE id = $1 AND session_id = $2
       FOR UPDATE`,
      [addressId, sessionId]
    );

    if (existingRows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Адрес не найден" });
    }

    await client.query(
      `UPDATE customer_addresses
       SET is_default = FALSE,
           updated_at = NOW()
       WHERE session_id = $1
         AND is_default = TRUE`,
      [sessionId]
    );

    await client.query(
      `UPDATE customer_addresses
       SET is_default = TRUE,
           updated_at = NOW()
       WHERE id = $1 AND session_id = $2`,
      [addressId, sessionId]
    );

    await client.query("COMMIT");
    const rows = await getAccountAddresses(sessionId);
    res.json(rows);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  } finally {
    client.release();
  }
});

router.delete("/account/addresses/:addressId", async (req: Request, res: Response) => {
  const sessionId = normalizeSessionId(req.query.session_id);
  const addressId = Number(req.params.addressId);

  if (!sessionId || !Number.isFinite(addressId)) {
    return res.status(400).json({ error: "Укажите session_id и address_id" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: existingRows } = await client.query<{ is_default: boolean }>(
      `SELECT is_default
       FROM customer_addresses
       WHERE id = $1 AND session_id = $2
       FOR UPDATE`,
      [addressId, sessionId]
    );

    if (existingRows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Адрес не найден" });
    }

    await client.query(
      `DELETE FROM customer_addresses
       WHERE id = $1 AND session_id = $2`,
      [addressId, sessionId]
    );

    if (existingRows[0].is_default) {
      await client.query(
        `UPDATE customer_addresses
         SET is_default = TRUE,
             updated_at = NOW()
         WHERE id = (
           SELECT id
           FROM customer_addresses
           WHERE session_id = $1
           ORDER BY updated_at DESC, created_at DESC, id DESC
           LIMIT 1
         )`,
        [sessionId]
      );
    }

    await client.query("COMMIT");
    const rows = await getAccountAddresses(sessionId);
    res.json(rows);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  } finally {
    client.release();
  }
});

router.get("/account/orders", async (req: Request, res: Response) => {
  const sessionId = normalizeSessionId(req.query.session_id);
  if (!sessionId) {
    return res.status(400).json({ error: "session_id обязателен" });
  }

  try {
    const { rows } = await pool.query(
      `SELECT id,
              status,
              total_amount,
              delivery_method,
              payment_method,
              payment_status,
              payment_provider,
              delivery_address,
              carrier,
              tracking_number,
              shipped_at,
              is_test,
              test_run_id,
              created_at,
              updated_at
       FROM orders
      WHERE session_id = $1
       ORDER BY created_at DESC, id DESC`,
      [sessionId]
    );
    res.json(rows.map((row) => ({ ...row, status: normalizeOrderStatus(row.status) })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.get("/wishlist", async (req: Request, res: Response) => {
  const sessionId = normalizeSessionId(req.query.session_id);
  if (!sessionId) {
    return res.status(400).json({ error: "session_id обязателен" });
  }

  try {
    const rows = await getWishlistProducts(sessionId);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.post("/wishlist/items", async (req: Request, res: Response) => {
  const sessionId = normalizeSessionId(req.body.session_id);
  const productId = Number(req.body.product_id);

  if (!sessionId || !Number.isFinite(productId)) {
    return res.status(400).json({ error: "Укажите session_id и product_id" });
  }

  try {
    const wishlistId = await getOrCreateWishlist(sessionId);
    await pool.query(
      `INSERT INTO wishlist_items (wishlist_id, product_id)
       VALUES ($1, $2)
       ON CONFLICT (wishlist_id, product_id) DO NOTHING`,
      [wishlistId, productId]
    );

    const rows = await getWishlistProducts(sessionId);
    res.status(201).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.delete("/wishlist/items/:productId", async (req: Request, res: Response) => {
  const sessionId = normalizeSessionId(req.query.session_id);
  const productId = Number(req.params.productId);

  if (!sessionId || !Number.isFinite(productId)) {
    return res.status(400).json({ error: "Укажите session_id и product_id" });
  }

  try {
    await pool.query(
      `DELETE FROM wishlist_items wi
       USING wishlists w
       WHERE wi.wishlist_id = w.id
         AND w.session_id = $1
         AND wi.product_id = $2`,
      [sessionId, productId]
    );

    const rows = await getWishlistProducts(sessionId);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.get("/cart", async (req: Request, res: Response) => {
  const sessionId = normalizeSessionId(req.query.session_id);
  if (!sessionId) {
    return res.status(400).json({ error: "session_id обязателен" });
  }

  try {
    const payload = await buildCartResponse(sessionId);
    res.json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.post("/cart/items", async (req: Request, res: Response) => {
  const sessionId = normalizeSessionId(req.body.session_id);
  const productId = Number(req.body.product_id);
  const productVariantId = req.body.product_variant_id ? Number(req.body.product_variant_id) : null;
  const size = normalizeText(req.body.size) || null;
  const quantity = Math.max(1, Number(req.body.quantity || 1));

  if (!sessionId || !Number.isFinite(productId)) {
    return res.status(400).json({ error: "Укажите session_id и product_id" });
  }

  try {
    const { rows: productRows } = await pool.query(
      `SELECT id, name, price, image_url
       FROM products
       WHERE id = $1
       LIMIT 1`,
      [productId]
    );

    if (productRows.length === 0) {
      return res.status(404).json({ error: "Товар не найден" });
    }

    const product = productRows[0];
    const variant = await resolveVariant({ productId, productVariantId, size });
    const cart = await getOrCreateCart(sessionId);
    const finalVariantId = variant?.id ?? null;
    const finalSize = normalizeText(variant?.size || size) || null;
    const finalPrice = variant?.price ?? product.price;

    const { rows: existingRows } = await pool.query(
      `SELECT id, quantity
       FROM cart_items
       WHERE cart_id = $1
         AND product_id = $2
         AND (
           (product_variant_id IS NULL AND $3::int IS NULL)
           OR product_variant_id = $3
         )
         AND COALESCE(size, '') = COALESCE($4, '')
       LIMIT 1`,
      [cart.id, productId, finalVariantId, finalSize]
    );

    if (existingRows.length > 0) {
      await pool.query(
        `UPDATE cart_items
         SET quantity = quantity + $1,
             unit_price = $2,
             updated_at = NOW()
         WHERE id = $3`,
        [quantity, finalPrice, existingRows[0].id]
      );
    } else {
      await pool.query(
        `INSERT INTO cart_items (
           cart_id,
           product_id,
           product_variant_id,
           product_name,
           image_url,
           size,
           unit_price,
           quantity
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [cart.id, productId, finalVariantId, product.name, product.image_url, finalSize, finalPrice, quantity]
      );
    }

    const payload = await buildCartResponse(sessionId);
    res.status(201).json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.put("/cart/items/:itemId", async (req: Request, res: Response) => {
  const sessionId = normalizeSessionId(req.body.session_id);
  const itemId = Number(req.params.itemId);
  const quantity = Number(req.body.quantity);

  if (!sessionId || !Number.isFinite(itemId) || !Number.isFinite(quantity)) {
    return res.status(400).json({ error: "Укажите session_id, item_id и quantity" });
  }

  try {
    if (quantity <= 0) {
      await pool.query(
        `DELETE FROM cart_items ci
         USING carts c
         WHERE ci.cart_id = c.id
           AND ci.id = $1
           AND c.session_id = $2
           AND c.status = 'active'`,
        [itemId, sessionId]
      );
    } else {
      await pool.query(
        `UPDATE cart_items ci
         SET quantity = $1,
             updated_at = NOW()
         FROM carts c
         WHERE ci.cart_id = c.id
           AND ci.id = $2
           AND c.session_id = $3
           AND c.status = 'active'`,
        [quantity, itemId, sessionId]
      );
    }

    const payload = await buildCartResponse(sessionId);
    res.json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.delete("/cart/items/:itemId", async (req: Request, res: Response) => {
  const sessionId = normalizeSessionId(req.query.session_id);
  const itemId = Number(req.params.itemId);

  if (!sessionId || !Number.isFinite(itemId)) {
    return res.status(400).json({ error: "Укажите session_id и item_id" });
  }

  try {
    await pool.query(
      `DELETE FROM cart_items ci
       USING carts c
       WHERE ci.cart_id = c.id
         AND ci.id = $1
         AND c.session_id = $2
         AND c.status = 'active'`,
      [itemId, sessionId]
    );

    const payload = await buildCartResponse(sessionId);
    res.json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.post("/promo-codes/validate", async (req: Request, res: Response) => {
  const code = normalizeText(req.body.code);
  const subtotal = Number(req.body.subtotal || 0);

  if (!code) {
    return res.status(400).json({ error: "Укажите промокод" });
  }

  try {
    const result = await validatePromoCode(code, subtotal);
    if (!result || !result.ok) {
      return res.status(400).json({ error: result?.error || "Промокод недоступен" });
    }

    res.json({
      code: result.promo.code,
      discount_amount: result.discountAmount,
      discount_type: result.promo.discount_type,
      discount_value: result.promo.discount_value,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.get("/checkout/options", async (_req: Request, res: Response) => {
  try {
    const [shippingMethods, paymentMethods] = await Promise.all([getShippingMethods(), getPaymentMethods()]);
    res.json({
      shipping_methods: shippingMethods,
      payment_methods: paymentMethods,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.post("/checkout", async (req: Request, res: Response) => {
  const sessionId = normalizeSessionId(req.body.session_id);
  const customer = req.body.customer || {};
  const shippingAddress = req.body.shipping_address || {};
  const billingAddress = req.body.billing_address || null;
  const shippingAddressId = Number.isInteger(Number(req.body.shipping_address_id)) && Number(req.body.shipping_address_id) > 0
    ? Number(req.body.shipping_address_id)
    : null;
  const billingAddressId = Number.isInteger(Number(req.body.billing_address_id)) && Number(req.body.billing_address_id) > 0
    ? Number(req.body.billing_address_id)
    : null;
  const saveShippingAddress = req.body.save_shipping_address !== false;
  const saveBillingAddress = req.body.save_billing_address !== false;
  const testRunId = normalizeText(req.body.test_run_id);
  const isTestOrder = req.body.is_test === true || Boolean(testRunId);
  const source = normalizeText(req.body.source) || (isTestOrder ? "e2e" : "storefront");
  const shippingOption = normalizeText(req.body.shipping_option) || "standard";
  const paymentMethod = normalizeText(req.body.payment_method) || "card";
  const promoCode = normalizeText(req.body.promo_code);

  if (!sessionId) {
    return res.status(400).json({ error: "session_id обязателен" });
  }

  if (!normalizeText(customer.email) || !normalizeText(customer.first_name) || !normalizeText(customer.last_name)) {
    return res.status(400).json({ error: "Укажите email, имя и фамилию" });
  }

  if (
    !shippingAddressId &&
    (!normalizeText(shippingAddress.address_line1) || !normalizeText(shippingAddress.city) || !normalizeText(shippingAddress.country))
  ) {
    return res.status(400).json({ error: "Укажите адрес доставки, город и страну" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let resolvedShippingAddress = shippingAddress;
    let resolvedBillingAddress = billingAddress;

    if (shippingAddressId) {
      const { rows } = await client.query(
        `SELECT id, country, city, postal_code, address_line1, address_line2
         FROM customer_addresses
         WHERE id = $1
           AND session_id = $2
         LIMIT 1`,
        [shippingAddressId, sessionId]
      );

      if (rows.length === 0) {
        throw new Error("Адрес доставки недоступен");
      }

      resolvedShippingAddress = rows[0];
    }

    if (billingAddressId) {
      const { rows } = await client.query(
        `SELECT id, email, phone, country, city, postal_code, address_line1, address_line2
         FROM customer_addresses
         WHERE id = $1
           AND session_id = $2
         LIMIT 1`,
        [billingAddressId, sessionId]
      );

      if (rows.length === 0) {
        throw new Error("Адрес для счёта недоступен");
      }

      resolvedBillingAddress = rows[0];
    }

    const { rows: cartRows } = await client.query(
      `SELECT id
       FROM carts
       WHERE session_id = $1 AND status = 'active'
       LIMIT 1`,
      [sessionId]
    );

    if (cartRows.length === 0) {
      throw new Error("Корзина пуста");
    }

    const cartId = cartRows[0].id as number;

    const { rows: itemRows } = await client.query<{
      id: number;
      product_id: number | null;
      product_variant_id: number | null;
      product_name: string;
      image_url: string | null;
      size: string | null;
      unit_price: number;
      quantity: number;
    }>(
      `SELECT id, product_id, product_variant_id, product_name, image_url, size, unit_price, quantity
       FROM cart_items
       WHERE cart_id = $1
       ORDER BY id ASC`,
      [cartId]
    );

    if (itemRows.length === 0) {
      throw new Error("Корзина пуста");
    }

    const subtotal = itemRows.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
    const shippingMethod = await resolveShippingMethod(shippingOption, client);
    const paymentMethodRow = await resolvePaymentMethod(paymentMethod, client);

    if (!shippingMethod) {
      throw new Error("Способ доставки недоступен");
    }

    if (!paymentMethodRow) {
      throw new Error("Способ оплаты недоступен");
    }

    const shippingPrice = shippingMethod.price;
    const paymentStatus = paymentMethodRow.requires_card ? "paid" : "pending";
    const paymentProvider = paymentMethodRow.requires_card ? "mock-card" : "cash-on-delivery";
    const paymentReference = paymentMethodRow.requires_card ? `mock-card-${Date.now()}` : null;
    const paidAt = paymentStatus === "paid" ? new Date() : null;

    let promoValidation: Awaited<ReturnType<typeof validatePromoCode>> | null = null;
    let discountAmount = 0;
    if (promoCode) {
      promoValidation = await validatePromoCode(promoCode, subtotal);
      if (!promoValidation || !promoValidation.ok) {
        throw new Error(promoValidation?.error || "Промокод недоступен");
      }
      discountAmount = promoValidation.discountAmount;
    }

    const totalAmount = Math.max(subtotal - discountAmount, 0) + shippingPrice;
    const customerName = `${normalizeText(customer.last_name)} ${normalizeText(customer.first_name)}${normalizeText(customer.middle_name) ? ` ${normalizeText(customer.middle_name)}` : ""}`.trim();
    const deliveryAddress = [
      normalizeText(resolvedShippingAddress.country),
      normalizeText(resolvedShippingAddress.city),
      normalizeText(resolvedShippingAddress.address_line1),
      normalizeText(resolvedShippingAddress.address_line2),
      normalizeText(resolvedShippingAddress.postal_code),
    ]
      .filter(Boolean)
      .join(", ");

    const { rows: orderRows } = await client.query<{ id: number }>(
      `INSERT INTO orders (
         user_id,
         session_id,
         status,
         total_amount,
         customer_name,
         phone,
         email,
         delivery_address,
         payment_method,
         payment_status,
         payment_provider,
         payment_reference,
         paid_at,
         delivery_method,
         comment,
         is_test,
         test_run_id,
         source
       )
       VALUES ($1, $2, 'new', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING id`,
      [
        null,
        sessionId,
        totalAmount,
        customerName,
        normalizeText(customer.phone) || null,
        normalizeText(customer.email),
        deliveryAddress,
        paymentMethodRow.name,
        paymentStatus,
        paymentProvider,
        paymentReference,
        paidAt,
        shippingMethod.name,
        promoCode ? `Промокод: ${promoCode}` : null,
        isTestOrder,
        testRunId || null,
        source,
      ]
    );

    const orderId = orderRows[0].id;

    for (const item of itemRows) {
      await client.query(
        `INSERT INTO order_items (
           order_id,
           product_id,
           product_variant_id,
           product_name,
           product_price,
           quantity,
           size
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          orderId,
          item.product_id,
          item.product_variant_id,
          item.product_name,
          item.unit_price,
          item.quantity,
          item.size,
        ]
      );
    }

    await client.query(
      `INSERT INTO order_status_history (order_id, previous_status, next_status, admin_id, note)
       VALUES ($1, NULL, 'new', NULL, 'Order created from storefront checkout')`,
      [orderId]
    );

    const { rows: existingProfileRows } = await client.query(
      `SELECT avatar_url
       FROM store_profiles
       WHERE session_id = $1
       LIMIT 1`,
      [sessionId]
    );

    await client.query(
      `INSERT INTO store_profiles (
         session_id,
         last_name,
         first_name,
         middle_name,
         email,
         phone,
         avatar_url,
         updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (session_id)
       DO UPDATE SET
         last_name = EXCLUDED.last_name,
         first_name = EXCLUDED.first_name,
         middle_name = EXCLUDED.middle_name,
         email = EXCLUDED.email,
         phone = EXCLUDED.phone,
         avatar_url = EXCLUDED.avatar_url,
         updated_at = NOW()`,
      [
        sessionId,
        normalizeText(customer.last_name) || null,
        normalizeText(customer.first_name) || null,
        normalizeText(customer.middle_name) || null,
        normalizeText(customer.email) || null,
        normalizeText(customer.phone) || null,
        existingProfileRows[0]?.avatar_url ?? null,
      ]
    );

    if (shippingAddressId || saveShippingAddress) {
      await client.query(
        `UPDATE customer_addresses
         SET is_default = FALSE,
             updated_at = NOW()
         WHERE session_id = $1
           AND is_default = TRUE`,
        [sessionId]
      );
    }

    if (shippingAddressId) {
      await client.query(
        `UPDATE customer_addresses
         SET is_default = TRUE,
             updated_at = NOW()
         WHERE id = $1
           AND session_id = $2`,
        [shippingAddressId, sessionId]
      );
    } else if (saveShippingAddress) {
      await client.query(
        `INSERT INTO customer_addresses (
           user_id,
           session_id,
           label,
           customer_name,
           email,
           phone,
           country,
           city,
           postal_code,
           address_line1,
           address_line2,
           is_default,
           is_test,
           test_run_id,
           source
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, TRUE, $12, $13, $14)`,
        [
          null,
          sessionId,
          "shipping",
          customerName,
          normalizeText(customer.email) || null,
          normalizeText(customer.phone) || null,
          normalizeText(resolvedShippingAddress.country) || null,
          normalizeText(resolvedShippingAddress.city) || null,
          normalizeText(resolvedShippingAddress.postal_code) || null,
          normalizeText(resolvedShippingAddress.address_line1),
          normalizeText(resolvedShippingAddress.address_line2) || null,
          isTestOrder,
          testRunId || null,
          source,
        ]
      );
    }

    if (!billingAddressId && saveBillingAddress && resolvedBillingAddress && normalizeText(resolvedBillingAddress.address_line1)) {
      await client.query(
        `INSERT INTO customer_addresses (
           user_id,
           session_id,
           label,
           customer_name,
           email,
           phone,
           country,
           city,
           postal_code,
           address_line1,
           address_line2,
           is_default,
           is_test,
           test_run_id,
           source
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, FALSE, $12, $13, $14)`,
        [
          null,
          sessionId,
          "billing",
          customerName,
          normalizeText(resolvedBillingAddress.email) || null,
          normalizeText(resolvedBillingAddress.phone) || null,
          normalizeText(resolvedBillingAddress.country) || null,
          normalizeText(resolvedBillingAddress.city) || null,
          normalizeText(resolvedBillingAddress.postal_code) || null,
          normalizeText(resolvedBillingAddress.address_line1),
          normalizeText(resolvedBillingAddress.address_line2) || null,
          isTestOrder,
          testRunId || null,
          source,
        ]
      );
    }

    if (promoValidation && promoValidation.ok) {
      await client.query(
        `INSERT INTO promo_code_redemptions (promo_code_id, order_id, user_id, session_id, discount_amount)
         VALUES ($1, $2, NULL, $3, $4)`,
        [promoValidation.promo.id, orderId, sessionId, discountAmount]
      );

      await client.query(
        `UPDATE promo_codes
         SET usage_count = usage_count + 1,
             updated_at = NOW()
         WHERE id = $1`,
        [promoValidation.promo.id]
      );
    }

    await client.query(
      `UPDATE carts
       SET status = 'converted',
           promo_code_id = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [cartId]
    );

    await client.query("COMMIT");

    res.status(201).json({
      order_id: orderId,
      subtotal,
      shipping_price: shippingPrice,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      shipping_method: shippingMethod.name,
      payment_method: paymentMethodRow.name,
      payment_status: paymentStatus,
      payment_provider: paymentProvider,
      payment_reference: paymentReference,
      status: "new",
      is_test: isTestOrder,
      test_run_id: testRunId || null,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    const message = err instanceof Error ? err.message : "Ошибка сервера";
    const badRequestMessages = new Set([
      "Корзина пуста",
      "Способ доставки недоступен",
      "Способ оплаты недоступен",
    ]);
    res.status(badRequestMessages.has(message) ? 400 : 500).json({ error: message });
  } finally {
    client.release();
  }
});

export default router;
