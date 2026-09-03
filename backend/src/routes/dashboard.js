import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  addPortfolio,
  deletePortfolio,
  deleteMyAccount,
  exportMyData,
  getMe,
  updateMe,
} from "../controllers/dashboardController.js";

const router = Router();
router.use(requireAuth);
router.get("/me", getMe);
router.patch("/me", asyncHandler(updateMe));
router.get("/me/export", asyncHandler(exportMyData));
router.delete("/me", asyncHandler(deleteMyAccount));
router.post("/portfolio", requireRole("architect"), asyncHandler(addPortfolio));
router.delete("/portfolio/:id", requireRole("architect"), asyncHandler(deletePortfolio));

export default router;
