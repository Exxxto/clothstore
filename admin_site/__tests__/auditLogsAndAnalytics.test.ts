/**
 * auditLogsAndAnalytics.test.ts
 * Интеграционные тесты для:
 *   GET /api/audit-logs        — требует авторизации
 *   GET /api/audit-logs/:id    — требует авторизации
 *   GET /api/analytics         — требует авторизации
 */
import request from "supertest";
import app from "../app";
import {
  createTestAdmin,
  deleteTestAdmin,
  closePool,
} from "./helpers/testHelpers";

const ADMIN_USERNAME = "jest_audit_analytics_admin";
const ADMIN_PASSWORD = "AuditTest123";

let adminToken: string;

beforeAll(async () => {
  await createTestAdmin({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD });

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD });
  adminToken = loginRes.body.token as string;
});

afterAll(async () => {
  await deleteTestAdmin(ADMIN_USERNAME);
  await closePool();
});

// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/audit-logs", () => {
  it("должен вернуть список записей аудита при авторизации", async () => {
    const res = await request(app)
      .get("/api/audit-logs")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("должен поддерживать параметр limit", async () => {
    const res = await request(app)
      .get("/api/audit-logs")
      .query({ limit: 5 })
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeLessThanOrEqual(5);
  });

  it("должен вернуть 401 без токена", async () => {
    const res = await request(app).get("/api/audit-logs");
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/audit-logs/:id", () => {
  let firstLogId: number | null = null;

  beforeAll(async () => {
    // Получаем первую запись аудита для тестирования
    const res = await request(app)
      .get("/api/audit-logs")
      .query({ limit: 1 })
      .set("Authorization", `Bearer ${adminToken}`);

    if (res.body.length > 0) {
      firstLogId = res.body[0].id as number;
    }
  });

  it("должен вернуть запись аудита по id (если есть записи)", async () => {
    if (!firstLogId) {
      // Нет записей — пропускаем
      return;
    }

    const res = await request(app)
      .get(`/api/audit-logs/${firstLogId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", firstLogId);
  });

  it("должен вернуть 404 для несуществующего id", async () => {
    const res = await request(app)
      .get("/api/audit-logs/999999999")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("должен вернуть 401 без токена", async () => {
    const res = await request(app).get("/api/audit-logs/1");
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/analytics", () => {
  it("должен вернуть аналитику при авторизации", async () => {
    const res = await request(app)
      .get("/api/analytics")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(typeof res.body).toBe("object");
  });

  it("должен поддерживать фильтрацию по gender", async () => {
    const res = await request(app)
      .get("/api/analytics")
      .query({ gender: "men" })
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  it("должен поддерживать параметр limit", async () => {
    const res = await request(app)
      .get("/api/analytics")
      .query({ limit: 5 })
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  it("должен вернуть 401 без токена", async () => {
    const res = await request(app).get("/api/analytics");
    expect(res.status).toBe(401);
  });
});
