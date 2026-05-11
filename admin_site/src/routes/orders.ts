import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { UpdateOrderStatusSchema, UpdateOrderPaymentSchema, UpdateOrderFulfillmentSchema } from "../schemas";
import * as controller from "../controllers/orderController";

const router = Router();

router.use(requireAuth);

router.get("/", controller.getAll);
router.get("/:id", controller.getOne);
router.put("/:id/status", validate(UpdateOrderStatusSchema), controller.updateStatus);
router.put("/:id/payment", validate(UpdateOrderPaymentSchema), controller.updatePayment);
router.put("/:id/fulfillment", validate(UpdateOrderFulfillmentSchema), controller.updateFulfillment);

export default router;
