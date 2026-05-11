import { AppError } from "../lib/AppError";
import { logAuditAction, logPriceHistory, syncProductImages, syncProductVariants, pool } from "../db";
import { normalizeGenderInput } from "../lib/productNormalization";
import * as repo from "../repositories/productRepository";

export async function listProducts(filters: repo.ProductFilters) {
  const normalizedGender = filters.gender
    ? normalizeGenderInput(filters.gender) ?? undefined
    : undefined;

  return repo.findAllProducts({ ...filters, gender: normalizedGender });
}

export async function getProduct(id: number) {
  const product = await repo.findProductById(id);
  if (!product) throw new AppError("Товар не найден", 404);
  return product;
}

export async function createProduct(
  data: {
    name: string;
    type: string;
    gender: string;
    price: number;
    old_price?: number | null;
    image_url?: string | null;
    season: string;
    category_id?: number | null;
    is_new?: boolean;
    sizes?: string[];
    description?: string;
  },
  adminId: number | null,
  ipAddress: string | undefined
) {
  const normalizedGender = normalizeGenderInput(data.gender);
  if (!normalizedGender) throw new AppError("Укажите корректный пол товара", 400);

  const product = await repo.createProduct({
    name: data.name,
    type: data.type,
    gender: normalizedGender,
    price: data.price,
    old_price: data.old_price ?? null,
    image_url: data.image_url ?? null,
    season: data.season,
    category_id: data.category_id ?? null,
    is_new: data.is_new ?? false,
    sizes: data.sizes ?? [],
    description: data.description ?? "",
  });

  await logAuditAction({
    adminId,
    action: "create",
    entityType: "product",
    entityId: product.id,
    details: { name: data.name, type: data.type, gender: normalizedGender, price: data.price, category_id: data.category_id ?? null },
    ipAddress,
  });

  await logPriceHistory({
    productId: product.id,
    adminId,
    source: "product_create",
    oldPrice: null,
    newPrice: product.price,
    oldOldPrice: null,
    newOldPrice: product.old_price,
  });

  await syncProductImages(pool);
  await syncProductVariants(pool, product.id);

  return product;
}

export async function updateProduct(
  id: number,
  data: {
    name: string;
    type: string;
    gender: string;
    price: number;
    old_price?: number | null;
    image_url?: string | null;
    season: string;
    category_id?: number | null;
    is_new?: boolean;
    sizes?: string[];
    description?: string;
  },
  adminId: number | null,
  ipAddress: string | undefined
) {
  const normalizedGender = normalizeGenderInput(data.gender);
  if (!normalizedGender) throw new AppError("Укажите корректный пол товара", 400);

  const existing = await repo.findProductById(id);
  if (!existing) throw new AppError("Товар не найден", 404);

  const product = await repo.updateProduct(id, {
    name: data.name,
    type: data.type,
    gender: normalizedGender,
    price: data.price,
    old_price: data.old_price ?? null,
    image_url: data.image_url ?? null,
    season: data.season,
    category_id: data.category_id ?? null,
    is_new: data.is_new ?? false,
    sizes: data.sizes ?? [],
    description: data.description ?? "",
  });

  await logAuditAction({
    adminId,
    action: "update",
    entityType: "product",
    entityId: product.id,
    details: { name: data.name, type: data.type, gender: normalizedGender, price: data.price, category_id: data.category_id ?? null },
    ipAddress,
  });

  if (existing.price !== product.price || existing.old_price !== product.old_price) {
    await logPriceHistory({
      productId: product.id,
      adminId,
      source: "product_update",
      oldPrice: existing.price,
      newPrice: product.price,
      oldOldPrice: existing.old_price,
      newOldPrice: product.old_price,
    });
  }

  await syncProductImages(pool);
  await syncProductVariants(pool, product.id);

  return product;
}

export async function deleteProduct(
  id: number,
  adminId: number | null,
  ipAddress: string | undefined
) {
  const product = await repo.deleteProduct(id);
  if (!product) throw new AppError("Товар не найден", 404);

  await logAuditAction({
    adminId,
    action: "delete",
    entityType: "product",
    entityId: product.id,
    details: { name: product.name },
    ipAddress,
  });

  await syncProductImages(pool);

  return product;
}
