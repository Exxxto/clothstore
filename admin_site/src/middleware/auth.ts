import { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { pool } from "../db";
import logger from "../lib/logger";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const JWT_SECRET = process.env.JWT_SECRET || "siluet_admin_secret_key_2024";

type AuthTokenPayload = JwtPayload & {
  id: number;
  username: string;
  role: string;
  full_name: string;
};

export async function login(req: Request, res: Response) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Введите логин и пароль" });
  }

  try {
    const { rows } = await pool.query(
      "SELECT * FROM admins WHERE username = $1 AND is_active = TRUE",
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Неверный логин или пароль" });
    }

    const admin = rows[0];
    const valid = await bcrypt.compare(password, admin.password_hash);

    if (!valid) {
      return res.status(401).json({ error: "Неверный логин или пароль" });
    }

    const token = jwt.sign(
      {
        id: admin.id,
        username: admin.username,
        full_name: `${admin.last_name} ${admin.first_name}${admin.middle_name ? " " + admin.middle_name : ""}`,
        role: "admin",
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({
      token,
      username: admin.username,
      full_name: `${admin.last_name} ${admin.first_name}${admin.middle_name ? " " + admin.middle_name : ""}`,
      role: "admin",
    });
  } catch (err) {
    logger.error("Login error", { error: err });
    return res.status(500).json({ error: "Ошибка сервера" });
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Требуется авторизация" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Недействительный или истёкший токен" });
  }
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  next(); // все авторизованные админы равноправны
}
