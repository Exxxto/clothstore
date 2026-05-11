import { AppError } from "../lib/AppError";
import { logAuditAction } from "../db";
import * as repo from "../repositories/collectionRepository";

function makeSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

export async function listCollections() {
  return repo.findAllCollections();
}

export async function createCollection(
  data: { name: string; slug?: string | null; description?: string | null; is_active?: boolean; sort_order?: number },
  adminId: number | null,
  ipAddress: string | undefined
) {
  const slug = typeof data.slug === "string" && data.slug.trim() ? data.slug.trim() : makeSlug(data.name);

  try {
    const collection = await repo.createCollection({
      name: data.name,
      slug,
      description: data.description ?? null,
      is_active: data.is_active ?? true,
      sort_order: Number(data.sort_order) || 0,
    });

    await logAuditAction({
      adminId,
      action: "create",
      entityType: "collection",
      entityId: collection.id,
      details: { name: data.name, slug },
      ipAddress,
    });

    return collection;
  } catch (err) {
    if ((err as { code?: string }).code === "23505") {
      throw new AppError("Название или slug уже заняты", 409);
    }
    throw err;
  }
}

export async function updateCollection(
  id: number,
  data: { name: string; slug?: string | null; description?: string | null; is_active?: boolean; sort_order?: number },
  adminId: number | null,
  ipAddress: string | undefined
) {
  const slug = typeof data.slug === "string" && data.slug.trim() ? data.slug.trim() : makeSlug(data.name);

  try {
    const collection = await repo.updateCollection(id, {
      name: data.name,
      slug,
      description: data.description ?? null,
      is_active: data.is_active ?? true,
      sort_order: Number(data.sort_order) || 0,
    });

    if (!collection) throw new AppError("Коллекция не найдена", 404);

    await logAuditAction({
      adminId,
      action: "update",
      entityType: "collection",
      entityId: collection.id,
      details: { name: data.name, slug, is_active: data.is_active ?? true },
      ipAddress,
    });

    return collection;
  } catch (err) {
    if (err instanceof AppError) throw err;
    if ((err as { code?: string }).code === "23505") {
      throw new AppError("Название или slug уже заняты", 409);
    }
    throw err;
  }
}

export async function deleteCollection(
  id: number,
  adminId: number | null,
  ipAddress: string | undefined
) {
  const collection = await repo.deleteCollection(id);
  if (!collection) throw new AppError("Коллекция не найдена", 404);

  await logAuditAction({
    adminId,
    action: "delete",
    entityType: "collection",
    entityId: collection.id,
    details: { name: collection.name, slug: collection.slug },
    ipAddress,
  });

  return collection;
}
