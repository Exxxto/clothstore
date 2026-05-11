import bcrypt from "bcryptjs";
import { AppError } from "../lib/AppError";
import * as repo from "../repositories/userRepository";

export async function listUsers() {
  return repo.findAllUsers();
}

export async function getUser(id: number) {
  const user = await repo.findUserById(id);
  if (!user) throw new AppError("Пользователь не найден", 404);
  return user;
}

export async function createUser(data: {
  last_name: string;
  first_name: string;
  middle_name?: string | null;
  email: string;
  password: string;
  phone?: string | null;
}) {
  const hash = await bcrypt.hash(data.password, 10);

  try {
    return await repo.createUser({
      last_name: data.last_name,
      first_name: data.first_name,
      middle_name: data.middle_name ?? null,
      email: data.email,
      password_hash: hash,
      phone: data.phone ?? null,
    });
  } catch (err) {
    if ((err as { code?: string }).code === "23505") {
      throw new AppError("Email уже зарегистрирован", 409);
    }
    throw err;
  }
}

export async function updateUser(
  id: number,
  data: { last_name: string; first_name: string; middle_name?: string | null; email: string; phone?: string | null; is_active?: boolean }
) {
  try {
    const user = await repo.updateUser(id, {
      last_name: data.last_name,
      first_name: data.first_name,
      middle_name: data.middle_name ?? null,
      email: data.email,
      phone: data.phone ?? null,
      is_active: data.is_active ?? true,
    });

    if (!user) throw new AppError("Пользователь не найден", 404);
    return user;
  } catch (err) {
    if (err instanceof AppError) throw err;
    if ((err as { code?: string }).code === "23505") {
      throw new AppError("Email уже занят", 409);
    }
    throw err;
  }
}

export async function changeUserPassword(id: number, password: string) {
  const hash = await bcrypt.hash(password, 10);
  const user = await repo.updateUserPassword(id, hash);
  if (!user) throw new AppError("Пользователь не найден", 404);
  return user;
}

export async function deleteUser(id: number) {
  const user = await repo.deleteUser(id);
  if (!user) throw new AppError("Пользователь не найден", 404);
  return user;
}
