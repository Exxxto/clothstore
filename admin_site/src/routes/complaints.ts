import { Router, Request, Response } from "express";
import { pool } from "../db";
import { requireAuth } from "../middleware/auth";

const router = Router();

const ALLOWED_STATUSES = new Set(["new", "in_review", "resolved", "rejected"]);

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

// POST /api/complaints — public
router.post("/", async (req: Request, res: Response) => {
  const requesterName = normalizeText(req.body.requester_name);
  const email = normalizeText(req.body.email);
  const phone = normalizeText(req.body.phone);
  const orderNumber = normalizeText(req.body.order_number);
  const category = normalizeText(req.body.category);
  const message = normalizeText(req.body.message);

  if (!requesterName || !email || !category || !message) {
    return res.status(400).json({ error: "Укажите имя, email, категорию и текст жалобы" });
  }

  if (!email.includes("@")) {
    return res.status(400).json({ error: "Укажите корректный email" });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO complaints (requester_name, email, phone, order_number, category, message)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, requester_name, email, phone, order_number, category, message, status, created_at, updated_at`,
      [requesterName, email, phone || null, orderNumber || null, category, message]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.use(requireAuth);

// GET /api/complaints — admin only
router.get("/", async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit || 100), 500);
  const { status, search } = req.query;

  try {
    const conditions: string[] = [];
    const params: Array<string | number> = [limit];

    if (typeof status === "string" && status && status !== "all") {
      conditions.push(`c.status = $${params.length + 1}`);
      params.push(status);
    }

    if (typeof search === "string" && search.trim()) {
      conditions.push(`(
        c.requester_name ILIKE $${params.length + 1}
        OR c.email ILIKE $${params.length + 1}
        OR COALESCE(c.phone, '') ILIKE $${params.length + 1}
        OR COALESCE(c.order_number, '') ILIKE $${params.length + 1}
        OR c.category ILIKE $${params.length + 1}
        OR c.message ILIKE $${params.length + 1}
      )`);
      params.push(`%${search.trim()}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const { rows } = await pool.query(
      `SELECT c.id,
              c.requester_name,
              c.email,
              c.phone,
              c.order_number,
              c.category,
              c.message,
              c.status,
              c.created_at,
              c.updated_at
       FROM complaints c
       ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT $1`,
      params
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// GET /api/complaints/:id — admin only
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT id,
              requester_name,
              email,
              phone,
              order_number,
              category,
              message,
              status,
              created_at,
              updated_at
       FROM complaints
       WHERE id = $1`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Жалоба не найдена" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// PUT /api/complaints/:id/status — admin only
router.put("/:id/status", async (req: Request, res: Response) => {
  const status = normalizeText(req.body.status);

  if (!status || !ALLOWED_STATUSES.has(status)) {
    return res.status(400).json({ error: "Укажите корректный статус жалобы" });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE complaints
       SET status = $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING id, status, updated_at`,
      [status, req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Жалоба не найдена" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

export default router;
