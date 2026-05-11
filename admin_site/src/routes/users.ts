import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { CreateUserSchema, UpdateUserSchema, ChangePasswordSchema } from "../schemas";
import * as controller from "../controllers/userController";

const router = Router();

router.use(requireAuth);

router.get("/", controller.getAll);
router.get("/:id", controller.getOne);
router.post("/", validate(CreateUserSchema), controller.create);
router.put("/:id", validate(UpdateUserSchema), controller.update);
router.put("/:id/password", validate(ChangePasswordSchema), controller.changePassword);
router.delete("/:id", controller.remove);

export default router;
