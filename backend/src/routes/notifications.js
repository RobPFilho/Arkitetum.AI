import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { listNotifications, unreadCount, markAllRead } from "../controllers/notificationController.js";

const router = Router();
router.use(requireAuth);
router.get("/", asyncHandler(listNotifications));
router.get("/unread-count", asyncHandler(unreadCount));
router.post("/read-all", asyncHandler(markAllRead));
export default router;
