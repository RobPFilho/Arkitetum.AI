import { Router } from "express";
import Material from "../models/Material.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
const router = Router();
router.get(
  "/",
  asyncHandler(async (_req, res) => res.json(await Material.find().sort("category name"))),
);
export default router;
