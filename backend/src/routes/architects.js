import { Router } from "express";
import { getArchitectProfile } from "../controllers/architectController.js";
const router = Router();
router.get("/:id", getArchitectProfile);
export default router;
