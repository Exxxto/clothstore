import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { PromoCodeSchema } from "../schemas";
import * as controller from "../controllers/promoCodeController";

const router = Router();

router.use(requireAuth);

router.get("/", controller.getAll);
router.post("/", validate(PromoCodeSchema), controller.create);
router.put("/:id", validate(PromoCodeSchema), controller.update);
router.delete("/:id", controller.remove);

export default router;
