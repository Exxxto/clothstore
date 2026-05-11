import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { CategorySchema } from "../schemas";
import * as controller from "../controllers/categoryController";

const router = Router();

router.use(requireAuth);

router.get("/", controller.getAll);
router.get("/:id", controller.getOne);
router.post("/", validate(CategorySchema), controller.create);
router.put("/:id", validate(CategorySchema), controller.update);
router.delete("/:id", controller.remove);

export default router;
