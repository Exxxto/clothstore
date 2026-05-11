import { Request, Response } from "express";
import logger from "../lib/logger";
import { AppError } from "../lib/AppError";
import * as service from "../services/checkoutMethodService";

function handleError(err: unknown, res: Response) {
  if (err instanceof AppError) return res.status(err.statusCode).json({ error: err.message });
  logger.error("Controller error", { error: err });
  return res.status(500).json({ error: "Ошибка сервера" });
}

export async function getAll(_req: Request, res: Response) {
  try { res.json(await service.listCheckoutMethods()); }
  catch (err) { handleError(err, res); }
}

export async function createShipping(req: Request, res: Response) {
  try { res.status(201).json(await service.createShippingMethod(req.body, req.user?.id ?? null, req.ip)); }
  catch (err) { handleError(err, res); }
}

export async function updateShipping(req: Request, res: Response) {
  try { res.json(await service.updateShippingMethod(Number(req.params.id), req.body, req.user?.id ?? null, req.ip)); }
  catch (err) { handleError(err, res); }
}

export async function deleteShipping(req: Request, res: Response) {
  try {
    const result = await service.deleteShippingMethod(Number(req.params.id), req.user?.id ?? null, req.ip);
    res.json({ message: "Способ доставки удалён", id: result.id });
  } catch (err) { handleError(err, res); }
}

export async function createPayment(req: Request, res: Response) {
  try { res.status(201).json(await service.createPaymentMethod(req.body, req.user?.id ?? null, req.ip)); }
  catch (err) { handleError(err, res); }
}

export async function updatePayment(req: Request, res: Response) {
  try { res.json(await service.updatePaymentMethod(Number(req.params.id), req.body, req.user?.id ?? null, req.ip)); }
  catch (err) { handleError(err, res); }
}

export async function deletePayment(req: Request, res: Response) {
  try {
    const result = await service.deletePaymentMethod(Number(req.params.id), req.user?.id ?? null, req.ip);
    res.json({ message: "Способ оплаты удалён", id: result.id });
  } catch (err) { handleError(err, res); }
}
