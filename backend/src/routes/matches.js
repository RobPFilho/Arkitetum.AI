import { Router } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { runMatch, listMatchHistory } from "../controllers/matchController.js";

const router = Router();
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  keyGenerator: (req, res) => {
    return req.user?.id || ipKeyGenerator(req, res);
  },
  message: { error: "Limite de buscas por hora atingido. Tente novamente mais tarde." },
});
router.post("/run", requireAuth, requireRole("client"), aiLimiter, asyncHandler(runMatch));
router.get("/history", requireAuth, requireRole("client"), asyncHandler(listMatchHistory));
export default router;
