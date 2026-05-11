import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { CreateComplaintSchema, UpdateComplaintStatusSchema } from "../schemas";
import * as controller from "../controllers/complaintController";

const router = Router();

// POST — публичный (без requireAuth), клиент отправляет жалобу
router.post("/", validate(CreateComplaintSchema), controller.create);

// Остальные — только для авторизованных
router.use(requireAuth);

router.get("/", controller.getAll);
router.get("/:id", controller.getOne);
router.put("/:id/status", validate(UpdateComplaintStatusSchema), controller.updateStatus);

export default router;
