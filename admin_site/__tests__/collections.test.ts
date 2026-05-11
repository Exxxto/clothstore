/**
 * collections.test.ts
 * Интеграционные тесты для эндпоинтов коллекций:
 *   GET    /api/collections      — требует авторизации
 *   POST   /api/collections      — требует авторизации
 *   PUT    /api/collections/:id  — требует авторизации
 *   DELETE /api/collections/:id  — требует авторизации
 */
import request from "supertest";
import app from "../app";
import {
  createTestAdmin,
  deleteTestAdmin,
  closePool,
} from "./helpers/testHelpers";
import { pool } from "../src/db";

const ADMIN_USERNAME = "jest_collections_admin";
const ADMIN_PASSWORD = "CollectionsTest123";

let adminToken: string;
let createdCollectionId: number;

beforeAll(async () => {
  await createTestAdmin({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD });

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD });
  adminToken = loginRes.body.token as string;
});

afterAll(async () => {
  if (createdCollectionId) {
    await pool.query("DELETE FROM collections WHERE id = $1", [createdCollectionId]);
  }
  await deleteTestAdmin(ADMIN_USERNAME);
  await closePool();
});

// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/collections", () => {
  it("должен вернуть список коллекций при авторизации", async () => {
    const res = await request(app)
      .get("/api/collections")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("должен вернуть 401 без токена", async () => {
    const res = await request(app).get("/api/collections");
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/collections", () => {
  const validCollection = {
    name: "Jest Тестовая Коллекция",
    slug: "jest-test-collection",
    description: "Создано в тесте Jest",
    is_active: true,
    sort_order: 0,
  };

  it("должен создать коллекцию при авторизации", async () => {
    const res = await request(app)
      .post("/api/collections")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(validCollection);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.name).toBe(validCollection.name);
    createdCollectionId = res.body.id as number;
  });

  it("должен вернуть 401 без токена", async () => {
    const res = await request(app)
      .post("/api/collections")
      .send(validCollection);

    expect(res.status).toBe(401);
  });

  it("должен вернуть 400/422 при отсутствии обязательного поля name", async () => {
    const res = await request(app)
      .post("/api/collections")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ slug: "no-name", is_active: true });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("PUT /api/collections/:id", () => {
  it("должен обновить коллекцию при авторизации", async () => {
    const res = await request(app)
      .put(`/api/collections/${createdCollectionId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Jest Обновлённая Коллекция",
        slug: "jest-updated-collection",
        description: "Обновлено в тесте Jest",
        is_active: true,
        sort_order: 1,
      });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Jest Обновлённая Коллекция");
  });

  it("должен вернуть 401 без токена", async () => {
    const res = await request(app)
      .put(`/api/collections/${createdCollectionId}`)
      .send({ name: "Без токена", is_active: true });

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("DELETE /api/collections/:id", () => {
  it("должен вернуть 401 без токена", async () => {
    const res = await request(app).delete(`/api/collections/${createdCollectionId}`);
    expect(res.status).toBe(401);
  });

  it("должен удалить коллекцию при авторизации", async () => {
    const res = await request(app)
      .delete(`/api/collections/${createdCollectionId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message");
    createdCollectionId = 0;
  });
});
