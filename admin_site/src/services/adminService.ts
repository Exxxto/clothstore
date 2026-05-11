import bcrypt from "bcryptjs";
import { AppError } from "../lib/AppError";
import * as repo from "../repositories/adminRepository";

export async function listAdmins() {
  return repo.findAllAdmins();
}

export async function getAdmin(id: number) {
  const admin = await repo.findAdminById(id);
  if (!admin) throw new AppError("Админ не найден", 404);
  return admin;
}

export async function createAdmin(data: {
  last_name: string;
  first_name: string;
  middle_name?: string | null;
  username: string;
  password: string;
}) {
  const hash = await bcrypt.hash(data.password, 10);

  try {
    return await repo.createAdmin({
      last_name: data.last_name,
      first_name: data.first_name,
      middle_name: data.middle_name ?? null,
      username: data.username,
      password_hash: hash,
    });
  } catch (err) {
    if ((err as { code?: string }).code === "23505") {
      throw new AppError("Логин уже занят", 409);
    }
    throw err;
  }
}

export async function updateAdmin(
  id: number,
  data: { last_name: string; first_name: string; middle_name?: string | null; username: string; is_active?: boolean }
) {
  try {
    const admin = await repo.updateAdmin(id, {
      last_name: data.last_name,
      first_name: data.first_name,
      middle_name: data.middle_name ?? null,
      username: data.username,
      is_active: data.is_active ?? true,
    });

    if (!admin) throw new AppError("Админ не найден", 404);
    return admin;
  } catch (err) {
    if (err instanceof AppError) throw err;
    if ((err as { code?: string }).code === "23505") {
      throw new AppError("Логин уже занят", 409);
    }
    throw err;
  }
}

export async function changeAdminPassword(id: number, password: string) {
  const hash = await bcrypt.hash(password, 10);
  const admin = await repo.updateAdminPassword(id, hash);
  if (!admin) throw new AppError("Админ не найден", 404);
  return admin;
}

export async function deleteAdmin(id: number, currentAdminId: number) {
  if (id === currentAdminId) {
    throw new AppError("Нельзя удалить самого себя", 400);
  }

  const admin = await repo.deleteAdmin(id);
  if (!admin) throw new AppError("Админ не найден", 404);
  return admin;
}
