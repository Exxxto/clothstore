/**
 * promoCodes.test.ts
 * Интеграционные тесты для промокодов:
 *   — Управление промокодами через Admin API (CRUD)
 *   — Применение промокода к корзине через Store API
 */
import request from "supertest";
import app from "../app";
import {
  createTestAdmin,
  deleteTestAdmin,
  createTestProduct,
  deleteTestProduct,
  createTestPromoCode,
  deleteTestPromoCode,
  clearCart,
  closePool,
} from "./helpers/testHelpers";

const ADMIN_USERNAME = "jest_promo_admin";
const ADMIN_PASSWORD = "PromoTest456";
const SESSION_ID = `jest-promo-session-${Date.now()}`;

let adminToken: string;
let testProductId: number;

beforeAll(async () => {
  await createTestAdmin({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD });

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD });
  adminToken = loginRes.body.token as string;

  testProductId = await createTestProduct({ name: "Промо-товар", price: 2000, gender: "men" });
});

afterAll(async () => {
  await clearCart(SESSION_ID);
  await deleteTestProduct(testProductId);
  await deleteTestAdmin(ADMIN_USERNAME);
  await closePool();
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Admin API — управление промокодами", () => {
  const PROMO_CODE = `JEST_TEST_${Date.now()}`;
  let createdPromoId: number;

  afterAll(async () => {
    await deleteTestPromoCode(PROMO_CODE);
  });

  it("должен создать промокод (POST /api/promo-codes)", async () => {
    const res = await request(app)
      .post("/api/promo-codes")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        code: PROMO_CODE,
        discount_type: "percent",
        discount_value: 15,
        min_order_amount: 0,
        is_active: true,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.code).toBe(PROMO_CODE);
    expect(res.body.discount_type).toBe("percent");
    expect(Number(res.body.discount_value)).toBe(15);
    createdPromoId = res.body.id as number;
  });

  it("должен вернуть список промокодов (GET /api/promo-codes)", async () => {
    const res = await request(app)
      .get("/api/promo-codes")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const found = res.body.find((p: { id: number }) => p.id === createdPromoId);
    expect(found).toBeDefined();
  });

  it("должен обновить промокод (PUT /api/promo-codes/:id)", async () => {
    const res = await request(app)
      .put(`/api/promo-codes/${createdPromoId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        code: PROMO_CODE,
        discount_type: "percent",
        discount_value: 20,
        min_order_amount: 500,
        is_active: true,
      });

    expect(res.status).toBe(200);
    expect(Number(res.body.discount_value)).toBe(20);
    expect(Number(res.body.min_order_amount)).toBe(500);
  });

  it("должен вернуть 401 при создании промокода без токена", async () => {
    const res = await request(app)
      .post("/api/promo-codes")
      .send({
        code: "UNAUTHORIZED_CODE",
        discount_type: "fixed",
        discount_value: 100,
        is_active: true,
      });

    expect(res.status).toBe(401);
  });

  it("должен вернуть 422/400 при невалидных данных (отрицательная скидка)", async () => {
    const res = await request(app)
      .post("/api/promo-codes")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        code: "BAD_CODE",
        discount_type: "percent",
        discount_value: -5, // невалидное значение
        is_active: true,
      });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it("должен удалить промокод (DELETE /api/promo-codes/:id)", async () => {
    const res = await request(app)
      .delete(`/api/promo-codes/${createdPromoId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Store API — применение промокода к корзине", () => {
  const VALID_CODE = `VALID_${Date.now()}`;
  const INACTIVE_CODE = `INACTIVE_${Date.now()}`;
  const EXPIRED_CODE = `EXPIRED_${Date.now()}`;
  const HIGH_MIN_CODE = `HIGHMIN_${Date.now()}`;

  beforeAll(async () => {
    // Создаём набор промокодов для разных сценариев
    await createTestPromoCode({
      code: VALID_CODE,
      discountType: "percent",
      discountValue: 10,
      minOrderAmount: 0,
      isActive: true,
    });
    await createTestPromoCode({
      code: INACTIVE_CODE,
      discountType: "percent",
      discountValue: 10,
      isActive: false,
    });
    await createTestPromoCode({
      code: EXPIRED_CODE,
      discountType: "percent",
      discountValue: 10,
      isActive: true,
      endsAt: "2020-01-01T00:00:00Z", // уже истёк
    });
    await createTestPromoCode({
      code: HIGH_MIN_CODE,
      discountType: "fixed",
      discountValue: 500,
      minOrderAmount: 99999, // очень высокий минимум
      isActive: true,
    });

    // Добавляем товар в корзину
    await request(app)
      .post("/api/store/cart/items")
      .send({ session_id: SESSION_ID, product_id: testProductId, quantity: 1 });
  });

  afterAll(async () => {
    await deleteTestPromoCode(VALID_CODE);
    await deleteTestPromoCode(INACTIVE_CODE);
    await deleteTestPromoCode(EXPIRED_CODE);
    await deleteTestPromoCode(HIGH_MIN_CODE);
  });

  // Эндпоинт валидации промокода: POST /api/store/promo-codes/validate
  // Принимает { code, subtotal } и возвращает информацию о скидке

  it("должен успешно валидировать промокод и вернуть скидку", async () => {
    const res = await request(app)
      .post("/api/store/promo-codes/validate")
      .send({ code: VALID_CODE, subtotal: 2000 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("code", VALID_CODE);
    expect(res.body).toHaveProperty("discount_amount");
    expect(res.body).toHaveProperty("discount_type", "percent");
    // 10% от 2000 = 200
    expect(res.body.discount_amount).toBe(200);
  });

  it("должен вернуть ошибку при применении несуществующего промокода", async () => {
    const res = await request(app)
      .post("/api/store/promo-codes/validate")
      .send({ code: "NONEXISTENT_CODE_XYZ", subtotal: 2000 });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toMatch(/не найден/i);
  });

  it("должен вернуть ошибку при применении неактивного промокода", async () => {
    const res = await request(app)
      .post("/api/store/promo-codes/validate")
      .send({ code: INACTIVE_CODE, subtotal: 2000 });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toMatch(/неактивен/i);
  });

  it("должен вернуть ошибку при применении истёкшего промокода", async () => {
    const res = await request(app)
      .post("/api/store/promo-codes/validate")
      .send({ code: EXPIRED_CODE, subtotal: 2000 });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toMatch(/истёк/i);
  });

  it("должен вернуть ошибку если сумма заказа ниже минимальной", async () => {
    const res = await request(app)
      .post("/api/store/promo-codes/validate")
      .send({ code: HIGH_MIN_CODE, subtotal: 2000 });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toMatch(/минимальная сумма/i);
  });

  it("должен вернуть 400 если не передан код промокода", async () => {
    const res = await request(app)
      .post("/api/store/promo-codes/validate")
      .send({ subtotal: 2000 });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});
