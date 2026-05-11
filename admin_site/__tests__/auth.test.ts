/**
 * auth.test.ts
 * Интеграционные тесты для эндпоинта POST /api/auth/login
 */
import request from "supertest";
import app from "../app";
import {
  createTestAdmin,
  deleteTestAdmin,
  closePool,
} from "./helpers/testHelpers";

const TEST_USERNAME = "jest_auth_admin";
const TEST_PASSWORD = "TestPass123";

beforeAll(async () => {
  await createTestAdmin({
    username: TEST_USERNAME,
    password: TEST_PASSWORD,
    firstName: "Иван",
    lastName: "Тестов",
  });
});

afterAll(async () => {
  await deleteTestAdmin(TEST_USERNAME);
  await closePool();
});

// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/auth/login", () => {
  // ── Успешный логин ──────────────────────────────────────────────────────
  it("должен вернуть JWT-токен при корректных учётных данных", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: TEST_USERNAME, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(typeof res.body.token).toBe("string");
    expect(res.body.token.split(".")).toHaveLength(3); // JWT состоит из трёх частей
    expect(res.body).toHaveProperty("username", TEST_USERNAME);
    expect(res.body).toHaveProperty("role", "admin");
  });

  // ── Неверный пароль ─────────────────────────────────────────────────────
  it("должен вернуть 401 при неверном пароле", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: TEST_USERNAME, password: "WrongPassword" });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toMatch(/неверный логин или пароль/i);
  });

  // ── Несуществующий пользователь ─────────────────────────────────────────
  it("должен вернуть 401 при несуществующем логине", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "nonexistent_user_xyz", password: "AnyPassword" });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error");
  });

  // ── Отсутствие обязательных полей ───────────────────────────────────────
  it("должен вернуть 400 если не передан логин", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ password: TEST_PASSWORD });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("должен вернуть 400 если не передан пароль", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: TEST_USERNAME });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("должен вернуть 400 при пустом теле запроса", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("requireAuth middleware", () => {
  it("должен вернуть 401 при запросе без токена", async () => {
    const res = await request(app).get("/api/admins");

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toMatch(/требуется авторизация/i);
  });

  it("должен вернуть 401 при невалидном токене", async () => {
    const res = await request(app)
      .get("/api/admins")
      .set("Authorization", "Bearer invalid.token.here");

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toMatch(/недействительный|истёкший/i);
  });

  it("должен пропустить запрос с валидным токеном", async () => {
    // Сначала получаем реальный токен
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ username: TEST_USERNAME, password: TEST_PASSWORD });

    const token = loginRes.body.token as string;

    const res = await request(app)
      .get("/api/admins/me")
      .set("Authorization", `Bearer ${token}`);

    // 200 — авторизация прошла успешно
    expect(res.status).toBe(200);
  });
});
