import { Request, Response } from "express";
import logger from "../lib/logger";
import { AppError } from "../lib/AppError";
import * as service from "../services/collectionService";

function handleError(err: unknown, res: Response) {
  if (err instanceof AppError) return res.status(err.statusCode).json({ error: err.message });
  logger.error("Controller error", { error: err });
  return res.status(500).json({ error: "Ошибка сервера" });
}

export async function getAll(_req: Request, res: Response) {
  try { res.json(await service.listCollections()); }
  catch (err) { handleError(err, res); }
}

export async function create(req: Request, res: Response) {
  try { res.status(201).json(await service.createCollection(req.body, req.user?.id ?? null, req.ip)); }
  catch (err) { handleError(err, res); }
}

export async function update(req: Request, res: Response) {
  try { res.json(await service.updateCollection(Number(req.params.id), req.body, req.user?.id ?? null, req.ip)); }
  catch (err) { handleError(err, res); }
}

export async function remove(req: Request, res: Response) {
  try {
    const result = await service.deleteCollection(Number(req.params.id), req.user?.id ?? null, req.ip);
    res.json({ message: "Коллекция удалена", id: result.id });
  } catch (err) { handleError(err, res); }
}
