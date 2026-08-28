import { Router } from "express";
import Material from "../models/Material.js";
const router = Router();
router.get("/", async (_req, res) =>
  res.json(await Material.find().sort("category name")),
);
export default router;
