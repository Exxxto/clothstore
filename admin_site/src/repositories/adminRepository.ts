import { pool } from "../db";

const PUBLIC_FIELDS = `id, last_name, first_name, middle_name, username, is_active, created_at, updated_at`;

export async function findAllAdmins() {
  const { rows } = await pool.query(
    `SELECT ${PUBLIC_FIELDS} FROM admins ORDER BY last_name, first_name ASC`
  );
  return rows;
}

export async function findAdminById(id: number) {
  const { rows } = await pool.query(
    `SELECT ${PUBLIC_FIELDS} FROM admins WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function findAdminByUsername(username: string) {
  const { rows } = await pool.query(
    "SELECT * FROM admins WHERE username = $1 AND is_active = TRUE",
    [username]
  );
  return rows[0] ?? null;
}

export async function createAdmin(data: {
  last_name: string;
  first_name: string;
  middle_name: string | null;
  username: string;
  password_hash: string;
}) {
  const { rows } = await pool.query(
    `INSERT INTO admins (last_name, first_name, middle_name, username, password_hash)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, last_name, first_name, middle_name, username, is_active, created_at`,
    [data.last_name, data.first_name, data.middle_name, data.username, data.password_hash]
  );
  return rows[0];
}

export async function updateAdmin(
  id: number,
  data: { last_name: string; first_name: string; middle_name: string | null; username: string; is_active: boolean }
) {
  const { rows } = await pool.query(
    `UPDATE admins
     SET last_name=$1, first_name=$2, middle_name=$3, username=$4, is_active=$5, updated_at=NOW()
     WHERE id=$6
     RETURNING id, last_name, first_name, middle_name, username, is_active, updated_at`,
    [data.last_name, data.first_name, data.middle_name, data.username, data.is_active, id]
  );
  return rows[0] ?? null;
}

export async function updateAdminPassword(id: number, password_hash: string) {
  const { rows } = await pool.query(
    `UPDATE admins SET password_hash=$1, updated_at=NOW()
     WHERE id=$2
     RETURNING id, username, last_name, first_name`,
    [password_hash, id]
  );
  return rows[0] ?? null;
}

export async function deleteAdmin(id: number) {
  const { rows } = await pool.query(
    "DELETE FROM admins WHERE id=$1 RETURNING id, username",
    [id]
  );
  return rows[0] ?? null;
}
