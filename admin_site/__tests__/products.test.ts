/**
 * products.test.ts
 * Интеграционные тесты для эндпоинтов товаров:
 *   GET    /api/products        — публичный
 *   GET    /api/products/:id    — публичный
 *   POST   /api/products        — требует авторизации
 *   PUT    /api/products/:id    — требует авторизации
 *   DELETE /api/products/:id    — требует авторизации
 */
import request from "supertest";
import app from "../app";
import {
  createTestAdmin,
  deleteTestAdmin,
  deleteTestProduct,
  closePool,
} from "./helpers/testHelpers";

const ADMIN_USERNAME = "jest_products_admin";
const ADMIN_PASSWORD = "ProductsTest789";

let adminToken: string;
let createdProductId: number;

beforeAll(async () => {
  await createTestAdmin({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD });

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD });
  adminToken = loginRes.body.token as string;
});

afterAll(async () => {
  if (createdProductId) {
    await deleteTestProduct(createdProductId);
  }
  await deleteTestAdmin(ADMIN_USERNAME);
  await closePool();
});

// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/products", () => {
  it("должен вернуть список товаров без авторизации", async () => {
    const res = await request(app).get("/api/products");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("должен поддерживать пагинацию через query-параметры", async () => {
    const res = await request(app)
      .get("/api/products")
      .query({ limit: 5, offset: 0 });

    expect(res.status).toBe(200);
    // Ответ может быть массивом или объектом с полем items/data
    const items = Array.isArray(res.body) ? res.body : res.body.items ?? res.body.data ?? [];
    expect(Array.isArray(items)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/products", () => {
  const validProduct = {
    name: "Jest Тестовая Куртка",
    type: "Куртка",
    gender: "men",
    price: 3500,
    season: "autumn",
    is_new: false,
    sizes: ["S", "M", "L"],
    description: "Создано в тесте Jest",
  };

  it("должен создать товар при наличии авторизации", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(validProduct);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.name).toBe(validProduct.name);
    expect(Number(res.body.price)).toBe(validProduct.price);
    createdProductId = res.body.id as number;
  });

  it("должен вернуть 401 при создании товара без токена", async () => {
    const res = await request(app)
      .post("/api/products")
      .send(validProduct);

    expect(res.status).toBe(401);
  });

  it("должен вернуть 422/400 при отсутствии обязательного поля name", async () => {
    const { name: _name, ...withoutName } = validProduct;
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(withoutName);

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it("должен вернуть 422/400 при отрицательной цене", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ ...validProduct, price: -100 });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it("должен вернуть 422/400 при некорректном значении season", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ ...validProduct, season: "monsoon" }); // не входит в enum

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/products/:id", () => {
  it("должен вернуть товар по id", async () => {
    // Используем id созданного в предыдущем блоке товара
    const res = await request(app).get(`/api/products/${createdProductId}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", createdProductId);
    expect(res.body).toHaveProperty("name");
  });

  it("должен вернуть 404 для несуществующего id", async () => {
    const res = await request(app).get("/api/products/999999999");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("PUT /api/products/:id", () => {
  it("должен обновить товар при наличии авторизации", async () => {
    const res = await request(app)
      .put(`/api/products/${createdProductId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Jest Обновлённая Куртка",
        type: "Куртка",
        gender: "men",
        price: 4000,
        season: "winter",
        is_new: true,
        sizes: ["M", "L", "XL"],
        description: "Обновлено в тесте Jest",
      });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Jest Обновлённая Куртка");
    expect(Number(res.body.price)).toBe(4000);
  });

  it("должен вернуть 401 при обновлении без токена", async () => {
    const res = await request(app)
      .put(`/api/products/${createdProductId}`)
      .send({ name: "Без токена", type: "Куртка", gender: "men", price: 100, season: "all" });

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("DELETE /api/products/:id", () => {
  it("должен вернуть 401 при удалении без токена", async () => {
    const res = await request(app).delete(`/api/products/${createdProductId}`);

    expect(res.status).toBe(401);
  });

  it("должен удалить товар при наличии авторизации", async () => {
    const res = await request(app)
      .delete(`/api/products/${createdProductId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    createdProductId = 0; // помечаем как удалённый, чтобы afterAll не пытался удалить снова
  });
});
