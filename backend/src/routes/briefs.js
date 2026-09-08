import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getBrief } from "../controllers/briefController.js";

const router = Router();
const briefLimiter = rateLimit({ windowMs: 10 * 60 * 1000, limit: 15 });
router.use(requireAuth);
router.get("/:architectId", requireRole("client"), briefLimiter, asyncHandler(getBrief));
export default router;
