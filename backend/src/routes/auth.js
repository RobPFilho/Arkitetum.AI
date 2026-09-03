import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { register, login } from "../controllers/authController.js";

const router = Router();
router.post("/register/:role", asyncHandler(register));
router.post("/login", asyncHandler(login));
export default router;
