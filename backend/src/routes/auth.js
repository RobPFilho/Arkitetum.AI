import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { register, login, forgotPassword, resetPassword } from "../controllers/authController.js";

const router = Router();
router.post("/register/:role", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.post("/forgot-password", asyncHandler(forgotPassword));
router.post("/reset-password", asyncHandler(resetPassword));
export default router;
