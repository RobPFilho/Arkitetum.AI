import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { runMatch } from "../controllers/matchController.js";
const router = Router();
router.post("/run", requireAuth, requireRole("client"), runMatch);
export default router;
