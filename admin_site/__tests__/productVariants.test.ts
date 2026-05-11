/**
 * productVariants.test.ts
 * Интеграционные тесты для эндпоинтов вариантов товаров:
 *   GET    /api/product-variants        — требует авторизации
 *   GET    /api/product-variants/:id    — требует авторизации
 *   POST   /api/product-variants        — требует авторизации
 *   PUT    /api/product-variants/:id    — требует авторизации
 *   DELETE /api/product-variants/:id    — требует авторизации (деактивация)
 */
import request from "supertest";
import app from "../app";
import {
  createTestAdmin,
  deleteTestAdmin,
  createTestProduct,
  deleteTestProduct,
  closePool,
} from "./helpers/testHelpers";
import { pool } from "../src/db";

const ADMIN_USERNAME = "jest_variants_admin";
const ADMIN_PASSWORD = "VariantsTest123";

let adminToken: string;
let testProductId: number;
let createdVariantId: number;

beforeAll(async () => {
  await createTestAdmin({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD });

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD });
  adminToken = loginRes.body.token as string;

  testProductId = await createTestProduct({
    name: "Товар для вариантов",
    price: 1800,
    gender: "unisex",
    type: "Футболка",
    season: "all",
  });
});

afterAll(async () => {
  if (createdVariantId) {
    await pool.query("DELETE FROM product_variants WHERE id = $1", [createdVariantId]);
  }
  await deleteTestProduct(testProductId);
  await deleteTestAdmin(ADMIN_USERNAME);
  await closePool();
});

// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/product-variants", () => {
  it("должен вернуть список вариантов при авторизации", async () => {
    const res = await request(app)
      .get("/api/product-variants")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("должен поддерживать фильтрацию по product_id", async () => {
    const res = await request(app)
      .get("/api/product-variants")
      .query({ product_id: testProductId })
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("должен вернуть 401 без токена", async () => {
    const res = await request(app).get("/api/product-variants");
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/product-variants", () => {
  const validVariant = {
    product_id: 0, // будет заменён в тесте
    variant_name: "Красный M",
    size: "M",
    color: "Красный",
    sku: `JEST-SKU-${Date.now()}`,
    price: 1800,
    stock_tracking: true,
    is_active: true,
    attributes: {},
  };

  it("должен создать вариант товара при авторизации", async () => {
    const res = await request(app)
      .post("/api/product-variants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ ...validVariant, product_id: testProductId });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.product_id).toBe(testProductId);
    createdVariantId = res.body.id as number;
  });

  it("должен вернуть 401 без токена", async () => {
    const res = await request(app)
      .post("/api/product-variants")
      .send({ ...validVariant, product_id: testProductId });

    expect(res.status).toBe(401);
  });

  it("должен вернуть 400/422 при отсутствии обязательного поля product_id", async () => {
    const { product_id: _pid, ...withoutProductId } = validVariant;
    const res = await request(app)
      .post("/api/product-variants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(withoutProductId);

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it("должен вернуть 400/422 при отрицательной цене", async () => {
    const res = await request(app)
      .post("/api/product-variants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ ...validVariant, product_id: testProductId, price: -100 });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/product-variants/:id", () => {
  it("должен вернуть вариант по id", async () => {
    const res = await request(app)
      .get(`/api/product-variants/${createdVariantId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", createdVariantId);
  });

  it("должен вернуть 404 для несуществующего id", async () => {
    const res = await request(app)
      .get("/api/product-variants/999999999")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("должен вернуть 401 без токена", async () => {
    const res = await request(app).get(`/api/product-variants/${createdVariantId}`);
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("PUT /api/product-variants/:id", () => {
  it("должен обновить вариант товара при авторизации", async () => {
    const res = await request(app)
      .put(`/api/product-variants/${createdVariantId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        variant_name: "Синий L",
        size: "L",
        color: "Синий",
        price: 2000,
        stock_tracking: true,
        is_active: true,
        attributes: {},
      });

    expect(res.status).toBe(200);
    expect(res.body.color).toBe("Синий");
    expect(Number(res.body.price)).toBe(2000);
  });

  it("должен вернуть 401 без токена", async () => {
    const res = await request(app)
      .put(`/api/product-variants/${createdVariantId}`)
      .send({ price: 1000, stock_tracking: true, is_active: true, attributes: {} });

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("DELETE /api/product-variants/:id (деактивация)", () => {
  it("должен вернуть 401 без токена", async () => {
    const res = await request(app).delete(`/api/product-variants/${createdVariantId}`);
    expect(res.status).toBe(401);
  });

  it("должен деактивировать вариант при авторизации", async () => {
    const res = await request(app)
      .delete(`/api/product-variants/${createdVariantId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message");
    createdVariantId = 0;
  });
});
