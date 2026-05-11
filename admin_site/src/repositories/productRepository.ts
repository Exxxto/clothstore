import { pool } from "../db";

export interface ProductFilters {
  gender?: string;
  type?: string;
  season?: string;
  search?: string;
  material?: string;
}

const STOCK_JOIN = `
  LEFT JOIN (
    SELECT pv.product_id, COALESCE(SUM(sb.quantity_on_hand), 0)::int AS total_stock
    FROM product_variants pv
    LEFT JOIN stock_balances sb ON sb.product_variant_id = pv.id
    WHERE pv.is_active = TRUE
    GROUP BY pv.product_id
  ) stock ON stock.product_id = p.id
`;

export async function findAllProducts(filters: ProductFilters = {}) {
  const conditions: string[] = [];
  const params: Array<string | number> = [];
  let idx = 1;

  if (filters.gender) {
    conditions.push(`CASE
      WHEN LOWER(p.gender) IN ('men', 'male', 'man', 'мужское', 'мужские', 'мужской', 'для мужчин') THEN 'men'
      WHEN LOWER(p.gender) IN ('women', 'female', 'woman', 'женское', 'женские', 'женский', 'для женщин') THEN 'women'
      WHEN LOWER(p.gender) IN ('kids', 'child', 'children', 'детское', 'детские', 'детский', 'для детей') THEN 'kids'
      ELSE LOWER(p.gender)
    END = $${idx++}`);
    params.push(filters.gender);
  }
  if (filters.type) {
    conditions.push(`p.type = $${idx++}`);
    params.push(filters.type);
  }
  if (filters.season) {
    conditions.push(`p.season = $${idx++}`);
    params.push(filters.season);
  }
  if (filters.material) {
    conditions.push(`LOWER(p.material) = LOWER($${idx++})`);
    params.push(filters.material);
  }
  if (filters.search) {
    conditions.push(`(p.name ILIKE $${idx} OR p.description ILIKE $${idx})`);
    params.push(`%${filters.search}%`);
    idx++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const { rows } = await pool.query(
    `SELECT p.*, COALESCE(stock.total_stock, 0) AS total_stock
     FROM products p
     ${STOCK_JOIN}
     ${whereClause}
     ORDER BY p.id ASC`,
    params
  );
  return rows;
}

export async function findProductById(id: number) {
  const { rows } = await pool.query(
    `SELECT p.*, COALESCE(stock.total_stock, 0) AS total_stock
     FROM products p
     ${STOCK_JOIN}
     WHERE p.id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function createProduct(data: {
  name: string;
  type: string;
  gender: string;
  price: number;
  old_price: number | null;
  image_url: string | null;
  season: string;
  category_id: number | null;
  is_new: boolean;
  sizes: string[];
  description: string;
  material: string | null;
}) {
  const { rows } = await pool.query(
    `INSERT INTO products (name, type, gender, price, old_price, image_url, season, category_id, is_new, sizes, description, material)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      data.name, data.type, data.gender, data.price, data.old_price,
      data.image_url, data.season, data.category_id, data.is_new,
      data.sizes, data.description, data.material,
    ]
  );
  return rows[0];
}

export async function updateProduct(
  id: number,
  data: {
    name: string;
    type: string;
    gender: string;
    price: number;
    old_price: number | null;
    image_url: string | null;
    season: string;
    category_id: number | null;
    is_new: boolean;
    sizes: string[];
    description: string;
    material: string | null;
  }
) {
  const { rows } = await pool.query(
    `UPDATE products
     SET name=$1, type=$2, gender=$3, price=$4, old_price=$5, image_url=$6,
         season=$7, category_id=$8, is_new=$9, sizes=$10, description=$11,
         material=$12, updated_at=NOW()
     WHERE id=$13
     RETURNING *`,
    [
      data.name, data.type, data.gender, data.price, data.old_price,
      data.image_url, data.season, data.category_id, data.is_new,
      data.sizes, data.description, data.material, id,
    ]
  );
  return rows[0] ?? null;
}

export async function deleteProduct(id: number) {
  const { rows } = await pool.query(
    "DELETE FROM products WHERE id = $1 RETURNING id, name",
    [id]
  );
  return rows[0] ?? null;
}
