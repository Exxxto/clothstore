import { Request, Response } from "express";
import logger from "../lib/logger";
import { AppError } from "../lib/AppError";
import * as service from "../services/inventoryService";

function handleError(err: unknown, res: Response) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  logger.error("Controller error", { error: err });
  return res.status(500).json({ error: "Ошибка сервера" });
}

export async function getBalances(req: Request, res: Response) {
  try {
    const rows = await service.listStockBalances({
      search: typeof req.query.search === "string" ? req.query.search : undefined,
      warehouse_id: typeof req.query.warehouse_id === "string" ? req.query.warehouse_id : undefined,
      low_stock: typeof req.query.low_stock === "string" ? req.query.low_stock : undefined,
    });
    res.json(rows);
  } catch (err) {
    handleError(err, res);
  }
}

export async function getMovements(req: Request, res: Response) {
  try {
    const limit = Math.min(Number(req.query.limit || 100), 300);
    const rows = await service.listStockMovements(limit);
    res.json(rows);
  } catch (err) {
    handleError(err, res);
  }
}

export async function createMovement(req: Request, res: Response) {
  try {
    const result = await service.addStockMovement(
      {
        warehouse_id: Number(req.body.warehouse_id),
        product_variant_id: Number(req.body.product_variant_id),
        quantity_delta: Number(req.body.quantity_delta),
        movement_type: String(req.body.movement_type),
        reason: typeof req.body.reason === "string" ? req.body.reason : null,
        reference_type: typeof req.body.reference_type === "string" ? req.body.reference_type : null,
        reference_id: Number.isFinite(Number(req.body.reference_id)) ? Number(req.body.reference_id) : null,
        notes: typeof req.body.notes === "string" ? req.body.notes : null,
      },
      req.user?.id ?? null,
      req.ip
    );
    res.status(201).json(result);
  } catch (err) {
    handleError(err, res);
  }
}
