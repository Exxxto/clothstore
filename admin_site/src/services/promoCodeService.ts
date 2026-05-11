import { AppError } from "../lib/AppError";
import { logAuditAction } from "../db";
import * as repo from "../repositories/promoCodeRepository";
import type { PromoCodeData } from "../repositories/promoCodeRepository";

function normalizePromoData(body: {
  code: string;
  description?: string | null;
  discount_type: string;
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number | null;
  starts_at?: string | null;
  ends_at?: string | null;
  usage_limit?: number | null;
  is_active?: boolean;
}): PromoCodeData {
  return {
    code: String(body.code).trim().toUpperCase(),
    description: body.description ?? null,
    discount_type: body.discount_type,
    discount_value: Number(body.discount_value),
    min_order_amount: Number(body.min_order_amount) || 0,
    max_discount_amount: Number.isFinite(Number(body.max_discount_amount)) ? Number(body.max_discount_amount) : null,
    starts_at: body.starts_at ?? null,
    ends_at: body.ends_at ?? null,
    usage_limit: Number.isFinite(Number(body.usage_limit)) ? Number(body.usage_limit) : null,
    is_active: body.is_active ?? true,
  };
}

export async function listPromoCodes() {
  return repo.findAllPromoCodes();
}

export async function createPromoCode(
  body: Parameters<typeof normalizePromoData>[0],
  adminId: number | null,
  ipAddress: string | undefined
) {
  const data = normalizePromoData(body);

  try {
    const promo = await repo.createPromoCode(data);

    await logAuditAction({
      adminId,
      action: "create",
      entityType: "promo_code",
      entityId: promo.id,
      details: { code: promo.code, discount_type: promo.discount_type, discount_value: promo.discount_value },
      ipAddress,
    });

    return promo;
  } catch (err) {
    if ((err as { code?: string }).code === "23505") {
      throw new AppError("Промокод уже существует", 409);
    }
    throw err;
  }
}

export async function updatePromoCode(
  id: number,
  body: Parameters<typeof normalizePromoData>[0],
  adminId: number | null,
  ipAddress: string | undefined
) {
  const data = normalizePromoData(body);

  try {
    const promo = await repo.updatePromoCode(id, data);
    if (!promo) throw new AppError("Промокод не найден", 404);

    await logAuditAction({
      adminId,
      action: "update",
      entityType: "promo_code",
      entityId: promo.id,
      details: { code: promo.code, discount_type: promo.discount_type, discount_value: promo.discount_value, is_active: promo.is_active },
      ipAddress,
    });

    return promo;
  } catch (err) {
    if (err instanceof AppError) throw err;
    if ((err as { code?: string }).code === "23505") {
      throw new AppError("Промокод уже существует", 409);
    }
    throw err;
  }
}

export async function deletePromoCode(
  id: number,
  adminId: number | null,
  ipAddress: string | undefined
) {
  const promo = await repo.deletePromoCode(id);
  if (!promo) throw new AppError("Промокод не найден", 404);

  await logAuditAction({
    adminId,
    action: "delete",
    entityType: "promo_code",
    entityId: promo.id,
    details: { code: promo.code },
    ipAddress,
  });

  return promo;
}
