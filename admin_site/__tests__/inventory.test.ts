/**
 * inventory.test.ts
 * Интеграционные тесты для эндпоинтов инвентаря:
 *   GET  /api/inventory             — требует авторизации
 *   GET  /api/inventory/movements   — требует авторизации
 *   POST /api/inventory/movements   — требует авторизации
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

const ADMIN_USERNAME = "jest_inventory_admin";
const ADMIN_PASSWORD = "InventoryTest123";

let adminToken: string;
let testProductId: number;
let testVariantId: number;
let testWarehouseId: number;

beforeAll(async () => {
  await createTestAdmin({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD });

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD });
  adminToken = loginRes.body.token as string;

  testProductId = await createTestProduct({
    name: "Товар для инвентаря",
    price: 1200,
    gender: "men",
    type: "Брюки",
    season: "all",
  });

  // Создаём вариант товара
  const variantRes = await pool.query(
    `INSERT INTO product_variants (product_id, sku, variant_name, price, stock_tracking, is_active, attributes)
     VALUES ($1, $2, $3, 1200, TRUE, TRUE, '{}')
     RETURNING id`,
    [testProductId, `JEST-INV-SKU-${Date.now()}`, "Jest Инвентарный Вариант"]
  );
  testVariantId = variantRes.rows[0].id as number;

  // Создаём тестовый склад
  const warehouseRes = await pool.query(
    `INSERT INTO warehouses (name, code, is_active)
     VALUES ('Jest Инвентарный Склад', $1, TRUE)
     RETURNING id`,
    [`JEST-INV-${Date.now()}`]
  );
  testWarehouseId = warehouseRes.rows[0].id as number;

  // Инициализируем остатки для нового склада
  await pool.query(
    `INSERT INTO stock_balances (warehouse_id, product_variant_id, quantity_on_hand, quantity_reserved, reorder_point)
     VALUES ($1, $2, 0, 0, 0)
     ON CONFLICT DO NOTHING`,
    [testWarehouseId, testVariantId]
  );
});

afterAll(async () => {
  await pool.query("DELETE FROM stock_movements WHERE warehouse_id = $1", [testWarehouseId]);
  await pool.query("DELETE FROM stock_balances WHERE warehouse_id = $1", [testWarehouseId]);
  await pool.query("DELETE FROM warehouses WHERE id = $1", [testWarehouseId]);
  await pool.query("DELETE FROM product_variants WHERE id = $1", [testVariantId]);
  await deleteTestProduct(testProductId);
  await deleteTestAdmin(ADMIN_USERNAME);
  await closePool();
});

// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/inventory", () => {
  it("должен вернуть остатки при авторизации", async () => {
    const res = await request(app)
      .get("/api/inventory")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("должен поддерживать фильтрацию по warehouse_id", async () => {
    const res = await request(app)
      .get("/api/inventory")
      .query({ warehouse_id: testWarehouseId })
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("должен поддерживать фильтрацию low_stock", async () => {
    const res = await request(app)
      .get("/api/inventory")
      .query({ low_stock: "true" })
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("должен вернуть 401 без токена", async () => {
    const res = await request(app).get("/api/inventory");
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/inventory/movements", () => {
  it("должен вернуть список движений при авторизации", async () => {
    const res = await request(app)
      .get("/api/inventory/movements")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("должен поддерживать параметр limit", async () => {
    const res = await request(app)
      .get("/api/inventory/movements")
      .query({ limit: 10 })
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeLessThanOrEqual(10);
  });

  it("должен вернуть 401 без токена", async () => {
    const res = await request(app).get("/api/inventory/movements");
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/inventory/movements", () => {
  it("должен создать движение (поступление) при авторизации", async () => {
    const res = await request(app)
      .post("/api/inventory/movements")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        warehouse_id: testWarehouseId,
        product_variant_id: testVariantId,
        quantity_delta: 10,
        movement_type: "receipt",
        reason: "Тестовое поступление Jest",
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("quantity_on_hand");
  });

  it("должен создать движение (корректировка) при авторизации", async () => {
    const res = await request(app)
      .post("/api/inventory/movements")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        warehouse_id: testWarehouseId,
        product_variant_id: testVariantId,
        quantity_delta: -3,
        movement_type: "adjustment",
        reason: "Тестовая корректировка Jest",
      });

    expect(res.status).toBe(201);
  });

  it("должен вернуть 400 при попытке списать больше чем есть", async () => {
    const res = await request(app)
      .post("/api/inventory/movements")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        warehouse_id: testWarehouseId,
        product_variant_id: testVariantId,
        quantity_delta: -99999,
        movement_type: "sale",
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("должен вернуть 400/422 при некорректном movement_type", async () => {
    const res = await request(app)
      .post("/api/inventory/movements")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        warehouse_id: testWarehouseId,
        product_variant_id: testVariantId,
        quantity_delta: 5,
        movement_type: "invalid_type",
      });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it("должен вернуть 400/422 при quantity_delta = 0", async () => {
    const res = await request(app)
      .post("/api/inventory/movements")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        warehouse_id: testWarehouseId,
        product_variant_id: testVariantId,
        quantity_delta: 0,
        movement_type: "receipt",
      });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it("должен вернуть 401 без токена", async () => {
    const res = await request(app)
      .post("/api/inventory/movements")
      .send({
        warehouse_id: testWarehouseId,
        product_variant_id: testVariantId,
        quantity_delta: 5,
        movement_type: "receipt",
      });

    expect(res.status).toBe(401);
  });
});
