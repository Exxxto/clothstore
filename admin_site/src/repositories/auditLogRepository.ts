import { pool } from "../db";

const SELECT_FIELDS = `
  al.id, al.action, al.entity_type, al.entity_id, al.details, al.ip_address, al.created_at,
  a.username AS admin_username,
  a.last_name AS admin_last_name,
  a.first_name AS admin_first_name
`;

export async function findAllAuditLogs(limit: number) {
  const { rows } = await pool.query(
    `SELECT ${SELECT_FIELDS}
     FROM audit_logs al
     LEFT JOIN admins a ON a.id = al.admin_id
     ORDER BY al.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
}

export async function findAuditLogById(id: number) {
  const { rows } = await pool.query(
    `SELECT ${SELECT_FIELDS}
     FROM audit_logs al
     LEFT JOIN admins a ON a.id = al.admin_id
     WHERE al.id = $1`,
    [id]
  );
  return rows[0] ?? null;
}
