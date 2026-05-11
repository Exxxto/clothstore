import { AppError } from "../lib/AppError";
import { logAuditAction } from "../db";
import * as repo from "../repositories/checkoutMethodRepository";

function trim(v: unknown) { return typeof v === "string" ? v.trim() : ""; }
function num(v: unknown, fallback = 0) { const n = Number(v); return Number.isFinite(n) ? n : fallback; }

export async function listCheckoutMethods() {
  const [shipping, payment] = await Promise.all([
    repo.findAllShippingMethods(),
    repo.findAllPaymentMethods(),
  ]);
  return { shipping_methods: shipping, payment_methods: payment };
}

// ── Shipping ──────────────────────────────────────────────────────────────────

export async function createShippingMethod(
  body: Record<string, unknown>,
  adminId: number | null,
  ipAddress: string | undefined
) {
  const data = {
    code: trim(body.code),
    name: trim(body.name),
    description: trim(body.description) || null,
    price: Math.max(0, num(body.price)),
    sort_order: num(body.sort_order),
    is_active: body.is_active !== false,
  };

  try {
    const method = await repo.createShippingMethod(data);
    await logAuditAction({ adminId, action: "create", entityType: "shipping_method", entityId: method.id, details: { code: method.code, name: method.name, price: method.price }, ipAddress });
    return method;
  } catch (err) {
    if ((err as { code?: string }).code === "23505") throw new AppError("Способ доставки с таким кодом уже существует", 409);
    throw err;
  }
}

export async function updateShippingMethod(
  id: number,
  body: Record<string, unknown>,
  adminId: number | null,
  ipAddress: string | undefined
) {
  const data = {
    code: trim(body.code),
    name: trim(body.name),
    description: trim(body.description) || null,
    price: Math.max(0, num(body.price)),
    sort_order: num(body.sort_order),
    is_active: body.is_active !== false,
  };

  try {
    const method = await repo.updateShippingMethod(id, data);
    if (!method) throw new AppError("Способ доставки не найден", 404);
    await logAuditAction({ adminId, action: "update", entityType: "shipping_method", entityId: method.id, details: { code: method.code, name: method.name, price: method.price, is_active: method.is_active }, ipAddress });
    return method;
  } catch (err) {
    if (err instanceof AppError) throw err;
    if ((err as { code?: string }).code === "23505") throw new AppError("Способ доставки с таким кодом уже существует", 409);
    throw err;
  }
}

export async function deleteShippingMethod(id: number, adminId: number | null, ipAddress: string | undefined) {
  const method = await repo.deleteShippingMethod(id);
  if (!method) throw new AppError("Способ доставки не найден", 404);
  await logAuditAction({ adminId, action: "delete", entityType: "shipping_method", entityId: method.id, details: { code: method.code, name: method.name }, ipAddress });
  return method;
}

// ── Payment ───────────────────────────────────────────────────────────────────

export async function createPaymentMethod(
  body: Record<string, unknown>,
  adminId: number | null,
  ipAddress: string | undefined
) {
  const data = {
    code: trim(body.code),
    name: trim(body.name),
    description: trim(body.description) || null,
    requires_card: body.requires_card === true,
    sort_order: num(body.sort_order),
    is_active: body.is_active !== false,
  };

  try {
    const method = await repo.createPaymentMethod(data);
    await logAuditAction({ adminId, action: "create", entityType: "payment_method", entityId: method.id, details: { code: method.code, name: method.name, requires_card: method.requires_card }, ipAddress });
    return method;
  } catch (err) {
    if ((err as { code?: string }).code === "23505") throw new AppError("Способ оплаты с таким кодом уже существует", 409);
    throw err;
  }
}

export async function updatePaymentMethod(
  id: number,
  body: Record<string, unknown>,
  adminId: number | null,
  ipAddress: string | undefined
) {
  const data = {
    code: trim(body.code),
    name: trim(body.name),
    description: trim(body.description) || null,
    requires_card: body.requires_card === true,
    sort_order: num(body.sort_order),
    is_active: body.is_active !== false,
  };

  try {
    const method = await repo.updatePaymentMethod(id, data);
    if (!method) throw new AppError("Способ оплаты не найден", 404);
    await logAuditAction({ adminId, action: "update", entityType: "payment_method", entityId: method.id, details: { code: method.code, name: method.name, requires_card: method.requires_card, is_active: method.is_active }, ipAddress });
    return method;
  } catch (err) {
    if (err instanceof AppError) throw err;
    if ((err as { code?: string }).code === "23505") throw new AppError("Способ оплаты с таким кодом уже существует", 409);
    throw err;
  }
}

export async function deletePaymentMethod(id: number, adminId: number | null, ipAddress: string | undefined) {
  const method = await repo.deletePaymentMethod(id);
  if (!method) throw new AppError("Способ оплаты не найден", 404);
  await logAuditAction({ adminId, action: "delete", entityType: "payment_method", entityId: method.id, details: { code: method.code, name: method.name }, ipAddress });
  return method;
}
