import { AppError } from "../lib/AppError";
import { createStockMovement, logAuditAction } from "../db";
import * as repo from "../repositories/inventoryRepository";

export async function listStockBalances(filters: {
  search?: string;
  warehouse_id?: string;
  low_stock?: string;
}) {
  return repo.findStockBalances({
    search: filters.search,
    warehouse_id: filters.warehouse_id ? Number(filters.warehouse_id) : undefined,
    low_stock: filters.low_stock === "true",
  });
}

export async function listStockMovements(limit: number) {
  const safeLimit = Math.min(limit, 300);
  return repo.findStockMovements(safeLimit);
}

export async function addStockMovement(
  data: {
    warehouse_id: number;
    product_variant_id: number;
    quantity_delta: number;
    movement_type: string;
    reason?: string | null;
    reference_type?: string | null;
    reference_id?: number | null;
    notes?: string | null;
  },
  adminId: number | null,
  ipAddress: string | undefined
) {
  let updatedBalance;
  try {
    updatedBalance = await createStockMovement({
      warehouseId: data.warehouse_id,
      productVariantId: data.product_variant_id,
      quantityDelta: data.quantity_delta,
      movementType: data.movement_type,
      reason: data.reason ?? null,
      referenceType: data.reference_type ?? null,
      referenceId: data.reference_id ?? null,
      adminId,
      notes: data.notes ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ошибка сервера";
    if (message === "Недостаточно остатка для списания") {
      throw new AppError(message, 400);
    }
    throw err;
  }

  await logAuditAction({
    adminId,
    action: "stock_movement",
    entityType: "inventory",
    entityId: updatedBalance.id,
    details: {
      warehouse_id: data.warehouse_id,
      product_variant_id: data.product_variant_id,
      quantity_delta: data.quantity_delta,
      movement_type: data.movement_type,
    },
    ipAddress,
  });

  return updatedBalance;
}
