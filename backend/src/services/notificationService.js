import Notification from "../models/Notification.js";

export function notify(userId, type, text, link) {
  return Notification.create({ user: userId, type, text, link }).catch((err) =>
    console.error("Falha ao criar notificação:", err.message),
  );
}
