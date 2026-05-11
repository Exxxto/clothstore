import { AppError } from "../lib/AppError";
import * as repo from "../repositories/auditLogRepository";

export async function listAuditLogs(limit: number) {
  const safeLimit = Math.min(limit, 200);
  return repo.findAllAuditLogs(safeLimit);
}

export async function getAuditLog(id: number) {
  const log = await repo.findAuditLogById(id);
  if (!log) throw new AppError("Запись не найдена", 404);
  return log;
}
