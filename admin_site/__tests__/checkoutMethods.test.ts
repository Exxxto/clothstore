/**
 * checkoutMethods.test.ts
 * Интеграционные тесты для эндпоинтов методов доставки и оплаты:
 *   GET    /api/checkout-methods                  — требует авторизации
 *   POST   /api/checkout-methods/shipping         — требует авторизации
 *   PUT    /api/checkout-methods/shipping/:id     — требует авторизации
 *   DELETE /api/checkout-methods/shipping/:id     — требует авторизации
 *   POST   /api/checkout-methods/payment          — требует авторизации
 *   PUT    /api/checkout-methods/payment/:id      — требует авторизации
 *   DELETE /api/checkout-methods/payment/:id      — требует авторизации
 */
import request from "supertest";
import app from "../app";
import {
  createTestAdmin,
  deleteTestAdmin,
  closePool,
} from "./helpers/testHelpers";
import { pool } from "../src/db";

const ADMIN_USERNAME = "jest_checkout_admin";
const ADMIN_PASSWORD = "CheckoutTest123";

let adminToken: string;
let createdShippingId: number;
let createdPaymentId: number;

beforeAll(async () => {
  await createTestAdmin({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD });

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD });
  adminToken = loginRes.body.token as string;
});

afterAll(async () => {
  if (createdShippingId) {
    await pool.query("DELETE FROM shipping_methods WHERE id = $1", [createdShippingId]);
  }
  if (createdPaymentId) {
    await pool.query("DELETE FROM payment_methods WHERE id = $1", [createdPaymentId]);
  }
  await deleteTestAdmin(ADMIN_USERNAME);
  await closePool();
});

// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/checkout-methods", () => {
  it("должен вернуть список методов при авторизации", async () => {
    const res = await request(app)
      .get("/api/checkout-methods")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("shipping_methods");
    expect(res.body).toHaveProperty("payment_methods");
    expect(Array.isArray(res.body.shipping_methods)).toBe(true);
    expect(Array.isArray(res.body.payment_methods)).toBe(true);
  });

  it("должен вернуть 401 без токена", async () => {
    const res = await request(app).get("/api/checkout-methods");
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/checkout-methods/shipping", () => {
  const timestamp = Date.now();
  const validShipping = {
    code: `JEST_SHIP_${timestamp}`,
    name: "Jest Тестовая Доставка",
    description: "Создано в тесте Jest",
    price: 300,
    sort_order: 99,
    is_active: true,
  };

  it("должен создать метод доставки при авторизации", async () => {
    const res = await request(app)
      .post("/api/checkout-methods/shipping")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(validShipping);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.name).toBe(validShipping.name);
    createdShippingId = res.body.id as number;
  });

  it("должен вернуть 401 без токена", async () => {
    const res = await request(app)
      .post("/api/checkout-methods/shipping")
      .send(validShipping);

    expect(res.status).toBe(401);
  });

  it("должен вернуть 400/422 при отсутствии обязательного поля name", async () => {
    const res = await request(app)
      .post("/api/checkout-methods/shipping")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ code: "NO-NAME", price: 100 });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("PUT /api/checkout-methods/shipping/:id", () => {
  it("должен обновить метод доставки при авторизации", async () => {
    const res = await request(app)
      .put(`/api/checkout-methods/shipping/${createdShippingId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        code: `JEST_SHIP_UPD_${Date.now()}`,
        name: "Jest Обновлённая Доставка",
        price: 500,
        sort_order: 98,
        is_active: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Jest Обновлённая Доставка");
  });

  it("должен вернуть 401 без токена", async () => {
    const res = await request(app)
      .put(`/api/checkout-methods/shipping/${createdShippingId}`)
      .send({ code: "X", name: "Без токена", price: 0 });

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("DELETE /api/checkout-methods/shipping/:id", () => {
  it("должен вернуть 401 без токена", async () => {
    const res = await request(app).delete(`/api/checkout-methods/shipping/${createdShippingId}`);
    expect(res.status).toBe(401);
  });

  it("должен удалить метод доставки при авторизации", async () => {
    const res = await request(app)
      .delete(`/api/checkout-methods/shipping/${createdShippingId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message");
    createdShippingId = 0;
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/checkout-methods/payment", () => {
  const timestamp = Date.now();
  const validPayment = {
    code: `JEST_PAY_${timestamp}`,
    name: "Jest Тестовая Оплата",
    description: "Создано в тесте Jest",
    requires_card: false,
    sort_order: 99,
    is_active: true,
  };

  it("должен создать метод оплаты при авторизации", async () => {
    const res = await request(app)
      .post("/api/checkout-methods/payment")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(validPayment);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.name).toBe(validPayment.name);
    createdPaymentId = res.body.id as number;
  });

  it("должен вернуть 401 без токена", async () => {
    const res = await request(app)
      .post("/api/checkout-methods/payment")
      .send(validPayment);

    expect(res.status).toBe(401);
  });

  it("должен вернуть 400/422 при отсутствии обязательного поля name", async () => {
    const res = await request(app)
      .post("/api/checkout-methods/payment")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ code: "NO-NAME" });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("PUT /api/checkout-methods/payment/:id", () => {
  it("должен обновить метод оплаты при авторизации", async () => {
    const res = await request(app)
      .put(`/api/checkout-methods/payment/${createdPaymentId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        code: `JEST_PAY_UPD_${Date.now()}`,
        name: "Jest Обновлённая Оплата",
        requires_card: true,
        sort_order: 98,
        is_active: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Jest Обновлённая Оплата");
  });

  it("должен вернуть 401 без токена", async () => {
    const res = await request(app)
      .put(`/api/checkout-methods/payment/${createdPaymentId}`)
      .send({ code: "X", name: "Без токена" });

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("DELETE /api/checkout-methods/payment/:id", () => {
  it("должен вернуть 401 без токена", async () => {
    const res = await request(app).delete(`/api/checkout-methods/payment/${createdPaymentId}`);
    expect(res.status).toBe(401);
  });

  it("должен удалить метод оплаты при авторизации", async () => {
    const res = await request(app)
      .delete(`/api/checkout-methods/payment/${createdPaymentId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message");
    createdPaymentId = 0;
  });
});
