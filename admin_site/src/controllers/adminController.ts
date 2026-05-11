import { Request, Response } from "express";
import logger from "../lib/logger";
import { AppError } from "../lib/AppError";
import * as service from "../services/adminService";

function handleError(err: unknown, res: Response) {
  if (err instanceof AppError) return res.status(err.statusCode).json({ error: err.message });
  logger.error("Controller error", { error: err });
  return res.status(500).json({ error: "Ошибка сервера" });
}

export async function getAll(_req: Request, res: Response) {
  try { res.json(await service.listAdmins()); }
  catch (err) { handleError(err, res); }
}

export async function getMe(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: "Требуется авторизация" });
    res.json(await service.getAdmin(req.user.id));
  } catch (err) { handleError(err, res); }
}

export async function create(req: Request, res: Response) {
  try { res.status(201).json(await service.createAdmin(req.body)); }
  catch (err) { handleError(err, res); }
}

export async function update(req: Request, res: Response) {
  try { res.json(await service.updateAdmin(Number(req.params.id), req.body)); }
  catch (err) { handleError(err, res); }
}

export async function changePassword(req: Request, res: Response) {
  try {
    const admin = await service.changeAdminPassword(Number(req.params.id), req.body.password);
    res.json({ message: "Пароль обновлён", admin });
  } catch (err) { handleError(err, res); }
}

export async function remove(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: "Требуется авторизация" });
    const result = await service.deleteAdmin(Number(req.params.id), req.user.id);
    res.json({ message: "Админ удалён", id: result.id });
  } catch (err) { handleError(err, res); }
}
