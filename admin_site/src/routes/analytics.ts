import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import * as controller from "../controllers/analyticsController";

const router = Router();

router.use(requireAuth);

router.get("/", controller.getAll);

export default router;
