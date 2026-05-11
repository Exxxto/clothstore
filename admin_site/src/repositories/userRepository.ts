import { pool } from "../db";

const PUBLIC_FIELDS = `id, last_name, first_name, middle_name, email, phone, is_active, created_at`;

export async function findAllUsers() {
  const { rows } = await pool.query(
    `SELECT ${PUBLIC_FIELDS} FROM users ORDER BY id ASC`
  );
  return rows;
}

export async function findUserById(id: number) {
  const { rows } = await pool.query(
    `SELECT ${PUBLIC_FIELDS} FROM users WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function createUser(data: {
  last_name: string;
  first_name: string;
  middle_name: string | null;
  email: string;
  password_hash: string;
  phone: string | null;
}) {
  const { rows } = await pool.query(
    `INSERT INTO users (last_name, first_name, middle_name, email, password_hash, phone)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${PUBLIC_FIELDS}`,
    [data.last_name, data.first_name, data.middle_name, data.email, data.password_hash, data.phone]
  );
  return rows[0];
}

export async function updateUser(
  id: number,
  data: { last_name: string; first_name: string; middle_name: string | null; email: string; phone: string | null; is_active: boolean }
) {
  const { rows } = await pool.query(
    `UPDATE users
     SET last_name=$1, first_name=$2, middle_name=$3, email=$4, phone=$5, is_active=$6, updated_at=NOW()
     WHERE id=$7
     RETURNING id, last_name, first_name, middle_name, email, phone, is_active, updated_at`,
    [data.last_name, data.first_name, data.middle_name, data.email, data.phone, data.is_active, id]
  );
  return rows[0] ?? null;
}

export async function updateUserPassword(id: number, password_hash: string) {
  const { rows } = await pool.query(
    "UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2 RETURNING id, email, last_name, first_name, middle_name",
    [password_hash, id]
  );
  return rows[0] ?? null;
}

export async function deleteUser(id: number) {
  const { rows } = await pool.query(
    "DELETE FROM users WHERE id=$1 RETURNING id",
    [id]
  );
  return rows[0] ?? null;
}
