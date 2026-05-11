import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { WarehouseSchema } from "../schemas";
import * as controller from "../controllers/warehouseController";

const router = Router();

router.use(requireAuth);

router.get("/", controller.getAll);
router.post("/", validate(WarehouseSchema), controller.create);
router.put("/:id", validate(WarehouseSchema), controller.update);
router.delete("/:id", controller.remove);

export default router;
