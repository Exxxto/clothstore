/**
 * users.test.ts
 * Интеграционные тесты для эндпоинтов пользователей:
 *   GET    /api/users              — требует авторизации
 *   GET    /api/users/:id          — требует авторизации
 *   POST   /api/users              — требует авторизации
 *   PUT    /api/users/:id          — требует авторизации
 *   PUT    /api/users/:id/password — требует авторизации
 *   DELETE /api/users/:id          — требует авторизации
 */
import request from "supertest";
import app from "../app";
import {
  createTestAdmin,
  deleteTestAdmin,
  closePool,
} from "./helpers/testHelpers";
import { pool } from "../src/db";

const ADMIN_USERNAME = "jest_users_admin";
const ADMIN_PASSWORD = "UsersTest789";

let adminToken: string;
let createdUserId: number;

beforeAll(async () => {
  await createTestAdmin({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD });

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD });
  adminToken = loginRes.body.token as string;
});

afterAll(async () => {
  if (createdUserId) {
    await pool.query("DELETE FROM users WHERE id = $1", [createdUserId]);
  }
  await deleteTestAdmin(ADMIN_USERNAME);
  await closePool();
});

// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/users", () => {
  it("должен вернуть список пользователей при авторизации", async () => {
    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("должен вернуть 401 без токена", async () => {
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/users", () => {
  const timestamp = Date.now();
  const validUser = {
    last_name: "Тестов",
    first_name: "Тест",
    middle_name: "Тестович",
    email: `jest.user.${timestamp}@test.com`,
    password: "TestPass123",
    phone: "+79001234567",
  };

  it("должен создать пользователя при авторизации", async () => {
    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(validUser);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.email).toBe(validUser.email);
    createdUserId = res.body.id as number;
  });

  it("должен вернуть 401 без токена", async () => {
    const res = await request(app)
      .post("/api/users")
      .send({ ...validUser, email: `no.token.${timestamp}@test.com` });

    expect(res.status).toBe(401);
  });

  it("должен вернуть 400/422 при некорректном email", async () => {
    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ ...validUser, email: "not-an-email" });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it("должен вернуть 400/422 при слишком коротком пароле", async () => {
    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ ...validUser, email: `short.pass.${timestamp}@test.com`, password: "123" });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it("должен вернуть 400/422 при отсутствии обязательного поля email", async () => {
    const { email: _email, ...withoutEmail } = validUser;
    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(withoutEmail);

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/users/:id", () => {
  it("должен вернуть пользователя по id", async () => {
    const res = await request(app)
      .get(`/api/users/${createdUserId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", createdUserId);
  });

  it("должен вернуть 404 для несуществующего id", async () => {
    const res = await request(app)
      .get("/api/users/999999999")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("PUT /api/users/:id", () => {
  it("должен обновить пользователя при авторизации", async () => {
    const res = await request(app)
      .put(`/api/users/${createdUserId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        last_name: "Обновлённый",
        first_name: "Тест",
        email: `jest.user.updated.${Date.now()}@test.com`,
        is_active: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.last_name).toBe("Обновлённый");
  });

  it("должен вернуть 401 без токена", async () => {
    const res = await request(app)
      .put(`/api/users/${createdUserId}`)
      .send({ last_name: "Без токена", first_name: "Тест", email: "test@test.com" });

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("PUT /api/users/:id/password", () => {
  it("должен изменить пароль пользователя", async () => {
    const res = await request(app)
      .put(`/api/users/${createdUserId}/password`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ password: "NewPassword456" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message");
  });

  it("должен вернуть 400/422 при слишком коротком пароле", async () => {
    const res = await request(app)
      .put(`/api/users/${createdUserId}/password`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ password: "123" });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it("должен вернуть 401 без токена", async () => {
    const res = await request(app)
      .put(`/api/users/${createdUserId}/password`)
      .send({ password: "NewPassword456" });

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("DELETE /api/users/:id", () => {
  it("должен вернуть 401 без токена", async () => {
    const res = await request(app).delete(`/api/users/${createdUserId}`);
    expect(res.status).toBe(401);
  });

  it("должен удалить пользователя при авторизации", async () => {
    const res = await request(app)
      .delete(`/api/users/${createdUserId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message");
    createdUserId = 0;
  });
});
