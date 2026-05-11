import { Request, Response } from "express";
import logger from "../lib/logger";
import { AppError } from "../lib/AppError";
import * as service from "../services/productVariantService";

function handleError(err: unknown, res: Response) {
  if (err instanceof AppError) return res.status(err.statusCode).json({ error: err.message });
  logger.error("Controller error", { error: err });
  return res.status(500).json({ error: "Ошибка сервера" });
}

export async function getAll(req: Request, res: Response) {
  try {
    const rows = await service.listVariants({
      product_id: typeof req.query.product_id === "string" ? Number(req.query.product_id) : undefined,
      search: typeof req.query.search === "string" ? req.query.search : undefined,
      active: typeof req.query.active === "string" ? req.query.active : undefined,
    });
    res.json(rows);
  } catch (err) { handleError(err, res); }
}

export async function getOne(req: Request, res: Response) {
  try { res.json(await service.getVariant(Number(req.params.id))); }
  catch (err) { handleError(err, res); }
}

export async function create(req: Request, res: Response) {
  try { res.status(201).json(await service.createVariant(req.body, req.user?.id ?? null, req.ip)); }
  catch (err) { handleError(err, res); }
}

export async function update(req: Request, res: Response) {
  try { res.json(await service.updateVariant(Number(req.params.id), req.body, req.user?.id ?? null, req.ip)); }
  catch (err) { handleError(err, res); }
}

export async function deactivate(req: Request, res: Response) {
  try {
    const result = await service.deactivateVariant(Number(req.params.id), req.user?.id ?? null, req.ip);
    res.json({ message: "Вариант товара деактивирован", id: result.id });
  } catch (err) { handleError(err, res); }
}
