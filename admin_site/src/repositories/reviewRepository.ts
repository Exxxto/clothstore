import { pool } from "../db";

const FIELDS = `id, product_id, session_id, author_name, rating, body, status, created_at, updated_at`;

export async function findReviewsByProduct(productId: number) {
  const { rows } = await pool.query(
    `SELECT ${FIELDS} FROM product_reviews
     WHERE product_id = $1 AND status = 'published'
     ORDER BY created_at DESC`,
    [productId]
  );
  return rows;
}

export async function findReviewBySession(productId: number, sessionId: string) {
  const { rows } = await pool.query(
    `SELECT ${FIELDS} FROM product_reviews
     WHERE product_id = $1 AND session_id = $2
     LIMIT 1`,
    [productId, sessionId]
  );
  return rows[0] ?? null;
}

export async function getAverageRating(productId: number): Promise<{ avg: number | null; count: number }> {
  const { rows } = await pool.query(
    `SELECT ROUND(AVG(rating)::numeric, 1) AS avg, COUNT(*) AS count
     FROM product_reviews
     WHERE product_id = $1 AND status = 'published'`,
    [productId]
  );
  return {
    avg: rows[0].avg !== null ? parseFloat(rows[0].avg) : null,
    count: parseInt(rows[0].count, 10),
  };
}

export async function createReview(data: {
  product_id: number;
  session_id: string;
  author_name: string;
  rating: number;
  body: string;
}) {
  const { rows } = await pool.query(
    `INSERT INTO product_reviews (product_id, session_id, author_name, rating, body)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${FIELDS}`,
    [data.product_id, data.session_id, data.author_name, data.rating, data.body]
  );
  return rows[0];
}

export async function updateReview(id: number, sessionId: string, data: {
  author_name: string;
  rating: number;
  body: string;
}) {
  const { rows } = await pool.query(
    `UPDATE product_reviews
     SET author_name = $1, rating = $2, body = $3, updated_at = NOW()
     WHERE id = $4 AND session_id = $5
     RETURNING ${FIELDS}`,
    [data.author_name, data.rating, data.body, id, sessionId]
  );
  return rows[0] ?? null;
}

export async function findAllReviews(filters: { status?: string; product_id?: number; limit?: number } = {}) {
  const limit = Math.min(filters.limit ?? 100, 500);
  const conditions: string[] = [];
  const params: Array<string | number> = [limit];

  if (filters.status && filters.status !== "all") {
    conditions.push(`status = $${params.length + 1}`);
    params.push(filters.status);
  }
  if (filters.product_id) {
    conditions.push(`product_id = $${params.length + 1}`);
    params.push(filters.product_id);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const { rows } = await pool.query(
    `SELECT ${FIELDS} FROM product_reviews ${where} ORDER BY created_at DESC LIMIT $1`,
    params
  );
  return rows;
}

export async function updateReviewStatus(id: number, status: string) {
  const { rows } = await pool.query(
    `UPDATE product_reviews SET status = $1, updated_at = NOW() WHERE id = $2
     RETURNING id, status, updated_at`,
    [status, id]
  );
  return rows[0] ?? null;
}

export async function deleteReview(id: number) {
  const { rows } = await pool.query(
    `DELETE FROM product_reviews WHERE id = $1 RETURNING id`,
    [id]
  );
  return rows[0] ?? null;
}
