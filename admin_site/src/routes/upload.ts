import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { requireAuth } from "../middleware/auth";

const router = Router();

const VALID_GENDERS = ["men", "women", "kids"];

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const gender = typeof req.query.gender === "string" && VALID_GENDERS.includes(req.query.gender)
      ? req.query.gender
      : "men";
    const uploadDir = path.resolve(process.cwd(), "public", "assets", "products", gender);
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const timestamp = Date.now();
    cb(null, `upload-${timestamp}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".webp", ".avif"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Допустимые форматы: jpg, jpeg, png, webp, avif"));
    }
  },
});

// POST /api/upload/product-image?gender=men|women|kids
router.post("/product-image", requireAuth, upload.single("image"), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: "Файл не загружен" });
  }
  const gender = typeof req.query.gender === "string" && VALID_GENDERS.includes(req.query.gender)
    ? req.query.gender
    : "men";
  const url = `/assets/products/${gender}/${req.file.filename}`;
  res.json({ url });
});

export default router;
