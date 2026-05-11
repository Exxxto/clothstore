/**
 * orders.test.ts
 * Интеграционные тесты для эндпоинтов заказов:
 *   GET  /api/orders              — требует авторизации
 *   GET  /api/orders/:id          — требует авторизации
 *   PUT  /api/orders/:id/status   — требует авторизации
 *   PUT  /api/orders/:id/payment  — требует авторизации
 *   PUT  /api/orders/:id/fulfillment — требует авторизации
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

const ADMIN_USERNAME = "jest_orders_admin";
const ADMIN_PASSWORD = "OrdersTest456";

let adminToken: string;
let testProductId: number;
let testOrderId: number;

beforeAll(async () => {
  await createTestAdmin({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD });

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD });
  adminToken = loginRes.body.token as string;

  testProductId = await createTestProduct({
    name: "Товар для заказа",
    price: 2500,
    gender: "women",
    type: "Платье",
    season: "summer",
  });

  // Создаём тестовый заказ напрямую в БД
  const { rows } = await pool.query(
    `INSERT INTO orders
       (status, payment_status, total_amount,
        customer_name, email, phone,
        delivery_address, delivery_method, payment_method)
     VALUES ('new', 'pending', 2500,
             'Тест Тестов', 'test@jest.com', '+70000000000',
             'Москва, ул. Тестовая', 'courier', 'cash')
     RETURNING id`
  );
  testOrderId = rows[0].id as number;
});

afterAll(async () => {
  if (testOrderId) {
    await pool.query("DELETE FROM order_items WHERE order_id = $1", [testOrderId]);
    await pool.query("DELETE FROM orders WHERE id = $1", [testOrderId]);
  }
  await deleteTestProduct(testProductId);
  await deleteTestAdmin(ADMIN_USERNAME);
  await closePool();
});

// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/orders", () => {
  it("должен вернуть список заказов при авторизации", async () => {
    const res = await request(app)
      .get("/api/orders")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("должен поддерживать фильтрацию по статусу", async () => {
    const res = await request(app)
      .get("/api/orders")
      .query({ status: "new" })
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("должен поддерживать поиск", async () => {
    const res = await request(app)
      .get("/api/orders")
      .query({ search: "Тест" })
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("должен вернуть 401 без токена", async () => {
    const res = await request(app).get("/api/orders");
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/orders/:id", () => {
  it("должен вернуть заказ по id", async () => {
    const res = await request(app)
      .get(`/api/orders/${testOrderId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", testOrderId);
  });

  it("должен вернуть 404 для несуществующего id", async () => {
    const res = await request(app)
      .get("/api/orders/999999999")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("должен вернуть 401 без токена", async () => {
    const res = await request(app).get(`/api/orders/${testOrderId}`);
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("PUT /api/orders/:id/status", () => {
  it("должен обновить статус заказа", async () => {
    const res = await request(app)
      .put(`/api/orders/${testOrderId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "confirmed" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "confirmed");
  });

  it("должен вернуть 400/422 при некорректном статусе", async () => {
    const res = await request(app)
      .put(`/api/orders/${testOrderId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "invalid_status" });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it("должен вернуть 401 без токена", async () => {
    const res = await request(app)
      .put(`/api/orders/${testOrderId}/status`)
      .send({ status: "confirmed" });

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("PUT /api/orders/:id/payment", () => {
  it("должен обновить статус оплаты заказа", async () => {
    const res = await request(app)
      .put(`/api/orders/${testOrderId}/payment`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        payment_status: "paid",
        payment_provider: "Сбербанк",
        payment_reference: "REF-12345",
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("payment_status", "paid");
  });

  it("должен вернуть 400/422 при некорректном статусе оплаты", async () => {
    const res = await request(app)
      .put(`/api/orders/${testOrderId}/payment`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ payment_status: "unknown_status" });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it("должен вернуть 401 без токена", async () => {
    const res = await request(app)
      .put(`/api/orders/${testOrderId}/payment`)
      .send({ payment_status: "paid" });

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("PUT /api/orders/:id/fulfillment", () => {
  it("должен обновить данные доставки заказа", async () => {
    const res = await request(app)
      .put(`/api/orders/${testOrderId}/fulfillment`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        carrier: "СДЭК",
        tracking_number: "TRACK-99999",
        shipped_at: new Date().toISOString(),
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("tracking_number", "TRACK-99999");
  });

  it("должен обновить данные доставки без необязательных полей", async () => {
    const res = await request(app)
      .put(`/api/orders/${testOrderId}/fulfillment`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(200);
  });

  it("должен вернуть 401 без токена", async () => {
    const res = await request(app)
      .put(`/api/orders/${testOrderId}/fulfillment`)
      .send({ carrier: "СДЭК" });

    expect(res.status).toBe(401);
  });
});
