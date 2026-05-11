import { Request, Response } from "express";
import logger from "../lib/logger";
import { AppError } from "../lib/AppError";
import * as service from "../services/userService";

function handleError(err: unknown, res: Response) {
  if (err instanceof AppError) return res.status(err.statusCode).json({ error: err.message });
  logger.error("Controller error", { error: err });
  return res.status(500).json({ error: "Ошибка сервера" });
}

export async function getAll(_req: Request, res: Response) {
  try { res.json(await service.listUsers()); }
  catch (err) { handleError(err, res); }
}

export async function getOne(req: Request, res: Response) {
  try { res.json(await service.getUser(Number(req.params.id))); }
  catch (err) { handleError(err, res); }
}

export async function create(req: Request, res: Response) {
  try { res.status(201).json(await service.createUser(req.body)); }
  catch (err) { handleError(err, res); }
}

export async function update(req: Request, res: Response) {
  try { res.json(await service.updateUser(Number(req.params.id), req.body)); }
  catch (err) { handleError(err, res); }
}

export async function changePassword(req: Request, res: Response) {
  try {
    const user = await service.changeUserPassword(Number(req.params.id), req.body.password);
    res.json({ message: "Пароль обновлён", user });
  } catch (err) { handleError(err, res); }
}

export async function remove(req: Request, res: Response) {
  try {
    const result = await service.deleteUser(Number(req.params.id));
    res.json({ message: "Пользователь удалён", id: result.id });
  } catch (err) { handleError(err, res); }
}
