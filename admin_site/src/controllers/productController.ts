import { Request, Response } from "express";
import logger from "../lib/logger";
import { AppError } from "../lib/AppError";
import * as service from "../services/productService";

function handleError(err: unknown, res: Response) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  logger.error("Controller error", { error: err });
  return res.status(500).json({ error: "Ошибка сервера" });
}

export async function getAll(req: Request, res: Response) {
  try {
    const { gender, type, season, search, material } = req.query;
    const products = await service.listProducts({
      gender: typeof gender === "string" ? gender : undefined,
      type: typeof type === "string" ? type : undefined,
      season: typeof season === "string" ? season : undefined,
      search: typeof search === "string" ? search : undefined,
      material: typeof material === "string" ? material : undefined,
    });
    res.json(products);
  } catch (err) {
    handleError(err, res);
  }
}

export async function getOne(req: Request, res: Response) {
  try {
    const product = await service.getProduct(Number(req.params.id));
    res.json(product);
  } catch (err) {
    handleError(err, res);
  }
}

export async function create(req: Request, res: Response) {
  try {
    const product = await service.createProduct(req.body, req.user?.id ?? null, req.ip);
    res.status(201).json(product);
  } catch (err) {
    handleError(err, res);
  }
}

export async function update(req: Request, res: Response) {
  try {
    const product = await service.updateProduct(
      Number(req.params.id),
      req.body,
      req.user?.id ?? null,
      req.ip
    );
    res.json(product);
  } catch (err) {
    handleError(err, res);
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const result = await service.deleteProduct(
      Number(req.params.id),
      req.user?.id ?? null,
      req.ip
    );
    res.json({ message: "Товар удалён", id: result.id });
  } catch (err) {
    handleError(err, res);
  }
}
