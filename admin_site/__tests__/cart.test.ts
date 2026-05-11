/**
 * cart.test.ts
 * Интеграционные тесты для эндпоинтов корзины:
 *   GET  /api/store/cart
 *   POST /api/store/cart/items
 *   PUT  /api/store/cart/items/:itemId
 *   DELETE /api/store/cart/items/:itemId
 */
import request from "supertest";
import app from "../app";
import {
  createTestProduct,
  deleteTestProduct,
  clearCart,
  closePool,
} from "./helpers/testHelpers";

const SESSION_ID = `jest-cart-session-${Date.now()}`;
let testProductId: number;

beforeAll(async () => {
  testProductId = await createTestProduct({
    name: "Тестовая футболка",
    price: 1500,
    gender: "men",
    type: "Футболка",
    season: "all",
  });
});

afterAll(async () => {
  await clearCart(SESSION_ID);
  await deleteTestProduct(testProductId);
  await closePool();
});

// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/store/cart", () => {
  it("должен вернуть пустую корзину для нового session_id", async () => {
    const res = await request(app)
      .get("/api/store/cart")
      .query({ session_id: SESSION_ID });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("items");
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items).toHaveLength(0);
    expect(res.body).toHaveProperty("subtotal", 0);
    expect(res.body).toHaveProperty("item_count", 0);
  });

  it("должен вернуть 400 если session_id не передан", async () => {
    const res = await request(app).get("/api/store/cart");

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toMatch(/session_id/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/store/cart/items", () => {
  it("должен добавить товар в корзину", async () => {
    const res = await request(app)
      .post("/api/store/cart/items")
      .send({
        session_id: SESSION_ID,
        product_id: testProductId,
        quantity: 1,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("items");
    expect(res.body.items.length).toBeGreaterThan(0);

    const addedItem = res.body.items.find(
      (i: { product_id: number }) => i.product_id === testProductId
    );
    expect(addedItem).toBeDefined();
    expect(addedItem.quantity).toBe(1);
    expect(addedItem.unit_price).toBe(1500);
  });

  it("должен увеличить количество при повторном добавлении того же товара", async () => {
    const res = await request(app)
      .post("/api/store/cart/items")
      .send({
        session_id: SESSION_ID,
        product_id: testProductId,
        quantity: 2,
      });

    expect(res.status).toBe(201);
    const item = res.body.items.find(
      (i: { product_id: number }) => i.product_id === testProductId
    );
    // Первое добавление: 1, второе: +2 = 3
    expect(item.quantity).toBe(3);
  });

  it("должен вернуть 400 если не передан session_id", async () => {
    const res = await request(app)
      .post("/api/store/cart/items")
      .send({ product_id: testProductId, quantity: 1 });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("должен вернуть 400 если не передан product_id", async () => {
    const res = await request(app)
      .post("/api/store/cart/items")
      .send({ session_id: SESSION_ID, quantity: 1 });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("должен вернуть 404 если товар не существует", async () => {
    const res = await request(app)
      .post("/api/store/cart/items")
      .send({
        session_id: SESSION_ID,
        product_id: 999999999,
        quantity: 1,
      });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toMatch(/товар не найден/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("PUT /api/store/cart/items/:itemId", () => {
  let cartItemId: number;

  beforeAll(async () => {
    // Получаем id позиции в корзине
    const cartRes = await request(app)
      .get("/api/store/cart")
      .query({ session_id: SESSION_ID });

    const item = cartRes.body.items.find(
      (i: { product_id: number }) => i.product_id === testProductId
    );
    cartItemId = item?.id;
  });

  it("должен обновить количество товара в корзине", async () => {
    const res = await request(app)
      .put(`/api/store/cart/items/${cartItemId}`)
      .send({ session_id: SESSION_ID, quantity: 5 });

    expect(res.status).toBe(200);
    const item = res.body.items.find(
      (i: { product_id: number }) => i.product_id === testProductId
    );
    expect(item.quantity).toBe(5);
  });

  it("должен удалить позицию при установке quantity = 0", async () => {
    const res = await request(app)
      .put(`/api/store/cart/items/${cartItemId}`)
      .send({ session_id: SESSION_ID, quantity: 0 });

    expect(res.status).toBe(200);
    const item = res.body.items.find(
      (i: { product_id: number }) => i.product_id === testProductId
    );
    expect(item).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("DELETE /api/store/cart/items/:itemId", () => {
  let cartItemId: number;

  beforeAll(async () => {
    // Добавляем товар заново для теста удаления
    const addRes = await request(app)
      .post("/api/store/cart/items")
      .send({ session_id: SESSION_ID, product_id: testProductId, quantity: 1 });

    const item = addRes.body.items.find(
      (i: { product_id: number }) => i.product_id === testProductId
    );
    cartItemId = item?.id;
  });

  it("должен удалить позицию из корзины", async () => {
    const res = await request(app)
      .delete(`/api/store/cart/items/${cartItemId}`)
      .query({ session_id: SESSION_ID });

    expect(res.status).toBe(200);
    const item = res.body.items.find(
      (i: { product_id: number }) => i.product_id === testProductId
    );
    expect(item).toBeUndefined();
  });

  it("должен вернуть 400 если не передан session_id", async () => {
    const res = await request(app)
      .delete(`/api/store/cart/items/${cartItemId}`);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});
