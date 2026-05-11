import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { ProductSchema } from "../schemas";
import * as controller from "../controllers/productController";
import { productReviewsRouter } from "./reviews";

const router = Router();

// GET и GET /:id — публичные (без requireAuth)
router.get("/", controller.getAll);
router.get("/:id", controller.getOne);

// Отзывы к товару
router.use("/:productId/reviews", productReviewsRouter);

// Мутации — только для авторизованных
router.post("/", requireAuth, validate(ProductSchema), controller.create);
router.put("/:id", requireAuth, validate(ProductSchema), controller.update);
router.delete("/:id", requireAuth, controller.remove);

export default router;
