import { AppError } from "../lib/AppError";
import { logAuditAction } from "../db";
import * as repo from "../repositories/warehouseRepository";

function makeCode(value: string): string {
  return value
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function listWarehouses() {
  return repo.findAllWarehouses();
}

export async function createWarehouse(
  data: { name: string; code?: string | null; city?: string | null; address?: string | null; is_active?: boolean },
  adminId: number | null,
  ipAddress: string | undefined
) {
  const finalCode = typeof data.code === "string" && data.code.trim() ? makeCode(data.code) : makeCode(data.name);

  try {
    const warehouse = await repo.createWarehouse({
      name: data.name,
      code: finalCode,
      city: data.city ?? null,
      address: data.address ?? null,
      is_active: data.is_active ?? true,
    });

    // Инициализируем остатки для всех существующих вариантов товаров
    await repo.initWarehouseStockBalances(warehouse.id);

    await logAuditAction({
      adminId,
      action: "create",
      entityType: "warehouse",
      entityId: warehouse.id,
      details: { name: data.name, code: finalCode },
      ipAddress,
    });

    return warehouse;
  } catch (err) {
    if ((err as { code?: string }).code === "23505") {
      throw new AppError("Название или код уже заняты", 409);
    }
    throw err;
  }
}

export async function updateWarehouse(
  id: number,
  data: { name: string; code?: string | null; city?: string | null; address?: string | null; is_active?: boolean },
  adminId: number | null,
  ipAddress: string | undefined
) {
  const finalCode = typeof data.code === "string" && data.code.trim() ? makeCode(data.code) : makeCode(data.name);

  try {
    const warehouse = await repo.updateWarehouse(id, {
      name: data.name,
      code: finalCode,
      city: data.city ?? null,
      address: data.address ?? null,
      is_active: data.is_active ?? true,
    });

    if (!warehouse) throw new AppError("Склад не найден", 404);

    await logAuditAction({
      adminId,
      action: "update",
      entityType: "warehouse",
      entityId: warehouse.id,
      details: { name: data.name, code: finalCode, is_active: data.is_active ?? true },
      ipAddress,
    });

    return warehouse;
  } catch (err) {
    if (err instanceof AppError) throw err;
    if ((err as { code?: string }).code === "23505") {
      throw new AppError("Название или код уже заняты", 409);
    }
    throw err;
  }
}

export async function deleteWarehouse(
  id: number,
  adminId: number | null,
  ipAddress: string | undefined
) {
  const warehouse = await repo.deleteWarehouse(id);
  if (!warehouse) throw new AppError("Склад не найден", 404);

  await logAuditAction({
    adminId,
    action: "delete",
    entityType: "warehouse",
    entityId: warehouse.id,
    details: { name: warehouse.name, code: warehouse.code },
    ipAddress,
  });

  return warehouse;
}
