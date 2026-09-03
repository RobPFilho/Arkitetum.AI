import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../controllers/projectController.js";

const router = Router();
router.use(requireAuth, requireRole("client"));
router.get("/", asyncHandler(listProjects));
router.post("/", asyncHandler(createProject));
router.patch("/:id", asyncHandler(updateProject));
router.delete("/:id", asyncHandler(deleteProject));
export default router;
