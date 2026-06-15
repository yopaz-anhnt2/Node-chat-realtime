// Model
import { Message, User } from "@/models/index.js";

// Chuẩn hoá dữ liệu tin nhắn gửi về client
function formatMessage(message) {
  return {
    id: message.id,
    user: message.user?.username ?? "Ẩn danh",
    text: message.content,
    time: message.createdAt,
  };
}

// Lấy các tin nhắn gần nhất (kèm tên người gửi)
export async function getRecentMessages(limit = 50) {
  const messages = await Message.findAll({
    include: [{ model: User, as: "user", attributes: ["username"] }],
    order: [["createdAt", "DESC"]],
    limit,
  });
  return messages.reverse().map(formatMessage); // đảo lại cho cũ -> mới
}

// Lưu tin nhắn mới rồi trả về dạng đã chuẩn hoá
export async function createMessage({ userId, content }) {
  const created = await Message.create({ userId, content });
  const messageWithUser = await Message.findByPk(created.id, {
    include: [{ model: User, as: "user", attributes: ["username"] }],
  });
  return formatMessage(messageWithUser);
}
