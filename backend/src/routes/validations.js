import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getValidation, confirmValidation, listPendingForArchitect } from "../controllers/validationController.js";

const router = Router();
router.use(requireAuth);
router.get("/pending", requireRole("architect"), asyncHandler(listPendingForArchitect));
router.get("/:otherId", asyncHandler(getValidation));
router.post("/:otherId/confirm", asyncHandler(confirmValidation));
export default router;
