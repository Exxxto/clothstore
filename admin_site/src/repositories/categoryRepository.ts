import { pool } from "../db";

const SELECT_FIELDS = `
  c.id,
  c.name,
  c.slug,
  c.description,
  c.is_active,
  c.created_at,
  c.updated_at,
  COUNT(p.id)::int AS product_count
`;

const FROM_JOIN = `
  FROM categories c
  LEFT JOIN products p ON p.category_id = c.id
`;

export async function findAllCategories() {
  const { rows } = await pool.query(
    `SELECT ${SELECT_FIELDS}
     ${FROM_JOIN}
     GROUP BY c.id, c.name, c.slug, c.description, c.is_active, c.created_at, c.updated_at
     ORDER BY c.name ASC`
  );
  return rows;
}

export async function findCategoryById(id: number) {
  const { rows } = await pool.query(
    `SELECT ${SELECT_FIELDS}
     ${FROM_JOIN}
     WHERE c.id = $1
     GROUP BY c.id, c.name, c.slug, c.description, c.is_active, c.created_at, c.updated_at`,
    [id]
  );
  return rows[0] ?? null;
}

export async function createCategory(data: {
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
}) {
  const { rows } = await pool.query(
    `INSERT INTO categories (name, slug, description, is_active)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, slug, description, is_active, created_at`,
    [data.name, data.slug, data.description, data.is_active]
  );
  return rows[0];
}

export async function updateCategory(
  id: number,
  data: { name: string; slug: string; description: string | null; is_active: boolean }
) {
  const { rows } = await pool.query(
    `UPDATE categories
     SET name=$1, slug=$2, description=$3, is_active=$4, updated_at=NOW()
     WHERE id=$5
     RETURNING id, name, slug, description, is_active, updated_at`,
    [data.name, data.slug, data.description, data.is_active, id]
  );
  return rows[0] ?? null;
}

export async function deleteCategory(id: number) {
  const { rows } = await pool.query(
    "DELETE FROM categories WHERE id=$1 RETURNING id, name, slug",
    [id]
  );
  return rows[0] ?? null;
}
