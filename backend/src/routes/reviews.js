import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { createReview, listReviewsForArchitect } from "../controllers/reviewController.js";

const router = Router();
router.post("/", requireAuth, requireRole("client"), asyncHandler(createReview));
router.get("/:architectId", asyncHandler(listReviewsForArchitect));
export default router;
