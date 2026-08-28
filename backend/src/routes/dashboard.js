import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  addPortfolio,
  deletePortfolio,
  getMe,
  updateMe,
} from "../controllers/dashboardController.js";

const router = Router();
router.use(requireAuth);
router.get("/me", getMe);
router.patch("/me", updateMe);
router.post("/portfolio", requireRole("architect"), addPortfolio);
router.delete("/portfolio/:id", requireRole("architect"), deletePortfolio);

export default router;
