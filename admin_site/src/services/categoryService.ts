import { AppError } from "../lib/AppError";
import { logAuditAction } from "../db";
import * as repo from "../repositories/categoryRepository";

/** Генерирует slug из произвольной строки */
function makeSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

export async function listCategories() {
  return repo.findAllCategories();
}

export async function getCategory(id: number) {
  const category = await repo.findCategoryById(id);
  if (!category) throw new AppError("Категория не найдена", 404);
  return category;
}

export async function createCategory(
  data: { name: string; slug?: string | null; description?: string | null; is_active?: boolean },
  adminId: number | null,
  ipAddress: string | undefined
) {
  const slug = (data.slug || makeSlug(data.name)).toString();

  try {
    const category = await repo.createCategory({
      name: data.name,
      slug,
      description: data.description ?? null,
      is_active: data.is_active ?? true,
    });

    await logAuditAction({
      adminId,
      action: "create",
      entityType: "category",
      entityId: category.id,
      details: { name: data.name, slug },
      ipAddress,
    });

    return category;
  } catch (err) {
    if ((err as { code?: string }).code === "23505") {
      throw new AppError("Название или slug уже заняты", 409);
    }
    throw err;
  }
}

export async function updateCategory(
  id: number,
  data: { name: string; slug?: string | null; description?: string | null; is_active?: boolean },
  adminId: number | null,
  ipAddress: string | undefined
) {
  const slug = (data.slug || makeSlug(data.name)).toString();

  try {
    const category = await repo.updateCategory(id, {
      name: data.name,
      slug,
      description: data.description ?? null,
      is_active: data.is_active ?? true,
    });

    if (!category) throw new AppError("Категория не найдена", 404);

    await logAuditAction({
      adminId,
      action: "update",
      entityType: "category",
      entityId: category.id,
      details: { name: data.name, slug, is_active: data.is_active ?? true },
      ipAddress,
    });

    return category;
  } catch (err) {
    if (err instanceof AppError) throw err;
    if ((err as { code?: string }).code === "23505") {
      throw new AppError("Название или slug уже заняты", 409);
    }
    throw err;
  }
}

export async function deleteCategory(
  id: number,
  adminId: number | null,
  ipAddress: string | undefined
) {
  const category = await repo.deleteCategory(id);
  if (!category) throw new AppError("Категория не найдена", 404);

  await logAuditAction({
    adminId,
    action: "delete",
    entityType: "category",
    entityId: category.id,
    details: { name: category.name, slug: category.slug },
    ipAddress,
  });

  return category;
}
