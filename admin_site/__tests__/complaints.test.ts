/**
 * complaints.test.ts
 * Интеграционные тесты для эндпоинтов жалоб:
 *   POST /api/complaints                  — публичный
 *   GET  /api/complaints                  — требует авторизации
 *   GET  /api/complaints/:id              — требует авторизации
 *   PUT  /api/complaints/:id/status       — требует авторизации
 */
import request from "supertest";
import app from "../app";
import {
  createTestAdmin,
  deleteTestAdmin,
  closePool,
} from "./helpers/testHelpers";
import { pool } from "../src/db";

const ADMIN_USERNAME = "jest_complaints_admin";
const ADMIN_PASSWORD = "ComplaintsTest123";

let adminToken: string;
let createdComplaintId: number;

beforeAll(async () => {
  await createTestAdmin({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD });

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD });
  adminToken = loginRes.body.token as string;
});

afterAll(async () => {
  if (createdComplaintId) {
    await pool.query("DELETE FROM complaints WHERE id = $1", [createdComplaintId]);
  }
  await deleteTestAdmin(ADMIN_USERNAME);
  await closePool();
});

// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/complaints (публичный)", () => {
  const validComplaint = {
    requester_name: "Иван Тестов",
    email: "ivan.test@example.com",
    phone: "+79001234567",
    order_number: "ORD-JEST-001",
    category: "Качество товара",
    message: "Тестовая жалоба из Jest — товар не соответствует описанию",
  };

  it("должен создать жалобу без авторизации", async () => {
    const res = await request(app)
      .post("/api/complaints")
      .send(validComplaint);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.requester_name).toBe(validComplaint.requester_name);
    createdComplaintId = res.body.id as number;
  });

  it("должен вернуть 400/422 при отсутствии обязательного поля requester_name", async () => {
    const { requester_name: _name, ...withoutName } = validComplaint;
    const res = await request(app)
      .post("/api/complaints")
      .send(withoutName);

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it("должен вернуть 400/422 при некорректном email", async () => {
    const res = await request(app)
      .post("/api/complaints")
      .send({ ...validComplaint, email: "not-an-email" });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it("должен вернуть 400/422 при отсутствии обязательного поля message", async () => {
    const { message: _msg, ...withoutMessage } = validComplaint;
    const res = await request(app)
      .post("/api/complaints")
      .send(withoutMessage);

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/complaints", () => {
  it("должен вернуть список жалоб при авторизации", async () => {
    const res = await request(app)
      .get("/api/complaints")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("должен вернуть 401 без токена", async () => {
    const res = await request(app).get("/api/complaints");
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/complaints/:id", () => {
  it("должен вернуть жалобу по id", async () => {
    const res = await request(app)
      .get(`/api/complaints/${createdComplaintId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", createdComplaintId);
    expect(res.body).toHaveProperty("requester_name");
  });

  it("должен вернуть 404 для несуществующего id", async () => {
    const res = await request(app)
      .get("/api/complaints/999999999")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("должен вернуть 401 без токена", async () => {
    const res = await request(app).get(`/api/complaints/${createdComplaintId}`);
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("PUT /api/complaints/:id/status", () => {
  it("должен обновить статус жалобы", async () => {
    const res = await request(app)
      .put(`/api/complaints/${createdComplaintId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "in_review" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "in_review");
  });

  it("должен обновить статус на resolved", async () => {
    const res = await request(app)
      .put(`/api/complaints/${createdComplaintId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "resolved" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "resolved");
  });

  it("должен вернуть 400/422 при некорректном статусе", async () => {
    const res = await request(app)
      .put(`/api/complaints/${createdComplaintId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "invalid_status" });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it("должен вернуть 401 без токена", async () => {
    const res = await request(app)
      .put(`/api/complaints/${createdComplaintId}/status`)
      .send({ status: "resolved" });

    expect(res.status).toBe(401);
  });
});
