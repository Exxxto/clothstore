import { AppError } from "../lib/AppError";
import { logAuditAction, logPriceHistory } from "../db";
import * as repo from "../repositories/productVariantRepository";

function makeSku(base: string): string {
  return base
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export async function listVariants(filters: repo.VariantFilters) {
  return repo.findAllVariants(filters);
}

export async function getVariant(id: number) {
  const variant = await repo.findVariantById(id);
  if (!variant) throw new AppError("Вариант товара не найден", 404);

  const balances = await repo.findVariantBalances(id);
  return { ...variant, balances };
}

export async function createVariant(
  data: {
    product_id: number;
    variant_name?: string | null;
    size?: string | null;
    color?: string | null;
    barcode?: string | null;
    sku?: string | null;
    price: number;
    old_price?: number | null;
    cost_price?: number | null;
    stock_tracking?: boolean;
    is_active?: boolean;
    attributes?: Record<string, unknown>;
  },
  adminId: number | null,
  ipAddress: string | undefined
) {
  const product = await repo.findProductById(data.product_id);
  if (!product) throw new AppError("Товар не найден", 404);

  const finalVariantName = data.variant_name
    || `${product.name}${data.size ? ` / ${data.size}` : ""}${data.color ? ` / ${data.color}` : ""}`;
  const finalSku = makeSku(
    data.sku || `${product.name}-${data.size || "std"}-${data.color || product.id}-${Date.now()}`
  );

  try {
    const variant = await repo.createVariant({
      product_id: data.product_id,
      sku: finalSku,
      variant_name: finalVariantName,
      size: data.size ?? null,
      color: data.color ?? null,
      barcode: data.barcode ?? null,
      price: data.price,
      old_price: data.old_price ?? null,
      cost_price: data.cost_price ?? null,
      stock_tracking: data.stock_tracking ?? true,
      is_active: data.is_active ?? true,
      attributes: data.attributes ?? {},
    });

    await repo.initVariantStockBalances(variant.id);

    await logPriceHistory({
      productId: data.product_id,
      productVariantId: variant.id,
      adminId,
      source: "variant_create",
      oldPrice: null,
      newPrice: variant.price,
      oldOldPrice: null,
      newOldPrice: variant.old_price,
    });

    await logAuditAction({
      adminId,
      action: "create",
      entityType: "product_variant",
      entityId: variant.id,
      details: { product_id: data.product_id, sku: finalSku, size: data.size ?? null, color: data.color ?? null },
      ipAddress,
    });

    return variant;
  } catch (err) {
    if ((err as { code?: string }).code === "23505") throw new AppError("SKU уже используется", 409);
    throw err;
  }
}

export async function updateVariant(
  id: number,
  data: {
    variant_name: string;
    size?: string | null;
    color?: string | null;
    barcode?: string | null;
    sku?: string | null;
    price: number;
    old_price?: number | null;
    cost_price?: number | null;
    stock_tracking?: boolean;
    is_active?: boolean;
    attributes?: Record<string, unknown>;
  },
  adminId: number | null,
  ipAddress: string | undefined
) {
  const existing = await repo.findVariantPriceById(id);
  if (!existing) throw new AppError("Вариант товара не найден", 404);

  try {
    const variant = await repo.updateVariant(id, {
      variant_name: data.variant_name,
      size: data.size ?? null,
      color: data.color ?? null,
      barcode: data.barcode ?? null,
      sku: makeSku(data.sku || data.variant_name || `VARIANT-${id}`),
      price: data.price,
      old_price: data.old_price ?? null,
      cost_price: data.cost_price ?? null,
      stock_tracking: data.stock_tracking ?? true,
      is_active: data.is_active ?? true,
      attributes: data.attributes ?? {},
    });

    if (!variant) throw new AppError("Вариант товара не найден", 404);

    if (existing.price !== variant.price || existing.old_price !== variant.old_price) {
      await logPriceHistory({
        productId: existing.product_id,
        productVariantId: variant.id,
        adminId,
        source: "variant_update",
        oldPrice: existing.price,
        newPrice: variant.price,
        oldOldPrice: existing.old_price,
        newOldPrice: variant.old_price,
      });
    }

    await logAuditAction({
      adminId,
      action: "update",
      entityType: "product_variant",
      entityId: variant.id,
      details: { sku: variant.sku, size: variant.size, color: variant.color, is_active: variant.is_active },
      ipAddress,
    });

    return variant;
  } catch (err) {
    if (err instanceof AppError) throw err;
    if ((err as { code?: string }).code === "23505") throw new AppError("SKU уже используется", 409);
    throw err;
  }
}

export async function deactivateVariant(id: number, adminId: number | null, ipAddress: string | undefined) {
  const variant = await repo.deactivateVariant(id);
  if (!variant) throw new AppError("Вариант товара не найден", 404);

  await logAuditAction({
    adminId,
    action: "deactivate",
    entityType: "product_variant",
    entityId: variant.id,
    details: { sku: variant.sku },
    ipAddress,
  });

  return variant;
}
