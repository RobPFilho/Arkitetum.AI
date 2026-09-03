import Notification from "../models/Notification.js";

export async function listNotifications(req, res) {
  const notifications = await Notification.find({ user: req.user.id })
    .sort("-createdAt")
    .limit(20);
  res.json(notifications);
}

export async function unreadCount(req, res) {
  const count = await Notification.countDocuments({ user: req.user.id, read: false });
  res.json({ count });
}

export async function markAllRead(req, res) {
  await Notification.updateMany({ user: req.user.id, read: false }, { $set: { read: true } });
  res.json({ ok: true });
}
