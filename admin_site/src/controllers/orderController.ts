import { Request, Response } from "express";
import logger from "../lib/logger";
import { AppError } from "../lib/AppError";
import * as service from "../services/orderService";

function handleError(err: unknown, res: Response) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  logger.error("Controller error", { error: err });
  return res.status(500).json({ error: "Ошибка сервера" });
}

export async function getAll(req: Request, res: Response) {
  try {
    const orders = await service.listOrders({
      limit: Number(req.query.limit || 100),
      status: typeof req.query.status === "string" ? req.query.status : undefined,
      search: typeof req.query.search === "string" ? req.query.search : undefined,
    });
    res.json(orders);
  } catch (err) {
    handleError(err, res);
  }
}

export async function getOne(req: Request, res: Response) {
  try {
    const order = await service.getOrder(Number(req.params.id));
    res.json(order);
  } catch (err) {
    handleError(err, res);
  }
}

export async function updateStatus(req: Request, res: Response) {
  try {
    const result = await service.changeOrderStatus(
      Number(req.params.id),
      req.body.status,
      req.user?.id ?? null,
      req.ip
    );
    res.json(result);
  } catch (err) {
    handleError(err, res);
  }
}

export async function updatePayment(req: Request, res: Response) {
  try {
    const result = await service.changeOrderPayment(
      Number(req.params.id),
      {
        payment_status: req.body.payment_status,
        payment_provider: typeof req.body.payment_provider === "string" ? req.body.payment_provider.trim() : null,
        payment_reference: typeof req.body.payment_reference === "string" ? req.body.payment_reference.trim() : null,
      },
      req.user?.id ?? null,
      req.ip
    );
    res.json(result);
  } catch (err) {
    handleError(err, res);
  }
}

export async function updateFulfillment(req: Request, res: Response) {
  try {
    const result = await service.changeOrderFulfillment(
      Number(req.params.id),
      {
        carrier: typeof req.body.carrier === "string" ? req.body.carrier.trim() : null,
        tracking_number: typeof req.body.tracking_number === "string" ? req.body.tracking_number.trim() : null,
        shipped_at: typeof req.body.shipped_at === "string" ? req.body.shipped_at : null,
      },
      req.user?.id ?? null,
      req.ip
    );
    res.json(result);
  } catch (err) {
    handleError(err, res);
  }
}
