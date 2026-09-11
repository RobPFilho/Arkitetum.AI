import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { listMine } from "../controllers/commissionController.js";

const router = Router();
router.get("/mine", requireAuth, requireRole("architect"), asyncHandler(listMine));
export default router;
