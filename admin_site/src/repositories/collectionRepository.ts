import { pool } from "../db";

export async function findAllCollections() {
  const { rows } = await pool.query(
    `SELECT c.id, c.name, c.slug, c.description, c.is_active, c.sort_order,
            c.created_at, c.updated_at,
            COUNT(pc.id)::int AS product_count
     FROM collections c
     LEFT JOIN product_collections pc ON pc.collection_id = c.id
     GROUP BY c.id
     ORDER BY c.sort_order ASC, c.name ASC`
  );
  return rows;
}

export async function createCollection(data: {
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
}) {
  const { rows } = await pool.query(
    `INSERT INTO collections (name, slug, description, is_active, sort_order)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, slug, description, is_active, sort_order, created_at, updated_at`,
    [data.name, data.slug, data.description, data.is_active, data.sort_order]
  );
  return rows[0];
}

export async function updateCollection(
  id: number,
  data: { name: string; slug: string; description: string | null; is_active: boolean; sort_order: number }
) {
  const { rows } = await pool.query(
    `UPDATE collections
     SET name=$1, slug=$2, description=$3, is_active=$4, sort_order=$5, updated_at=NOW()
     WHERE id=$6
     RETURNING id, name, slug, description, is_active, sort_order, created_at, updated_at`,
    [data.name, data.slug, data.description, data.is_active, data.sort_order, id]
  );
  return rows[0] ?? null;
}

export async function deleteCollection(id: number) {
  const { rows } = await pool.query(
    "DELETE FROM collections WHERE id=$1 RETURNING id, name, slug",
    [id]
  );
  return rows[0] ?? null;
}
