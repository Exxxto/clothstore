import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { initDB } from "./src/db";
import { login } from "./src/middleware/auth";
import { swaggerSpec } from "./src/swagger";
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

app.use(cors({
  origin: ["http://localhost:8080", "http://localhost:5173", "http://localhost:3000"],
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Auth
app.post("/api/auth/login", login);

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
      console.log(`🚀 Admin API server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to initialize database:", err);
    process.exit(1);
  });
