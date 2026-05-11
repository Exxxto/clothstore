import { Pool, type PoolClient } from "pg";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import logger from "../lib/logger";
import { generateProducts, normalizeClothingType, normalizeGender, pickProductImage } from "../../../src/lib/productCatalog";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

type ColumnRow = {
  column_name: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeSizeValue(value: string | null | undefined) {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  return normalized || null;
}

function buildVariantSku(productSlug: string | null, productName: string, productId: number, size: string | null, index: number) {
  const base = productSlug || `${slugify(productName) || "product"}-${productId}`;
  return `${base}-${size ? slugify(size) : `std-${index + 1}`}`.slice(0, 120);
}

function buildVariantName(productName: string, size: string | null) {
  return size ? `${productName} / ${size}` : `${productName} / Standard`;
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initDB() {
  const client = await pool.connect();
  try {
    // Таблица категорий
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL UNIQUE,
        slug VARCHAR(180) NOT NULL UNIQUE,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Таблица администраторов
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        last_name VARCHAR(100) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        middle_name VARCHAR(100),
        username VARCHAR(100) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Таблица пользователей
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        last_name VARCHAR(100) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        middle_name VARCHAR(100),
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        phone VARCHAR(50),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Миграция старой схемы users -> отдельные поля ФИО
    const { rows: userColumns } = await client.query(
      `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'users'
      `
    );
    const existingUserColumns = new Set(userColumns.map((row: ColumnRow) => row.column_name));

    if (existingUserColumns.has("full_name")) {
      if (!existingUserColumns.has("last_name")) {
        await client.query(`ALTER TABLE users ADD COLUMN last_name VARCHAR(100)`);
      }
      if (!existingUserColumns.has("first_name")) {
        await client.query(`ALTER TABLE users ADD COLUMN first_name VARCHAR(100)`);
      }
      if (!existingUserColumns.has("middle_name")) {
        await client.query(`ALTER TABLE users ADD COLUMN middle_name VARCHAR(100)`);
      }

      await client.query(`
        UPDATE users
        SET
          last_name = COALESCE(last_name, split_part(full_name, ' ', 1)),
          first_name = COALESCE(first_name, NULLIF(split_part(full_name, ' ', 2), '')),
          middle_name = COALESCE(
            middle_name,
            NULLIF(
              trim(
                substring(full_name from '^[^ ]+ [^ ]+ (.*)$')
              ),
              ''
            )
          )
        WHERE full_name IS NOT NULL
      `);

      await client.query(`
        UPDATE users
        SET first_name = COALESCE(first_name, ''),
            last_name = COALESCE(last_name, '')
        WHERE first_name IS NULL OR last_name IS NULL
      `);

      await client.query(`ALTER TABLE users ALTER COLUMN last_name SET NOT NULL`);
      await client.query(`ALTER TABLE users ALTER COLUMN first_name SET NOT NULL`);
      await client.query(`ALTER TABLE users DROP COLUMN full_name`);
    }

    await client.query(`
      INSERT INTO categories (name, slug, description)
      VALUES
        ('Футболки', 'futbolki', 'Футболки и базовые верхние слои'),
        ('Джинсы', 'dzhinsy', 'Джинсы и деним'),
        ('Куртки', 'kurtki', 'Верхняя одежда'),
        ('Обувь', 'obuv', 'Кроссовки, кеды и другая обувь'),
        ('Свитеры', 'svitery', 'Свитеры, худи и трикотаж')
      ON CONFLICT (slug) DO NOTHING
    `);

    // Таблица товаров
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(255),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        gender VARCHAR(50) NOT NULL,
        price INTEGER NOT NULL,
        old_price INTEGER,
        image_url TEXT,
        season VARCHAR(50) NOT NULL,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        is_new BOOLEAN DEFAULT FALSE,
        sizes TEXT[] NOT NULL DEFAULT '{}',
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    const { rows: productColumns } = await client.query(
      `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'products'
      `
    );
    const existingProductColumns = new Set(productColumns.map((row: ColumnRow) => row.column_name));
    if (!existingProductColumns.has("slug")) {
      await client.query(`ALTER TABLE products ADD COLUMN slug VARCHAR(255)`);
    }
    if (!existingProductColumns.has("category_id")) {
      await client.query(`ALTER TABLE products ADD COLUMN category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL`);
    }
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.table_constraints
          WHERE constraint_name = 'products_category_id_fkey'
        ) THEN
          ALTER TABLE products
          ADD CONSTRAINT products_category_id_fkey
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `);
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'products_slug_key'
        ) THEN
          ALTER TABLE products
          ADD CONSTRAINT products_slug_key UNIQUE (slug);
        END IF;
      END $$;
    `);

    // Таблица изображений товаров
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_images (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        alt_text VARCHAR(255),
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_primary BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Таблица заказов
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        session_id VARCHAR(120),
        status VARCHAR(50) NOT NULL DEFAULT 'new',
        total_amount INTEGER NOT NULL DEFAULT 0,
        customer_name VARCHAR(255),
        phone VARCHAR(50),
        email VARCHAR(255),
        delivery_address TEXT,
        payment_method VARCHAR(80),
        payment_status VARCHAR(40) NOT NULL DEFAULT 'pending',
        payment_provider VARCHAR(80),
        payment_reference VARCHAR(160),
        paid_at TIMESTAMP,
        delivery_method VARCHAR(80),
        carrier VARCHAR(120),
        tracking_number VARCHAR(160),
        shipped_at TIMESTAMP,
        comment TEXT,
        is_test BOOLEAN NOT NULL DEFAULT FALSE,
        test_run_id VARCHAR(120),
        source VARCHAR(80) NOT NULL DEFAULT 'storefront',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS session_id VARCHAR(120)
    `);

    await client.query(`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS payment_status VARCHAR(40) NOT NULL DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(80),
      ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(160),
      ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS carrier VARCHAR(120),
      ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(160),
      ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS test_run_id VARCHAR(120),
      ADD COLUMN IF NOT EXISTS source VARCHAR(80) NOT NULL DEFAULT 'storefront'
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON orders(payment_status);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS orders_test_run_idx ON orders(test_run_id) WHERE is_test = TRUE;
    `);

    // Таблица жалоб
    await client.query(`
      CREATE TABLE IF NOT EXISTS complaints (
        id SERIAL PRIMARY KEY,
        requester_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        order_number VARCHAR(80),
        category VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'new',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS complaints_status_idx ON complaints(status);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS complaints_created_at_idx ON complaints(created_at DESC);
    `);

    // Таблица позиций заказа
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        product_name VARCHAR(255) NOT NULL,
        product_price INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        size VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Таблица логов действий админов
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        admin_id INTEGER REFERENCES admins(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(100) NOT NULL,
        entity_id INTEGER,
        details JSONB,
        ip_address VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS collections (
        id SERIAL PRIMARY KEY,
        name VARCHAR(180) NOT NULL UNIQUE,
        slug VARCHAR(200) NOT NULL UNIQUE,
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS size_charts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(180) NOT NULL UNIQUE,
        gender VARCHAR(50),
        product_type VARCHAR(100),
        description TEXT,
        measurements JSONB NOT NULL DEFAULT '[]'::jsonb,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS product_variants (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        sku VARCHAR(120) NOT NULL UNIQUE,
        variant_name VARCHAR(255) NOT NULL,
        size VARCHAR(50),
        color VARCHAR(80),
        barcode VARCHAR(120),
        price INTEGER NOT NULL,
        old_price INTEGER,
        cost_price INTEGER,
        stock_tracking BOOLEAN NOT NULL DEFAULT TRUE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        auto_generated BOOLEAN NOT NULL DEFAULT TRUE,
        attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS product_variants_product_id_idx ON product_variants(product_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS product_variants_size_idx ON product_variants(size);
    `);

    await client.query(`
      ALTER TABLE order_items
      ADD COLUMN IF NOT EXISTS product_variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS product_collections (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(product_id, collection_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS price_history (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        product_variant_id INTEGER REFERENCES product_variants(id) ON DELETE CASCADE,
        admin_id INTEGER REFERENCES admins(id) ON DELETE SET NULL,
        source VARCHAR(80) NOT NULL DEFAULT 'manual',
        old_price INTEGER,
        new_price INTEGER NOT NULL,
        old_old_price INTEGER,
        new_old_price INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS price_history_product_id_idx ON price_history(product_id, created_at DESC);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS warehouses (
        id SERIAL PRIMARY KEY,
        name VARCHAR(180) NOT NULL UNIQUE,
        code VARCHAR(80) NOT NULL UNIQUE,
        city VARCHAR(120),
        address TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_balances (
        id SERIAL PRIMARY KEY,
        warehouse_id INTEGER NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
        product_variant_id INTEGER NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
        quantity_on_hand INTEGER NOT NULL DEFAULT 0,
        quantity_reserved INTEGER NOT NULL DEFAULT 0,
        reorder_point INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(warehouse_id, product_variant_id)
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS stock_balances_variant_idx ON stock_balances(product_variant_id);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id SERIAL PRIMARY KEY,
        warehouse_id INTEGER NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
        product_variant_id INTEGER NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
        movement_type VARCHAR(50) NOT NULL,
        quantity_delta INTEGER NOT NULL,
        quantity_after INTEGER NOT NULL,
        reason VARCHAR(120),
        reference_type VARCHAR(80),
        reference_id INTEGER,
        admin_id INTEGER REFERENCES admins(id) ON DELETE SET NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS stock_movements_variant_idx ON stock_movements(product_variant_id, created_at DESC);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS customer_addresses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        session_id VARCHAR(120),
        label VARCHAR(120),
        customer_name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        country VARCHAR(120),
        city VARCHAR(120),
        postal_code VARCHAR(40),
        address_line1 TEXT NOT NULL,
        address_line2 TEXT,
        is_default BOOLEAN NOT NULL DEFAULT FALSE,
        is_test BOOLEAN NOT NULL DEFAULT FALSE,
        test_run_id VARCHAR(120),
        source VARCHAR(80) NOT NULL DEFAULT 'storefront',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      ALTER TABLE customer_addresses
      ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS test_run_id VARCHAR(120),
      ADD COLUMN IF NOT EXISTS source VARCHAR(80) NOT NULL DEFAULT 'storefront'
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS customer_addresses_user_id_idx ON customer_addresses(user_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS customer_addresses_session_id_idx ON customer_addresses(session_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS customer_addresses_test_run_idx ON customer_addresses(test_run_id) WHERE is_test = TRUE;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS store_profiles (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(120) NOT NULL UNIQUE,
        last_name VARCHAR(100),
        first_name VARCHAR(100),
        middle_name VARCHAR(100),
        email VARCHAR(255),
        phone VARCHAR(50),
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS store_profiles_session_id_idx ON store_profiles(session_id);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS promo_codes (
        id SERIAL PRIMARY KEY,
        code VARCHAR(80) NOT NULL UNIQUE,
        description TEXT,
        discount_type VARCHAR(20) NOT NULL,
        discount_value INTEGER NOT NULL,
        min_order_amount INTEGER NOT NULL DEFAULT 0,
        max_discount_amount INTEGER,
        starts_at TIMESTAMP,
        ends_at TIMESTAMP,
        usage_limit INTEGER,
        usage_count INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS shipping_methods (
        id SERIAL PRIMARY KEY,
        code VARCHAR(80) NOT NULL UNIQUE,
        name VARCHAR(180) NOT NULL,
        description TEXT,
        price INTEGER NOT NULL DEFAULT 0,
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS shipping_methods_active_idx ON shipping_methods(is_active, sort_order);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_methods (
        id SERIAL PRIMARY KEY,
        code VARCHAR(80) NOT NULL UNIQUE,
        name VARCHAR(180) NOT NULL,
        description TEXT,
        requires_card BOOLEAN NOT NULL DEFAULT FALSE,
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS payment_methods_active_idx ON payment_methods(is_active, sort_order);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS carts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        session_id VARCHAR(120),
        status VARCHAR(30) NOT NULL DEFAULT 'active',
        currency VARCHAR(10) NOT NULL DEFAULT 'RUB',
        promo_code_id INTEGER REFERENCES promo_codes(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS carts_active_session_idx
      ON carts(session_id)
      WHERE status = 'active' AND session_id IS NOT NULL
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS carts_active_user_idx
      ON carts(user_id)
      WHERE status = 'active' AND user_id IS NOT NULL
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id SERIAL PRIMARY KEY,
        cart_id INTEGER NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        product_variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
        product_name VARCHAR(255) NOT NULL,
        image_url TEXT,
        size VARCHAR(50),
        unit_price INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS cart_items_cart_id_idx ON cart_items(cart_id);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS wishlists (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        session_id VARCHAR(120),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS wishlists_session_id_idx
      ON wishlists(session_id)
      WHERE session_id IS NOT NULL
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS wishlists_user_id_idx
      ON wishlists(user_id)
      WHERE user_id IS NOT NULL
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS wishlist_items (
        id SERIAL PRIMARY KEY,
        wishlist_id INTEGER NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(wishlist_id, product_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS promo_code_redemptions (
        id SERIAL PRIMARY KEY,
        promo_code_id INTEGER NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
        order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        session_id VARCHAR(120),
        discount_amount INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS promo_code_redemptions_promo_idx ON promo_code_redemptions(promo_code_id, created_at DESC);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS order_status_history (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        previous_status VARCHAR(50),
        next_status VARCHAR(50) NOT NULL,
        admin_id INTEGER REFERENCES admins(id) ON DELETE SET NULL,
        note TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS order_status_history_order_idx ON order_status_history(order_id, created_at DESC);
    `);

    // Таблица отзывов о товарах
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_reviews (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        session_id VARCHAR(120),
        author_name VARCHAR(255) NOT NULL,
        rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
        body TEXT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'published',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Миграция: добавить session_id если таблица уже существует без него
    await client.query(`
      ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS session_id VARCHAR(120)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS product_reviews_product_id_idx ON product_reviews(product_id, created_at DESC);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS product_reviews_status_idx ON product_reviews(status);
    `);

    // Сид товаров — отключён, товары управляются вручную через админку
    // await seedProducts(client);
    await syncProductImages(client);
    await seedWarehouses(client);
    await seedSizeCharts(client);
    await seedPromoCodes(client);
    await seedCheckoutMethods(client);
    await syncProductVariants(client);
    await seedOrders(client);
    await ensureOrderStatusHistory(client);

    // Сид первого админа
    const { rows: adminRows } = await client.query("SELECT COUNT(*) FROM admins");
    if (parseInt(adminRows[0].count) === 0) {
      await seedAdmins(client);
    }

    logger.info("✅ Database initialized");
  } finally {
    client.release();
  }
}

export async function logAuditAction(params: {
  adminId?: number | null;
  action: string;
  entityType: string;
  entityId?: number | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
}) {
  const { adminId = null, action, entityType, entityId = null, details = null, ipAddress = null } = params;

  await pool.query(
    `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, details, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [adminId, action, entityType, entityId, details, ipAddress]
  );
}

export async function logPriceHistory(params: {
  productId?: number | null;
  productVariantId?: number | null;
  adminId?: number | null;
  source?: string;
  oldPrice?: number | null;
  newPrice: number;
  oldOldPrice?: number | null;
  newOldPrice?: number | null;
}) {
  const {
    productId = null,
    productVariantId = null,
    adminId = null,
    source = "manual",
    oldPrice = null,
    newPrice,
    oldOldPrice = null,
    newOldPrice = null,
  } = params;

  await pool.query(
    `INSERT INTO price_history (
       product_id,
       product_variant_id,
       admin_id,
       source,
       old_price,
       new_price,
       old_old_price,
       new_old_price
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [productId, productVariantId, adminId, source, oldPrice, newPrice, oldOldPrice, newOldPrice]
  );
}

async function ensureVariantStockBalances(client: Pick<PoolClient, "query">, variantId: number) {
  await client.query(
    `
      INSERT INTO stock_balances (warehouse_id, product_variant_id, quantity_on_hand, quantity_reserved, reorder_point, updated_at)
      SELECT w.id, $1, 0, 0, 0, NOW()
      FROM warehouses w
      ON CONFLICT (warehouse_id, product_variant_id) DO NOTHING
    `,
    [variantId]
  );
}

async function ensureAllStockBalances(client: Pick<PoolClient, "query">) {
  await client.query(`
    INSERT INTO stock_balances (warehouse_id, product_variant_id, quantity_on_hand, quantity_reserved, reorder_point, updated_at)
    SELECT w.id, pv.id, 0, 0, 0, NOW()
    FROM warehouses w
    CROSS JOIN product_variants pv
    ON CONFLICT (warehouse_id, product_variant_id) DO NOTHING
  `);
}

export async function syncProductVariants(client: Pick<PoolClient, "query">, productId?: number) {
  const params: Array<number> = [];
  const productFilter = productId ? "WHERE p.id = $1" : "";
  if (productId) params.push(productId);

  const { rows: products } = await client.query<{
    id: number;
    slug: string | null;
    name: string;
    price: number;
    old_price: number | null;
    sizes: string[];
  }>(
    `
      SELECT p.id, p.slug, p.name, p.price, p.old_price, p.sizes
      FROM products p
      ${productFilter}
      ORDER BY p.id ASC
    `,
    params
  );

  for (const product of products) {
    const targetSizes = Array.from(
      new Set((product.sizes || []).map((size) => normalizeSizeValue(size)).filter((size): size is string => Boolean(size)))
    );
    const normalizedTargets = targetSizes.length > 0 ? targetSizes : [null];

    const { rows: existingVariants } = await client.query<{
      id: number;
      size: string | null;
      auto_generated: boolean;
    }>(
      `
        SELECT id, size, auto_generated
        FROM product_variants
        WHERE product_id = $1
        ORDER BY id ASC
      `,
      [product.id]
    );

    const existingGeneratedBySize = new Map(
      existingVariants
        .filter((variant) => variant.auto_generated)
        .map((variant) => [normalizeSizeValue(variant.size) ?? "__STANDARD__", variant])
    );

    for (const [index, size] of normalizedTargets.entries()) {
      const mapKey = size ?? "__STANDARD__";
      const existingVariant = existingGeneratedBySize.get(mapKey);
      const sku = buildVariantSku(product.slug, product.name, product.id, size, index);
      const variantName = buildVariantName(product.name, size);

      if (existingVariant) {
        await client.query(
          `
            UPDATE product_variants
            SET sku = $1,
                variant_name = $2,
                size = $3,
                price = $4,
                old_price = $5,
                is_active = TRUE,
                updated_at = NOW()
            WHERE id = $6
          `,
          [sku, variantName, size, product.price, product.old_price, existingVariant.id]
        );
        await ensureVariantStockBalances(client, existingVariant.id);
        existingGeneratedBySize.delete(mapKey);
      } else {
        const { rows } = await client.query<{ id: number }>(
          `
            INSERT INTO product_variants (
              product_id,
              sku,
              variant_name,
              size,
              price,
              old_price,
              auto_generated,
              is_active
            )
            VALUES ($1, $2, $3, $4, $5, $6, TRUE, TRUE)
            RETURNING id
          `,
          [product.id, sku, variantName, size, product.price, product.old_price]
        );
        await ensureVariantStockBalances(client, rows[0].id);
      }
    }

    for (const staleVariant of existingGeneratedBySize.values()) {
      await client.query(
        `
          UPDATE product_variants
          SET is_active = FALSE,
              updated_at = NOW()
          WHERE id = $1
        `,
        [staleVariant.id]
      );
    }
  }

  await ensureAllStockBalances(client);
}

export async function createStockMovement(params: {
  warehouseId: number;
  productVariantId: number;
  quantityDelta: number;
  movementType: string;
  reason?: string | null;
  referenceType?: string | null;
  referenceId?: number | null;
  adminId?: number | null;
  notes?: string | null;
}) {
  const {
    warehouseId,
    productVariantId,
    quantityDelta,
    movementType,
    reason = null,
    referenceType = null,
    referenceId = null,
    adminId = null,
    notes = null,
  } = params;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `
        INSERT INTO stock_balances (warehouse_id, product_variant_id, quantity_on_hand, quantity_reserved, reorder_point, updated_at)
        VALUES ($1, $2, 0, 0, 0, NOW())
        ON CONFLICT (warehouse_id, product_variant_id) DO NOTHING
      `,
      [warehouseId, productVariantId]
    );

    const { rows: balanceRows } = await client.query<{
      id: number;
      quantity_on_hand: number;
      quantity_reserved: number;
      reorder_point: number;
    }>(
      `
        SELECT id, quantity_on_hand, quantity_reserved, reorder_point
        FROM stock_balances
        WHERE warehouse_id = $1 AND product_variant_id = $2
        FOR UPDATE
      `,
      [warehouseId, productVariantId]
    );

    if (balanceRows.length === 0) {
      throw new Error("Остаток не найден");
    }

    const currentBalance = balanceRows[0];
    const nextQuantity = currentBalance.quantity_on_hand + quantityDelta;

    if (nextQuantity < 0) {
      throw new Error("Недостаточно остатка для списания");
    }

    const { rows: updatedRows } = await client.query<{
      id: number;
      warehouse_id: number;
      product_variant_id: number;
      quantity_on_hand: number;
      quantity_reserved: number;
      reorder_point: number;
      updated_at: string;
    }>(
      `
        UPDATE stock_balances
        SET quantity_on_hand = $1,
            updated_at = NOW()
        WHERE id = $2
        RETURNING id, warehouse_id, product_variant_id, quantity_on_hand, quantity_reserved, reorder_point, updated_at
      `,
      [nextQuantity, currentBalance.id]
    );

    await client.query(
      `
        INSERT INTO stock_movements (
          warehouse_id,
          product_variant_id,
          movement_type,
          quantity_delta,
          quantity_after,
          reason,
          reference_type,
          reference_id,
          admin_id,
          notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
      [
        warehouseId,
        productVariantId,
        movementType,
        quantityDelta,
        nextQuantity,
        reason,
        referenceType,
        referenceId,
        adminId,
        notes,
      ]
    );

    await client.query("COMMIT");
    return updatedRows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function seedAdmins(client: PoolClient) {
  const defaultPassword = process.env.ADMIN_PASSWORD || "admin123";
  const hash = await bcrypt.hash(defaultPassword, 10);
  await client.query(
    `INSERT INTO admins (last_name, first_name, middle_name, username, password_hash)
     VALUES ($1, $2, $3, $4, $5)`,
    ["Администратор", "Главный", null, process.env.ADMIN_USERNAME || "admin", hash]
  );
  logger.info("✅ Default admin created");
}

async function seedProducts(client: PoolClient) {
  const products = generateProducts({ menCount: 210, womenCount: 210, kidsCount: 30 });

  for (const p of products) {
    const slug = `${p.gender}-${p.type}-${String(p.id).padStart(3, "0")}`;
    await client.query(
      `INSERT INTO products (slug, name, type, gender, price, old_price, image_url, season, is_new, sizes, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (slug) DO NOTHING`,
      [slug, p.name, p.type, p.gender, p.price, p.oldPrice || null, p.image, p.season, p.isNew || false, p.sizes, p.description]
    );
  }
  // console.log(`✅ Seeded ${products.length} products`);
}

async function seedWarehouses(client: PoolClient) {
  await client.query(
    `
      INSERT INTO warehouses (name, code, city, address)
      VALUES
        ('Основной склад', 'MAIN', 'Екатеринбург', 'ул. Складская, 1'),
        ('Шоурум', 'SHOWROOM', 'Екатеринбург', 'ул. Малышева, 51')
      ON CONFLICT (code) DO NOTHING
    `
  );
}

async function seedSizeCharts(client: PoolClient) {
  const charts = [
    {
      name: "Мужская одежда",
      gender: "men",
      productType: null,
      description: "Базовая размерная сетка для мужских товаров",
      measurements: [
        { size: "S", chest: "88-92", waist: "76-80" },
        { size: "M", chest: "96-100", waist: "84-88" },
        { size: "L", chest: "104-108", waist: "92-96" },
        { size: "XL", chest: "112-116", waist: "100-104" },
      ],
    },
    {
      name: "Женская одежда",
      gender: "women",
      productType: null,
      description: "Базовая размерная сетка для женских товаров",
      measurements: [
        { size: "XS", bust: "80-84", waist: "60-64" },
        { size: "S", bust: "84-88", waist: "64-68" },
        { size: "M", bust: "88-92", waist: "68-72" },
        { size: "L", bust: "96-100", waist: "76-80" },
      ],
    },
    {
      name: "Детская одежда",
      gender: "kids",
      productType: null,
      description: "Базовая размерная сетка для детских товаров",
      measurements: [
        { size: "104", height: "99-104" },
        { size: "110", height: "105-110" },
        { size: "116", height: "111-116" },
        { size: "122", height: "117-122" },
      ],
    },
  ];

  for (const chart of charts) {
    await client.query(
      `
        INSERT INTO size_charts (name, gender, product_type, description, measurements)
        VALUES ($1, $2, $3, $4, $5::jsonb)
        ON CONFLICT DO NOTHING
      `,
      [chart.name, chart.gender, chart.productType, chart.description, JSON.stringify(chart.measurements)]
    );
  }
}

async function seedPromoCodes(client: PoolClient) {
  await client.query(
    `
      INSERT INTO promo_codes (
        code,
        description,
        discount_type,
        discount_value,
        min_order_amount,
        max_discount_amount,
        is_active
      )
      VALUES
        ('WELCOME10', 'Скидка 10% на первый заказ', 'percent', 10, 3000, 2000, TRUE),
        ('SHIPFREE', 'Фиксированная скидка 500 ₽ на доставку', 'fixed', 500, 5000, NULL, TRUE)
      ON CONFLICT (code) DO NOTHING
    `
  );
}

async function seedCheckoutMethods(client: PoolClient) {
  await client.query(
    `
      INSERT INTO shipping_methods (code, name, description, price, sort_order, is_active)
      VALUES
        ('standard', 'Стандартная доставка', '3-5 рабочих дней', 0, 10, TRUE),
        ('express', 'Экспресс-доставка', '1-2 рабочих дня', 700, 20, TRUE),
        ('overnight', 'Доставка на следующий день', 'На следующий рабочий день', 1500, 30, TRUE)
      ON CONFLICT (code)
      DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        price = EXCLUDED.price,
        sort_order = EXCLUDED.sort_order,
        updated_at = NOW()
    `
  );

  await client.query(
    `
      INSERT INTO payment_methods (code, name, description, requires_card, sort_order, is_active)
      VALUES
        ('card', 'Банковская карта', 'Онлайн-оплата картой на сайте', TRUE, 10, TRUE),
        ('cash_on_delivery', 'Картой при получении', 'Оплата курьеру или в пункте выдачи', FALSE, 20, TRUE)
      ON CONFLICT (code)
      DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        requires_card = EXCLUDED.requires_card,
        sort_order = EXCLUDED.sort_order,
        updated_at = NOW()
    `
  );
}

async function ensureOrderStatusHistory(client: Pick<PoolClient, "query">) {
  await client.query(
    `
      INSERT INTO order_status_history (order_id, previous_status, next_status, admin_id, note, created_at)
      SELECT o.id, NULL, o.status, NULL, 'Initial order status', o.created_at
      FROM orders o
      WHERE NOT EXISTS (
        SELECT 1
        FROM order_status_history osh
        WHERE osh.order_id = o.id
      )
    `
  );
}

function buildSeedDate(daysAgo: number, hours = 12) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hours, 15, 0, 0);
  return date.toISOString();
}

async function seedOrders(client: PoolClient) {
  const { rows: orderCountRows } = await client.query("SELECT COUNT(*) FROM orders");
  if (parseInt(orderCountRows[0].count) > 0) {
    return;
  }

  const { rows: products } = await client.query<{
    id: number;
    name: string;
    price: number;
  }>(
    `
      SELECT id, name, price
      FROM products
      ORDER BY id ASC
      LIMIT 12
    `
  );

  if (products.length < 6) {
    logger.warn("⚠️ Not enough products to seed orders");
    return;
  }

  const seedData = [
    {
      customer_name: "Анна Петрова",
      phone: "+7 (999) 123-45-67",
      email: "anna.petrova@example.com",
      delivery_address: "Екатеринбург, ул. Малышева, 51",
      payment_method: "Картой при получении",
      delivery_method: "Курьер",
      comment: "Позвонить за 30 минут до доставки",
      status: "new",
      created_at: buildSeedDate(1, 10),
      items: [
        { product: products[0], quantity: 1, size: "M" },
        { product: products[1], quantity: 2, size: "L" },
      ],
    },
    {
      customer_name: "Илья Смирнов",
      phone: "+7 (922) 555-10-10",
      email: "ilya.smirnov@example.com",
      delivery_address: "Москва, пр-т Мира, 24",
      payment_method: "Онлайн-оплата",
      delivery_method: "ПВЗ",
      comment: "Оставить у стойки выдачи",
      status: "confirmed",
      created_at: buildSeedDate(2, 15),
      items: [
        { product: products[2], quantity: 1, size: "42" },
        { product: products[3], quantity: 1, size: "43" },
      ],
    },
    {
      customer_name: "Мария Кузнецова",
      phone: "+7 (901) 777-88-99",
      email: "maria.kuznetsova@example.com",
      delivery_address: "Казань, ул. Баумана, 18",
      payment_method: "Онлайн-оплата",
      delivery_method: "Курьер",
      comment: "Домофон не работает, написать в мессенджер",
      status: "packing",
      created_at: buildSeedDate(3, 13),
      items: [
        { product: products[4], quantity: 1, size: "S" },
        { product: products[5], quantity: 1, size: "M" },
        { product: products[6], quantity: 1, size: "L" },
      ],
    },
    {
      customer_name: "Денис Орлов",
      phone: "+7 (950) 222-33-44",
      email: "denis.orlov@example.com",
      delivery_address: "Санкт-Петербург, Невский пр., 100",
      payment_method: "Картой при получении",
      delivery_method: "Курьер",
      comment: null,
      status: "shipped",
      created_at: buildSeedDate(4, 17),
      items: [
        { product: products[7], quantity: 2, size: "XL" },
      ],
    },
    {
      customer_name: "Елена Громова",
      phone: "+7 (913) 444-55-66",
      email: "elena.gromova@example.com",
      delivery_address: "Новосибирск, ул. Ленина, 12",
      payment_method: "Онлайн-оплата",
      delivery_method: "ПВЗ",
      comment: "Без звонка, оставить у соседей",
      status: "completed",
      created_at: buildSeedDate(5, 11),
      items: [
        { product: products[8], quantity: 1, size: "M" },
        { product: products[9], quantity: 1, size: "L" },
      ],
    },
    {
      customer_name: "Павел Волков",
      phone: "+7 (925) 888-99-00",
      email: "pavel.volkov@example.com",
      delivery_address: "Самара, ул. Куйбышева, 7",
      payment_method: "Онлайн-оплата",
      delivery_method: "Курьер",
      comment: "Отменён по просьбе клиента",
      status: "cancelled",
      created_at: buildSeedDate(6, 9),
      items: [
        { product: products[10], quantity: 1, size: "44" },
        { product: products[11], quantity: 1, size: "46" },
      ],
    },
  ];

  for (const order of seedData) {
    const totalAmount = order.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const { rows } = await client.query(
      `INSERT INTO orders (
         user_id,
         status,
         total_amount,
         customer_name,
         phone,
         email,
         delivery_address,
         payment_method,
         delivery_method,
         comment,
         created_at,
         updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id`,
      [
        null,
        order.status,
        totalAmount,
        order.customer_name,
        order.phone,
        order.email,
        order.delivery_address,
        order.payment_method,
        order.delivery_method,
        order.comment,
        order.created_at,
        order.created_at,
      ]
    );

    const orderId = rows[0].id;

    for (const item of order.items) {
      await client.query(
        `INSERT INTO order_items (
           order_id,
           product_id,
           product_name,
           product_price,
           quantity,
           size,
           created_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          orderId,
          item.product.id,
          item.product.name,
          item.product.price,
          item.quantity,
          item.size,
          order.created_at,
        ]
      );
    }
  }

  logger.info(`✅ Seeded ${seedData.length} test orders`);
}

function isAutoManagedImage(imageUrl: string | null | undefined) {
  if (!imageUrl) return false;
  // Manually uploaded images are never auto-managed
  if (imageUrl.startsWith("/assets/products/uploads/")) return false;
  if (imageUrl.startsWith("/assets/products/men/")) return false;
  if (imageUrl.startsWith("/assets/products/women/")) return false;
  if (imageUrl.startsWith("/assets/products/kids/")) return false;
  return imageUrl.startsWith("/assets/products/catalog/") || imageUrl.startsWith("/assets/products/generated/");
}

function catalogImageExists(imageUrl: string) {
  return fs.existsSync(path.resolve(process.cwd(), "public", imageUrl.replace(/^\//, "")));
}

export async function syncProductImages(client: Pick<PoolClient, "query">) {
  const { rows } = await client.query<{ id: number; slug: string; gender: string; type: string; image_url: string | null }>(
    `
      SELECT id, slug, gender, type, image_url
      FROM products
      ORDER BY gender, type, id
    `
  );

  for (const row of rows) {
    const imageUrl = row.image_url;

    // Only update if the current image is auto-managed AND the file no longer exists
    // If image_url is null or auto-managed but file is gone — clear it so UI shows placeholder
    if (!imageUrl || (isAutoManagedImage(imageUrl) && !catalogImageExists(imageUrl))) {
      await client.query(`UPDATE products SET image_url = NULL WHERE id = $1`, [row.id]);
    }
    // Manually uploaded images (/assets/products/uploads/) are never touched
  }

  logger.info("✅ Product images synchronized");
}
