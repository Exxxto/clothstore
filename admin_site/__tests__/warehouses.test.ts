/**
 * warehouses.test.ts
 * Интеграционные тесты для эндпоинтов складов:
 *   GET    /api/warehouses      — требует авторизации
 *   POST   /api/warehouses      — требует авторизации
 *   PUT    /api/warehouses/:id  — требует авторизации
 *   DELETE /api/warehouses/:id  — требует авторизации
 */
import request from "supertest";
import app from "../app";
import {
  createTestAdmin,
  deleteTestAdmin,
  closePool,
} from "./helpers/testHelpers";
import { pool } from "../src/db";

const ADMIN_USERNAME = "jest_warehouses_admin";
const ADMIN_PASSWORD = "WarehousesTest123";

let adminToken: string;
let createdWarehouseId: number;

beforeAll(async () => {
  await createTestAdmin({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD });

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD });
  adminToken = loginRes.body.token as string;
});

afterAll(async () => {
  if (createdWarehouseId) {
    await pool.query("DELETE FROM warehouses WHERE id = $1", [createdWarehouseId]);
  }
  await deleteTestAdmin(ADMIN_USERNAME);
  await closePool();
});

// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/warehouses", () => {
  it("должен вернуть список складов при авторизации", async () => {
    const res = await request(app)
      .get("/api/warehouses")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("должен вернуть 401 без токена", async () => {
    const res = await request(app).get("/api/warehouses");
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/warehouses", () => {
  const validWarehouse = {
    name: "Jest Тестовый Склад",
    code: "JEST-WH-01",
    city: "Москва",
    address: "ул. Тестовая, 1",
    is_active: true,
  };

  it("должен создать склад при авторизации", async () => {
    const res = await request(app)
      .post("/api/warehouses")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(validWarehouse);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.name).toBe(validWarehouse.name);
    createdWarehouseId = res.body.id as number;
  });

  it("должен вернуть 401 без токена", async () => {
    const res = await request(app)
      .post("/api/warehouses")
      .send(validWarehouse);

    expect(res.status).toBe(401);
  });

  it("должен вернуть 400/422 при отсутствии обязательного поля name", async () => {
    const res = await request(app)
      .post("/api/warehouses")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ code: "NO-NAME", city: "Москва" });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("PUT /api/warehouses/:id", () => {
  it("должен обновить склад при авторизации", async () => {
    const res = await request(app)
      .put(`/api/warehouses/${createdWarehouseId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Jest Обновлённый Склад",
        code: "JEST-WH-01-UPD",
        city: "Санкт-Петербург",
        address: "ул. Обновлённая, 2",
        is_active: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Jest Обновлённый Склад");
  });

  it("должен вернуть 401 без токена", async () => {
    const res = await request(app)
      .put(`/api/warehouses/${createdWarehouseId}`)
      .send({ name: "Без токена", is_active: true });

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("DELETE /api/warehouses/:id", () => {
  it("должен вернуть 401 без токена", async () => {
    const res = await request(app).delete(`/api/warehouses/${createdWarehouseId}`);
    expect(res.status).toBe(401);
  });

  it("должен удалить склад при авторизации", async () => {
    const res = await request(app)
      .delete(`/api/warehouses/${createdWarehouseId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message");
    createdWarehouseId = 0;
  });
});
