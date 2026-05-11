import { Request, Response } from "express";
import logger from "../lib/logger";
import { AppError } from "../lib/AppError";
import * as service from "../services/reviewService";

function handleError(err: unknown, res: Response) {
  if (err instanceof AppError) return res.status(err.statusCode).json({ error: err.message });
  logger.error("Controller error", { error: err });
  return res.status(500).json({ error: "Ошибка сервера" });
}

/** GET /api/products/:productId/reviews — публичный */
export async function getProductReviews(req: Request, res: Response) {
  try {
    const productId = Number(req.params.productId);
    if (!Number.isFinite(productId)) return res.status(400).json({ error: "Некорректный ID товара" });
    res.json(await service.getProductReviews(productId));
  } catch (err) { handleError(err, res); }
}

/** GET /api/products/:productId/reviews/my?session_id=... — публичный */
export async function getMyReview(req: Request, res: Response) {
  try {
    const productId = Number(req.params.productId);
    const sessionId = typeof req.query.session_id === "string" ? req.query.session_id : "";
    if (!Number.isFinite(productId)) return res.status(400).json({ error: "Некорректный ID товара" });
    if (!sessionId) return res.json(null);
    const review = await service.getMyReview(productId, sessionId);
    res.json(review ?? null);
  } catch (err) { handleError(err, res); }
}

/** POST /api/products/:productId/reviews — публичный */
export async function createReview(req: Request, res: Response) {
  try {
    const productId = Number(req.params.productId);
    if (!Number.isFinite(productId)) return res.status(400).json({ error: "Некорректный ID товара" });
    const sessionId = typeof req.body.session_id === "string" ? req.body.session_id.trim() : "";
    if (!sessionId) return res.status(400).json({ error: "session_id обязателен" });
    const review = await service.submitReview(productId, sessionId, req.body);
    res.status(201).json(review);
  } catch (err) { handleError(err, res); }
}

/** GET /api/reviews — только для админов */
export async function getAllReviews(req: Request, res: Response) {
  try {
    const rows = await service.listAllReviews({
      limit: Number(req.query.limit || 100),
      status: typeof req.query.status === "string" ? req.query.status : undefined,
      product_id: req.query.product_id ? Number(req.query.product_id) : undefined,
    });
    res.json(rows);
  } catch (err) { handleError(err, res); }
}

/** PUT /api/reviews/:id/status — только для админов */
export async function updateReviewStatus(req: Request, res: Response) {
  try {
    const result = await service.changeReviewStatus(Number(req.params.id), req.body.status);
    res.json(result);
  } catch (err) { handleError(err, res); }
}

/** DELETE /api/reviews/:id — только для админов */
export async function deleteReview(req: Request, res: Response) {
  try {
    await service.removeReview(Number(req.params.id));
    res.status(204).send();
  } catch (err) { handleError(err, res); }
}
