import { pool } from "../db";

export interface ProductFilters {
  gender?: string;
  type?: string;
  season?: string;
  search?: string;
}

export async function findAllProducts(filters: ProductFilters = {}) {
  let query = "SELECT * FROM products WHERE 1=1";
  const params: Array<string | number> = [];
  let idx = 1;

  if (filters.gender) {
    query += ` AND CASE
      WHEN LOWER(gender) IN ('men', 'male', 'man', 'мужское', 'мужские', 'мужской', 'для мужчин') THEN 'men'
      WHEN LOWER(gender) IN ('women', 'female', 'woman', 'женское', 'женские', 'женский', 'для женщин') THEN 'women'
      WHEN LOWER(gender) IN ('kids', 'child', 'children', 'детское', 'детские', 'детский', 'для детей') THEN 'kids'
      ELSE LOWER(gender)
    END = $${idx++}`;
    params.push(filters.gender);
  }
  if (filters.type) {
    query += ` AND type = $${idx++}`;
    params.push(filters.type);
  }
  if (filters.season) {
    query += ` AND season = $${idx++}`;
    params.push(filters.season);
  }
  if (filters.search) {
    query += ` AND (name ILIKE $${idx} OR description ILIKE $${idx})`;
    params.push(`%${filters.search}%`);
    idx++;
  }

  query += " ORDER BY id ASC";
  const { rows } = await pool.query(query, params);
  return rows;
}

export async function findProductById(id: number) {
  const { rows } = await pool.query("SELECT * FROM products WHERE id = $1", [id]);
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
}) {
  const { rows } = await pool.query(
    `INSERT INTO products (name, type, gender, price, old_price, image_url, season, category_id, is_new, sizes, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      data.name, data.type, data.gender, data.price, data.old_price,
      data.image_url, data.season, data.category_id, data.is_new,
      data.sizes, data.description,
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
  }
) {
  const { rows } = await pool.query(
    `UPDATE products
     SET name=$1, type=$2, gender=$3, price=$4, old_price=$5, image_url=$6,
         season=$7, category_id=$8, is_new=$9, sizes=$10, description=$11, updated_at=NOW()
     WHERE id=$12
     RETURNING *`,
    [
      data.name, data.type, data.gender, data.price, data.old_price,
      data.image_url, data.season, data.category_id, data.is_new,
      data.sizes, data.description, id,
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
