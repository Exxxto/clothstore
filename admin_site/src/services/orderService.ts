import { AppError } from "../lib/AppError";
import { logAuditAction } from "../db";
import * as repo from "../repositories/orderRepository";

export async function listOrders(filters: repo.OrderFilters) {
  return repo.findAllOrders(filters);
}

export async function getOrder(id: number) {
  const order = await repo.findOrderById(id);
  if (!order) throw new AppError("Заказ не найден", 404);
  return order;
}

export async function changeOrderStatus(
  id: number,
  status: string,
  adminId: number | null,
  ipAddress: string | undefined
) {
  const existing = await repo.findOrderStatusById(id);
  if (!existing) throw new AppError("Заказ не найден", 404);

  const updated = await repo.updateOrderStatus(id, status);

  // Записываем историю смены статуса
  await repo.insertOrderStatusHistory({
    orderId: updated.id,
    previousStatus: existing.status,
    nextStatus: status,
    adminId,
    note: "Status updated from admin panel",
  });

  await logAuditAction({
    adminId,
    action: "update_status",
    entityType: "order",
    entityId: updated.id,
    details: { status },
    ipAddress,
  });

  return updated;
}

export async function changeOrderPayment(
  id: number,
  data: { payment_status: string; payment_provider?: string | null; payment_reference?: string | null },
  adminId: number | null,
  ipAddress: string | undefined
) {
  const updated = await repo.updateOrderPayment(id, {
    payment_status: data.payment_status,
    payment_provider: data.payment_provider ?? null,
    payment_reference: data.payment_reference ?? null,
  });

  if (!updated) throw new AppError("Заказ не найден", 404);

  await logAuditAction({
    adminId,
    action: "update_payment",
    entityType: "order",
    entityId: updated.id,
    details: {
      payment_status: data.payment_status,
      payment_provider: data.payment_provider,
      payment_reference: data.payment_reference,
    },
    ipAddress,
  });

  return updated;
}

export async function changeOrderFulfillment(
  id: number,
  data: { carrier?: string | null; tracking_number?: string | null; shipped_at?: string | null },
  adminId: number | null,
  ipAddress: string | undefined
) {
  const shippedAt =
    typeof data.shipped_at === "string" && data.shipped_at.trim()
      ? new Date(data.shipped_at)
      : null;

  const updated = await repo.updateOrderFulfillment(id, {
    carrier: data.carrier ?? null,
    tracking_number: data.tracking_number ?? null,
    shipped_at: shippedAt,
  });

  if (!updated) throw new AppError("Заказ не найден", 404);

  await logAuditAction({
    adminId,
    action: "update_fulfillment",
    entityType: "order",
    entityId: updated.id,
    details: { carrier: data.carrier, tracking_number: data.tracking_number, shipped_at: shippedAt },
    ipAddress,
  });

  return updated;
}
