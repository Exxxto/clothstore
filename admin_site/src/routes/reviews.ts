import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { CreateReviewSchema, UpdateReviewStatusSchema } from "../schemas";
import * as controller from "../controllers/reviewController";

// Монтируется на /api/products/:productId/reviews
export const productReviewsRouter = Router({ mergeParams: true });

productReviewsRouter.get("/", controller.getProductReviews);
productReviewsRouter.get("/my", controller.getMyReview);
productReviewsRouter.post("/", validate(CreateReviewSchema), controller.createReview);

// Монтируется на /api/reviews (только для админов)
export const adminReviewsRouter = Router();

adminReviewsRouter.use(requireAuth);
adminReviewsRouter.get("/", controller.getAllReviews);
adminReviewsRouter.put("/:id/status", validate(UpdateReviewStatusSchema), controller.updateReviewStatus);
adminReviewsRouter.delete("/:id", controller.deleteReview);
