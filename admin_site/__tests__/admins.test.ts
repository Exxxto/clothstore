/**
 * admins.test.ts
 * Интеграционные тесты для эндпоинтов управления администраторами:
 *   GET  /api/admins        — требует авторизации
 *   GET  /api/admins/me     — требует авторизации
 *   POST /api/admins        — требует авторизации
 *   PUT  /api/admins/:id    — требует авторизации
 *   PUT  /api/admins/:id/password — требует авторизации
 *   DELETE /api/admins/:id  — требует авторизации
 */
import request from "supertest";
import app from "../app";
import {
  createTestAdmin,
  deleteTestAdmin,
  closePool,
} from "./helpers/testHelpers";

const ADMIN_USERNAME = "jest_admins_main";
const ADMIN_PASSWORD = "AdminsTest123";

let adminToken: string;
let adminId: number;
let createdAdminId: number;

beforeAll(async () => {
  adminId = await createTestAdmin({
    username: ADMIN_USERNAME,
    password: ADMIN_PASSWORD,
    firstName: "Главный",
    lastName: "Тестов",
  });

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD });
  adminToken = loginRes.body.token as string;
});

afterAll(async () => {
  if (createdAdminId) {
    await deleteTestAdmin(`jest_admins_created_${createdAdminId}`);
  }
  await deleteTestAdmin(ADMIN_USERNAME);
  await closePool();
});

// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/admins", () => {
  it("должен вернуть список администраторов при авторизации", async () => {
    const res = await request(app)
      .get("/api/admins")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("должен вернуть 401 без токена", async () => {
    const res = await request(app).get("/api/admins");
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/admins/me", () => {
  it("должен вернуть данные текущего администратора", async () => {
    const res = await request(app)
      .get("/api/admins/me")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("username", ADMIN_USERNAME);
    expect(res.body).not.toHaveProperty("password_hash");
  });

  it("должен вернуть 401 без токена", async () => {
    const res = await request(app).get("/api/admins/me");
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/admins", () => {
  const timestamp = Date.now();

  it("должен создать нового администратора при авторизации", async () => {
    const newAdmin = {
      last_name: "Созданный",
      first_name: "Тест",
      username: `jest_admins_created_${timestamp}`,
      password: "CreatedPass123",
    };

    const res = await request(app)
      .post("/api/admins")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(newAdmin);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.username).toBe(newAdmin.username);
    expect(res.body).not.toHaveProperty("password_hash");
    createdAdminId = res.body.id as number;
  });

  it("должен вернуть 401 без токена", async () => {
    const res = await request(app)
      .post("/api/admins")
      .send({
        last_name: "Тест",
        first_name: "Тест",
        username: `jest_no_token_${timestamp}`,
        password: "TestPass123",
      });

    expect(res.status).toBe(401);
  });

  it("должен вернуть 400/422 при слишком коротком пароле", async () => {
    const res = await request(app)
      .post("/api/admins")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        last_name: "Тест",
        first_name: "Тест",
        username: `jest_short_pass_${timestamp}`,
        password: "123",
      });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it("должен вернуть 400/422 при отсутствии обязательного поля username", async () => {
    const res = await request(app)
      .post("/api/admins")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        last_name: "Тест",
        first_name: "Тест",
        password: "TestPass123",
      });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("PUT /api/admins/:id", () => {
  it("должен обновить данные администратора при авторизации", async () => {
    const res = await request(app)
      .put(`/api/admins/${adminId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        last_name: "Обновлённый",
        first_name: "Главный",
        username: ADMIN_USERNAME,
        is_active: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.last_name).toBe("Обновлённый");
  });

  it("должен вернуть 401 без токена", async () => {
    const res = await request(app)
      .put(`/api/admins/${adminId}`)
      .send({ last_name: "Тест", first_name: "Тест", username: ADMIN_USERNAME });

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("PUT /api/admins/:id/password", () => {
  it("должен изменить пароль администратора", async () => {
    const res = await request(app)
      .put(`/api/admins/${adminId}/password`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ password: "NewAdminPass456" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message");
  });

  it("должен вернуть 400/422 при слишком коротком пароле", async () => {
    const res = await request(app)
      .put(`/api/admins/${adminId}/password`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ password: "123" });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it("должен вернуть 401 без токена", async () => {
    const res = await request(app)
      .put(`/api/admins/${adminId}/password`)
      .send({ password: "NewAdminPass456" });

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("DELETE /api/admins/:id", () => {
  it("должен вернуть 401 без токена", async () => {
    const res = await request(app).delete(`/api/admins/${createdAdminId}`);
    expect(res.status).toBe(401);
  });

  it("должен удалить администратора при авторизации", async () => {
    const res = await request(app)
      .delete(`/api/admins/${createdAdminId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message");
    createdAdminId = 0;
  });
});
