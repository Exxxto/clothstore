import { Request, Response } from "express";
import logger from "../lib/logger";
import { AppError } from "../lib/AppError";
import * as service from "../services/complaintService";

function handleError(err: unknown, res: Response) {
  if (err instanceof AppError) return res.status(err.statusCode).json({ error: err.message });
  logger.error("Controller error", { error: err });
  return res.status(500).json({ error: "Ошибка сервера" });
}

export async function create(req: Request, res: Response) {
  try { res.status(201).json(await service.createComplaint(req.body)); }
  catch (err) { handleError(err, res); }
}

export async function getAll(req: Request, res: Response) {
  try {
    const rows = await service.listComplaints({
      limit: Number(req.query.limit || 100),
      status: typeof req.query.status === "string" ? req.query.status : undefined,
      search: typeof req.query.search === "string" ? req.query.search : undefined,
    });
    res.json(rows);
  } catch (err) { handleError(err, res); }
}

export async function getOne(req: Request, res: Response) {
  try { res.json(await service.getComplaint(Number(req.params.id))); }
  catch (err) { handleError(err, res); }
}

export async function updateStatus(req: Request, res: Response) {
  try {
    const result = await service.changeComplaintStatus(Number(req.params.id), req.body.status);
    res.json(result);
  } catch (err) { handleError(err, res); }
}
