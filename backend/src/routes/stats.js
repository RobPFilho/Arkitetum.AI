import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getPublicStats } from "../controllers/statsController.js";

const router = Router();
router.get("/", asyncHandler(getPublicStats));
export default router;
