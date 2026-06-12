import { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { pool, getClient } from "../db";
import type { PoolClient } from "pg";
import logger from "../lib/logger";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const JWT_SECRET = process.env.JWT_SECRET || "siluet_admin_secret_key_2024";

export type CustomerTokenPayload = JwtPayload & {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
};

declare global {
  namespace Express {
    interface Request {
      customer?: CustomerTokenPayload;
    }
  }
}

function normalizeSessionId(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

// ── Session data migration ──

async function migrateSessionData(client: PoolClient, sessionId: string, userId: number) {
  // 1. Carts — merge or reassign
  const { rows: sessionCarts } = await client.query(
    `SELECT id FROM carts WHERE session_id = $1 AND status = 'active'`,
    [sessionId]
  );

  if (sessionCarts.length > 0) {
    const sessionCartId = sessionCarts[0].id;

    const { rows: userCarts } = await client.query(
      `SELECT id FROM carts WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );

    if (userCarts.length > 0) {
      const userCartId = userCarts[0].id;

      await client.query(
        `INSERT INTO cart_items (cart_id, product_id, product_variant_id, product_name, image_url, size, unit_price, quantity)
         SELECT $1, ci.product_id, ci.product_variant_id, ci.product_name, ci.image_url, ci.size, ci.unit_price, ci.quantity
         FROM cart_items ci
         WHERE ci.cart_id = $2
         ON CONFLICT DO NOTHING`,
        [userCartId, sessionCartId]
      );

      await client.query(`DELETE FROM cart_items WHERE cart_id = $1`, [sessionCartId]);
      await client.query(`DELETE FROM carts WHERE id = $1`, [sessionCartId]);
    } else {
      await client.query(
        `UPDATE carts SET user_id = $1, session_id = NULL WHERE id = $2`,
        [userId, sessionCartId]
      );
    }
  }

  // 2. Wishlists — merge items, reassign
  const { rows: sessionWishlists } = await client.query(
    `SELECT id FROM wishlists WHERE session_id = $1`,
    [sessionId]
  );

  if (sessionWishlists.length > 0) {
    const sessionWishlistId = sessionWishlists[0].id;

    let { rows: userWishlists } = await client.query(
      `SELECT id FROM wishlists WHERE user_id = $1`,
      [userId]
    );

    let userWishlistId: number;

    if (userWishlists.length === 0) {
      const { rows: newWishlist } = await client.query(
        `INSERT INTO wishlists (user_id) VALUES ($1) RETURNING id`,
        [userId]
      );
      userWishlistId = newWishlist[0].id;
    } else {
      userWishlistId = userWishlists[0].id;
    }

    await client.query(
      `INSERT INTO wishlist_items (wishlist_id, product_id)
       SELECT $1, product_id
       FROM wishlist_items
       WHERE wishlist_id = $2
       ON CONFLICT (wishlist_id, product_id) DO NOTHING`,
      [userWishlistId, sessionWishlistId]
    );

    await client.query(`DELETE FROM wishlist_items WHERE wishlist_id = $1`, [sessionWishlistId]);
    await client.query(`DELETE FROM wishlists WHERE id = $1`, [sessionWishlistId]);
  }

  // 3. Customer addresses — reassign
  await client.query(
    `UPDATE customer_addresses SET user_id = $1, session_id = NULL WHERE session_id = $2 AND user_id IS NULL`,
    [userId, sessionId]
  );

  // 4. Store profile — reassign
  await client.query(
    `UPDATE store_profiles SET user_id = $1 WHERE session_id = $2 AND user_id IS NULL`,
    [userId, sessionId]
  );

  // 5. Orders — reassign
  await client.query(
    `UPDATE orders SET user_id = $1, session_id = NULL WHERE session_id = $2 AND user_id IS NULL`,
    [userId, sessionId]
  );
}

// ── Handlers ──

export async function customerLogin(req: Request, res: Response) {
  const { email, password, session_id } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Введите email и пароль" });
  }

  try {
    const { rows } = await pool.query(
      "SELECT id, last_name, first_name, email, phone, password_hash FROM users WHERE email = $1 AND is_active = TRUE",
      [email.trim().toLowerCase()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Неверный email или пароль" });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: "Неверный email или пароль" });
    }

    const sid = normalizeSessionId(session_id);

    const token = jwt.sign(
      {
        user_id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    if (sid) {
      const client = await getClient();
      try {
        await client.query("BEGIN");
        await migrateSessionData(client, sid, user.id);
        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        logger.error("Session migration failed during login", { error: err });
        // не блокируем логин при ошибке миграции
      } finally {
        client.release();
      }
    }

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone || null,
      },
    });
  } catch (err) {
    logger.error("Customer login error", { error: err });
    return res.status(500).json({ error: "Ошибка сервера" });
  }
}

export async function customerRegister(req: Request, res: Response) {
  const { first_name, last_name, email, password, session_id } = req.body;

  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ error: "Заполните все обязательные поля" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Пароль должен быть не менее 6 символов" });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();

    const { rows: existing } = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [normalizedEmail]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: "Пользователь с таким email уже существует" });
    }

    const hash = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      `INSERT INTO users (last_name, first_name, email, password_hash, is_active)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING id, last_name, first_name, email, phone`,
      [last_name.trim(), first_name.trim(), normalizedEmail, hash]
    );

    const user = rows[0];
    const sid = normalizeSessionId(session_id);

    const token = jwt.sign(
      {
        user_id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    if (sid) {
      const client = await getClient();
      try {
        await client.query("BEGIN");
        await migrateSessionData(client, sid, user.id);

        await client.query(
          `INSERT INTO store_profiles (session_id, user_id, last_name, first_name, email)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (session_id) DO UPDATE
           SET user_id = $2, last_name = $3, first_name = $4, email = $5, updated_at = NOW()`,
          [sid, user.id, user.last_name, user.first_name, user.email]
        );

        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        logger.error("Session migration failed during registration", { error: err });
      } finally {
        client.release();
      }
    }

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone || null,
      },
    });
  } catch (err) {
    logger.error("Customer register error", { error: err });
    return res.status(500).json({ error: "Ошибка сервера" });
  }
}

export async function customerMe(req: Request, res: Response) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Требуется авторизация" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as CustomerTokenPayload;

    const { rows } = await pool.query(
      "SELECT id, last_name, first_name, email, phone, is_active FROM users WHERE id = $1",
      [decoded.user_id]
    );

    if (rows.length === 0 || !rows[0].is_active) {
      return res.status(401).json({ error: "Пользователь не найден или деактивирован" });
    }

    const user = rows[0];

    return res.json({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone || null,
    });
  } catch {
    return res.status(401).json({ error: "Недействительный или истёкший токен" });
  }
}

export function customerRequireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Требуется авторизация" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as CustomerTokenPayload;
    req.customer = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Недействительный или истёкший токен" });
  }
}
