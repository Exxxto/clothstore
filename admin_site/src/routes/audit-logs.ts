import { Router, Request, Response } from "express";
import logger from "../lib/logger";
import { pool } from "../db";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/", async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit || 50), 200);

  try {
    const { rows } = await pool.query(
      `SELECT al.id,
              al.action,
              al.entity_type,
              al.entity_id,
              al.details,
              al.ip_address,
              al.created_at,
              a.username AS admin_username,
              a.last_name AS admin_last_name,
              a.first_name AS admin_first_name
       FROM audit_logs al
       LEFT JOIN admins a ON a.id = al.admin_id
       ORDER BY al.created_at DESC
       LIMIT $1`,
      [limit]
    );
    res.json(rows);
  } catch (err) {
    logger.error("Route error", { error: err });
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT al.id,
              al.action,
              al.entity_type,
              al.entity_id,
              al.details,
              al.ip_address,
              al.created_at,
              a.username AS admin_username,
              a.last_name AS admin_last_name,
              a.first_name AS admin_first_name
       FROM audit_logs al
       LEFT JOIN admins a ON a.id = al.admin_id
       WHERE al.id = $1`,
      [req.params.id]
    );

    if (rows.length === 0) return res.status(404).json({ error: "Запись не найдена" });
    res.json(rows[0]);
  } catch (err) {
    logger.error("Route error", { error: err });
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

export default router;
