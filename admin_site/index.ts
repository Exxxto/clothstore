import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { initDB } from "./src/db";
import { login } from "./src/middleware/auth";
import { customerLogin, customerRegister, customerMe } from "./src/middleware/customerAuth";
import { swaggerSpec } from "./src/swagger";
import logger from "./src/lib/logger";
import httpLogger from "./src/middleware/httpLogger";
import productsRouter from "./src/routes/products";
import adminsRouter from "./src/routes/admins";
import usersRouter from "./src/routes/users";
import categoriesRouter from "./src/routes/categories";
import ordersRouter from "./src/routes/orders";
import auditLogsRouter from "./src/routes/audit-logs";
import complaintsRouter from "./src/routes/complaints";
import analyticsRouter from "./src/routes/analytics";
import collectionsRouter from "./src/routes/collections";
import warehousesRouter from "./src/routes/warehouses";
import productVariantsRouter from "./src/routes/product-variants";
import inventoryRouter from "./src/routes/inventory";
import storeRouter from "./src/routes/store";
import promoCodesRouter from "./src/routes/promo-codes";
import checkoutMethodsRouter from "./src/routes/checkout-methods";
import uploadRouter from "./src/routes/upload";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const app = express();
const PORT = process.env.PORT || 3001;

// Security headers
app.use(helmet());

app.use(cors({
  origin: ["http://localhost:8080", "http://localhost:5173", "http://localhost:3000"],
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(httpLogger);

// Brute-force protection: max 5 login attempts per IP per minute
const loginRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again in a minute." },
});

// Auth
app.post("/api/auth/login", loginRateLimiter, login);

// Customer auth
app.post("/api/auth/customer/login", customerLogin);
app.post("/api/auth/customer/register", customerRegister);
app.get("/api/auth/customer/me", customerMe);

// Resources
app.use("/api/products", productsRouter);
app.use("/api/admins", adminsRouter);
app.use("/api/users", usersRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/audit-logs", auditLogsRouter);
app.use("/api/complaints", complaintsRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/collections", collectionsRouter);
app.use("/api/warehouses", warehousesRouter);
app.use("/api/product-variants", productVariantsRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/store", storeRouter);
app.use("/api/promo-codes", promoCodesRouter);
app.use("/api/checkout-methods", checkoutMethodsRouter);
app.use("/api/upload", uploadRouter);

// Swagger UI
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api/docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start
initDB()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`🚀 Admin API server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    logger.error("❌ Failed to initialize database", { error: err });
    process.exit(1);
  });
