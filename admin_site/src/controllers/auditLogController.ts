import { Request, Response } from "express";
import logger from "../lib/logger";
import { AppError } from "../lib/AppError";
import * as service from "../services/auditLogService";

function handleError(err: unknown, res: Response) {
  if (err instanceof AppError) return res.status(err.statusCode).json({ error: err.message });
  logger.error("Controller error", { error: err });
  return res.status(500).json({ error: "Ошибка сервера" });
}

export async function getAll(req: Request, res: Response) {
  try { res.json(await service.listAuditLogs(Number(req.query.limit || 50))); }
  catch (err) { handleError(err, res); }
}

export async function getOne(req: Request, res: Response) {
  try { res.json(await service.getAuditLog(Number(req.params.id))); }
  catch (err) { handleError(err, res); }
}
