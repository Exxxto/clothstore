import { Router, Request, Response } from "express";
import logger from "../lib/logger";
import bcrypt from "bcryptjs";
import { pool } from "../db";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { CreateAdminSchema, UpdateAdminSchema, ChangePasswordSchema } from "../schemas";

const router = Router();

router.use(requireAuth);

// GET /api/admins — список всех
router.get("/", async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, last_name, first_name, middle_name, username, is_active, created_at, updated_at
       FROM admins ORDER BY last_name, first_name ASC`
    );
    res.json(rows);
  } catch (err) {
    logger.error("Route error", { error: err });
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// GET /api/admins/me — текущий
router.get("/me", async (req: Request, res: Response) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ error: "Требуется авторизация" });
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, last_name, first_name, middle_name, username, is_active, created_at
       FROM admins WHERE id = $1`,
      [user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Не найден" });
    res.json(rows[0]);
  } catch (err) {
    logger.error("Route error", { error: err });
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// POST /api/admins — создать
router.post("/", validate(CreateAdminSchema), async (req: Request, res: Response) => {
  const { last_name, first_name, middle_name, username, password } = req.body;

  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO admins (last_name, first_name, middle_name, username, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, last_name, first_name, middle_name, username, is_active, created_at`,
      [last_name, first_name, middle_name || null, username, hash]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if ((err as { code?: string }).code === "23505") {
      return res.status(409).json({ error: "Логин уже занят" });
    }
    logger.error("Route error", { error: err });
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// PUT /api/admins/:id — обновить данные
router.put("/:id", validate(UpdateAdminSchema), async (req: Request, res: Response) => {
  const { last_name, first_name, middle_name, username, is_active } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE admins
       SET last_name=$1, first_name=$2, middle_name=$3, username=$4, is_active=$5, updated_at=NOW()
       WHERE id=$6
       RETURNING id, last_name, first_name, middle_name, username, is_active, updated_at`,
      [last_name, first_name, middle_name || null, username, is_active ?? true, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Админ не найден" });
    res.json(rows[0]);
  } catch (err) {
    if ((err as { code?: string }).code === "23505") {
      return res.status(409).json({ error: "Логин уже занят" });
    }
    logger.error("Route error", { error: err });
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// PUT /api/admins/:id/password — сменить пароль
router.put("/:id/password", validate(ChangePasswordSchema), async (req: Request, res: Response) => {
  const { password } = req.body;

  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `UPDATE admins SET password_hash=$1, updated_at=NOW()
       WHERE id=$2
       RETURNING id, username, last_name, first_name`,
      [hash, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Админ не найден" });
    res.json({ message: "Пароль обновлён", admin: rows[0] });
  } catch (err) {
    logger.error("Route error", { error: err });
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// DELETE /api/admins/:id
router.delete("/:id", async (req: Request, res: Response) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ error: "Требуется авторизация" });
  }

  if (String(user.id) === String(req.params.id)) {
    return res.status(400).json({ error: "Нельзя удалить самого себя" });
  }

  try {
    const { rows } = await pool.query(
      "DELETE FROM admins WHERE id=$1 RETURNING id, username",
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Админ не найден" });
    res.json({ message: "Админ удалён", id: rows[0].id });
  } catch (err) {
    logger.error("Route error", { error: err });
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

export default router;
