import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import * as controller from "../controllers/auditLogController";

const router = Router();

router.use(requireAuth);

router.get("/", controller.getAll);
router.get("/:id", controller.getOne);

export default router;
