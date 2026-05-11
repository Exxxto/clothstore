import { pool } from "../db";

export interface ComplaintFilters {
  limit?: number;
  status?: string;
  search?: string;
}

const FIELDS = `id, requester_name, email, phone, order_number, category, message, status, created_at, updated_at`;

export async function findAllComplaints(filters: ComplaintFilters = {}) {
  const limit = Math.min(filters.limit ?? 100, 500);
  const conditions: string[] = [];
  const params: Array<string | number> = [limit];

  if (filters.status && filters.status !== "all") {
    conditions.push(`c.status = $${params.length + 1}`);
    params.push(filters.status);
  }

  if (filters.search?.trim()) {
    conditions.push(`(
      c.requester_name ILIKE $${params.length + 1}
      OR c.email ILIKE $${params.length + 1}
      OR COALESCE(c.phone, '') ILIKE $${params.length + 1}
      OR COALESCE(c.order_number, '') ILIKE $${params.length + 1}
      OR c.category ILIKE $${params.length + 1}
      OR c.message ILIKE $${params.length + 1}
    )`);
    params.push(`%${filters.search.trim()}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const { rows } = await pool.query(
    `SELECT c.${FIELDS.split(", ").join(", c.")}
     FROM complaints c
     ${whereClause}
     ORDER BY c.created_at DESC
     LIMIT $1`,
    params
  );
  return rows;
}

export async function findComplaintById(id: number) {
  const { rows } = await pool.query(
    `SELECT ${FIELDS} FROM complaints WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function createComplaint(data: {
  requester_name: string;
  email: string;
  phone: string | null;
  order_number: string | null;
  category: string;
  message: string;
}) {
  const { rows } = await pool.query(
    `INSERT INTO complaints (requester_name, email, phone, order_number, category, message)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${FIELDS}`,
    [data.requester_name, data.email, data.phone, data.order_number, data.category, data.message]
  );
  return rows[0];
}

export async function updateComplaintStatus(id: number, status: string) {
  const { rows } = await pool.query(
    `UPDATE complaints SET status=$1, updated_at=NOW() WHERE id=$2
     RETURNING id, status, updated_at`,
    [status, id]
  );
  return rows[0] ?? null;
}
