import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { CreateAdminSchema, UpdateAdminSchema, ChangePasswordSchema } from "../schemas";
import * as controller from "../controllers/adminController";

const router = Router();

router.use(requireAuth);

router.get("/", controller.getAll);
router.get("/me", controller.getMe);
router.post("/", validate(CreateAdminSchema), controller.create);
router.put("/:id", validate(UpdateAdminSchema), controller.update);
router.put("/:id/password", validate(ChangePasswordSchema), controller.changePassword);
router.delete("/:id", controller.remove);

export default router;
