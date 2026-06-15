// Libraries
import { Op } from "sequelize";

// Model
import { DirectMessage, User } from "@/models/index.js";

// Chuẩn hoá tin nhắn riêng gửi về client
function formatDm(message) {
  return {
    id: message.id,
    senderId: message.senderId,
    senderName: message.sender?.username ?? "Ẩn danh",
    receiverId: message.receiverId,
    text: message.content,
    time: message.createdAt,
    deliveredAt: message.deliveredAt,
    seenAt: message.seenAt,
  };
}

// Lấy hội thoại giữa 2 người (cũ -> mới)
export async function getConversation(meId, friendId, limit = 50) {
  const messages = await DirectMessage.findAll({
    where: {
      [Op.or]: [
        { senderId: meId, receiverId: friendId },
        { senderId: friendId, receiverId: meId },
      ],
    },
    include: [{ model: User, as: "sender", attributes: ["username"] }],
    order: [["createdAt", "DESC"]],
    limit,
  });
  return messages.reverse().map(formatDm);
}

// Lưu 1 tin nhắn riêng rồi trả về dạng chuẩn hoá
export async function createDirectMessage({ senderId, receiverId, content }) {
  const created = await DirectMessage.create({ senderId, receiverId, content });
  const withSender = await DirectMessage.findByPk(created.id, {
    include: [{ model: User, as: "sender", attributes: ["username"] }],
  });
  return formatDm(withSender);
}

// Đánh dấu ĐÃ NHẬN: các tin do `otherId` gửi cho mình (`readerId`)
export async function markDelivered(readerId, otherId) {
  await DirectMessage.update(
    { deliveredAt: new Date() },
    {
      where: { senderId: otherId, receiverId: readerId, deliveredAt: null },
    }
  );
}

// Đánh dấu ĐÃ XEM: các tin do `otherId` gửi cho mình (`readerId`)
export async function markSeen(readerId, otherId) {
  const now = new Date();
  await DirectMessage.update(
    { seenAt: now, deliveredAt: now },
    {
      where: { senderId: otherId, receiverId: readerId, seenAt: null },
    }
  );
}
