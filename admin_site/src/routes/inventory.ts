import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { StockMovementSchema } from "../schemas";
import * as controller from "../controllers/inventoryController";

const router = Router();

router.use(requireAuth);

router.get("/", controller.getBalances);
router.get("/movements", controller.getMovements);
router.post("/movements", validate(StockMovementSchema), controller.createMovement);

export default router;
