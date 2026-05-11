import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { CreateProductVariantSchema, UpdateProductVariantSchema } from "../schemas";
import * as controller from "../controllers/productVariantController";

const router = Router();

router.use(requireAuth);

router.get("/", controller.getAll);
router.get("/:id", controller.getOne);
router.post("/", validate(CreateProductVariantSchema), controller.create);
router.put("/:id", validate(UpdateProductVariantSchema), controller.update);
router.delete("/:id", controller.deactivate);

export default router;
