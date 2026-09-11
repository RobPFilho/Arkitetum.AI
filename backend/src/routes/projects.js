import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
  listSuggestedProducts,
} from "../controllers/projectController.js";

const router = Router();
router.use(requireAuth, requireRole("client"));
router.get("/", asyncHandler(listProjects));
router.post("/", asyncHandler(createProject));
router.patch("/:id", asyncHandler(updateProject));
router.delete("/:id", asyncHandler(deleteProject));
router.get("/:id/suggested-products", asyncHandler(listSuggestedProducts));
export default router;
