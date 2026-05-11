/**
 * categories.test.ts
 * Интеграционные тесты для эндпоинтов категорий:
 *   GET    /api/categories        — требует авторизации
 *   GET    /api/categories/:id    — требует авторизации
 *   POST   /api/categories        — требует авторизации
 *   PUT    /api/categories/:id    — требует авторизации
 *   DELETE /api/categories/:id    — требует авторизации
 */
import request from "supertest";
import app from "../app";
import {
  createTestAdmin,
  deleteTestAdmin,
  closePool,
} from "./helpers/testHelpers";
import { pool } from "../src/db";

const ADMIN_USERNAME = "jest_categories_admin";
const ADMIN_PASSWORD = "CategoriesTest123";

let adminToken: string;
let createdCategoryId: number;

beforeAll(async () => {
  await createTestAdmin({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD });

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD });
  adminToken = loginRes.body.token as string;
});

afterAll(async () => {
  if (createdCategoryId) {
    await pool.query("DELETE FROM categories WHERE id = $1", [createdCategoryId]);
  }
  await deleteTestAdmin(ADMIN_USERNAME);
  await closePool();
});

// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/categories", () => {
  it("должен вернуть список категорий при авторизации", async () => {
    const res = await request(app)
      .get("/api/categories")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("должен вернуть 401 без токена", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/categories", () => {
  const validCategory = {
    name: "Jest Тестовая Категория",
    slug: "jest-test-category",
    description: "Создано в тесте Jest",
    is_active: true,
  };

  it("должен создать категорию при авторизации", async () => {
    const res = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(validCategory);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.name).toBe(validCategory.name);
    createdCategoryId = res.body.id as number;
  });

  it("должен вернуть 401 без токена", async () => {
    const res = await request(app)
      .post("/api/categories")
      .send(validCategory);

    expect(res.status).toBe(401);
  });

  it("должен вернуть 400/422 при отсутствии обязательного поля name", async () => {
    const res = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ slug: "no-name", is_active: true });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/categories/:id", () => {
  it("должен вернуть категорию по id", async () => {
    const res = await request(app)
      .get(`/api/categories/${createdCategoryId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", createdCategoryId);
    expect(res.body).toHaveProperty("name");
  });

  it("должен вернуть 404 для несуществующего id", async () => {
    const res = await request(app)
      .get("/api/categories/999999999")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("PUT /api/categories/:id", () => {
  it("должен обновить категорию при авторизации", async () => {
    const res = await request(app)
      .put(`/api/categories/${createdCategoryId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Jest Обновлённая Категория",
        slug: "jest-updated-category",
        description: "Обновлено в тесте Jest",
        is_active: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Jest Обновлённая Категория");
  });

  it("должен вернуть 401 без токена", async () => {
    const res = await request(app)
      .put(`/api/categories/${createdCategoryId}`)
      .send({ name: "Без токена", is_active: true });

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("DELETE /api/categories/:id", () => {
  it("должен вернуть 401 без токена", async () => {
    const res = await request(app).delete(`/api/categories/${createdCategoryId}`);
    expect(res.status).toBe(401);
  });

  it("должен удалить категорию при авторизации", async () => {
    const res = await request(app)
      .delete(`/api/categories/${createdCategoryId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message");
    createdCategoryId = 0;
  });
});
