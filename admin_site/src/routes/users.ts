import { Router, Request, Response } from "express";
import logger from "../lib/logger";
import bcrypt from "bcryptjs";
import { pool } from "../db";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { CreateUserSchema, UpdateUserSchema, ChangePasswordSchema } from "../schemas";

const router = Router();

router.use(requireAuth);

// GET /api/users — список пользователей
router.get("/", async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, last_name, first_name, middle_name, email, phone, is_active, created_at
       FROM users
       ORDER BY id ASC`
    );
    res.json(rows);
  } catch (err) {
    logger.error("Route error", { error: err });
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// GET /api/users/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, last_name, first_name, middle_name, email, phone, is_active, created_at
       FROM users
       WHERE id=$1`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Пользователь не найден" });
    res.json(rows[0]);
  } catch (err) {
    logger.error("Route error", { error: err });
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// POST /api/users — создать пользователя
router.post("/", validate(CreateUserSchema), async (req: Request, res: Response) => {
  const { last_name, first_name, middle_name, email, password, phone } = req.body;

  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (last_name, first_name, middle_name, email, password_hash, phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, last_name, first_name, middle_name, email, phone, is_active, created_at`,
      [last_name, first_name, middle_name || null, email, hash, phone || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if ((err as { code?: string }).code === "23505") {
      return res.status(409).json({ error: "Email уже зарегистрирован" });
    }
    logger.error("Route error", { error: err });
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// PUT /api/users/:id — обновить данные
router.put("/:id", validate(UpdateUserSchema), async (req: Request, res: Response) => {
  const { last_name, first_name, middle_name, email, phone, is_active } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE users
       SET last_name=$1, first_name=$2, middle_name=$3, email=$4, phone=$5, is_active=$6, updated_at=NOW()
       WHERE id=$7
       RETURNING id, last_name, first_name, middle_name, email, phone, is_active, updated_at`,
      [last_name, first_name, middle_name || null, email, phone || null, is_active, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Пользователь не найден" });
    res.json(rows[0]);
  } catch (err) {
    if ((err as { code?: string }).code === "23505") {
      return res.status(409).json({ error: "Email уже занят" });
    }
    logger.error("Route error", { error: err });
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// PUT /api/users/:id/password — сменить пароль пользователя
router.put("/:id/password", validate(ChangePasswordSchema), async (req: Request, res: Response) => {
  const { password } = req.body;

  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      "UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2 RETURNING id, email, last_name, first_name, middle_name",
      [hash, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Пользователь не найден" });
    res.json({ message: "Пароль обновлён", user: rows[0] });
  } catch (err) {
    logger.error("Route error", { error: err });
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// DELETE /api/users/:id
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      "DELETE FROM users WHERE id=$1 RETURNING id",
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Пользователь не найден" });
    res.json({ message: "Пользователь удалён", id: rows[0].id });
  } catch (err) {
    logger.error("Route error", { error: err });
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

export default router;
