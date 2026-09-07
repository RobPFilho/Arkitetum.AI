import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { listFavorites, addFavorite, removeFavorite } from "../controllers/favoriteController.js";

const router = Router();
router.use(requireAuth, requireRole("client"));
router.get("/", asyncHandler(listFavorites));
router.post("/:architectId", asyncHandler(addFavorite));
router.delete("/:architectId", asyncHandler(removeFavorite));
export default router;
