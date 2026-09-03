import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { sendMessage, getConversation, listConversations, unreadCount } from "../controllers/messageController.js";

const router = Router();
router.use(requireAuth);
router.post("/", asyncHandler(sendMessage));
router.get("/conversations", asyncHandler(listConversations));
router.get("/unread-count", asyncHandler(unreadCount));
router.get("/:userId", asyncHandler(getConversation));
export default router;
