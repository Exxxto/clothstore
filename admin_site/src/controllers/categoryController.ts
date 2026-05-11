import { Request, Response } from "express";
import logger from "../lib/logger";
import { AppError } from "../lib/AppError";
import * as service from "../services/categoryService";

function handleError(err: unknown, res: Response) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  logger.error("Controller error", { error: err });
  return res.status(500).json({ error: "Ошибка сервера" });
}

export async function getAll(_req: Request, res: Response) {
  try {
    const categories = await service.listCategories();
    res.json(categories);
  } catch (err) {
    handleError(err, res);
  }
}

export async function getOne(req: Request, res: Response) {
  try {
    const category = await service.getCategory(Number(req.params.id));
    res.json(category);
  } catch (err) {
    handleError(err, res);
  }
}

export async function create(req: Request, res: Response) {
  try {
    const category = await service.createCategory(req.body, req.user?.id ?? null, req.ip);
    res.status(201).json(category);
  } catch (err) {
    handleError(err, res);
  }
}

export async function update(req: Request, res: Response) {
  try {
    const category = await service.updateCategory(
      Number(req.params.id),
      req.body,
      req.user?.id ?? null,
      req.ip
    );
    res.json(category);
  } catch (err) {
    handleError(err, res);
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const result = await service.deleteCategory(
      Number(req.params.id),
      req.user?.id ?? null,
      req.ip
    );
    res.json({ message: "Категория удалена", id: result.id });
  } catch (err) {
    handleError(err, res);
  }
}
