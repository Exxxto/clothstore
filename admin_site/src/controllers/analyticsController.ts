import { Request, Response } from "express";
import logger from "../lib/logger";
import { getAnalytics } from "../services/analyticsService";

export async function getAll(req: Request, res: Response) {
  try {
    const data = await getAnalytics(req.query.gender, req.query.limit);
    res.json(data);
  } catch (err) {
    logger.error("Controller error", { error: err });
    res.status(500).json({ error: "Ошибка сервера" });
  }
}
