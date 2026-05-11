import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { ShippingMethodSchema, PaymentMethodSchema } from "../schemas";
import * as controller from "../controllers/checkoutMethodController";

const router = Router();

router.use(requireAuth);

router.get("/", controller.getAll);

router.post("/shipping", validate(ShippingMethodSchema), controller.createShipping);
router.put("/shipping/:id", validate(ShippingMethodSchema), controller.updateShipping);
router.delete("/shipping/:id", controller.deleteShipping);

router.post("/payment", validate(PaymentMethodSchema), controller.createPayment);
router.put("/payment/:id", validate(PaymentMethodSchema), controller.updatePayment);
router.delete("/payment/:id", controller.deletePayment);

export default router;
