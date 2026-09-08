import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getTimeline, advanceTimeline } from "../controllers/timelineController.js";

const router = Router();
router.use(requireAuth);
router.get("/:otherId", asyncHandler(getTimeline));
router.post("/:otherId/advance", asyncHandler(advanceTimeline));
export default router;
