// Service
import * as friendService from "@/services/friend.service.js";
import * as dmService from "@/services/dm.service.js";

// Đăng ký xử lý chat riêng 1-1 cho 1 kết nối
export default function registerDmHandlers(io, socket) {
  const userId = socket.request.session?.userId;
  if (!userId) return;

  // Mỗi user có 1 "phòng riêng" theo id -> để gửi tin đích danh
  socket.join("user:" + userId);

  socket.on("dm", async ({ toUserId, text }) => {
    const content = String(text || "").trim().slice(0, 500);
    const friendId = Number(toUserId);
    if (!content || !friendId) return;
    try {
      // Chỉ gửi được nếu là bạn bè
      if (!(await friendService.areFriends(userId, friendId))) return;

      const message = await dmService.createDirectMessage({
        senderId: userId,
        receiverId: friendId,
        content,
      });

      // Gửi cho phòng của NGƯỜI NHẬN và phòng của MÌNH (để mọi tab cùng thấy)
      io.to("user:" + userId)
        .to("user:" + friendId)
        .emit("dm", message);
    } catch (error) {
      console.error("dm:", error.message);
      socket.emit("error-message", "Không gửi được tin nhắn");
    }
  });

  // Người nhận báo ĐÃ NHẬN tin của otherId -> cập nhật cho otherId
  socket.on("dm-delivered", async ({ otherId }) => {
    const friendId = Number(otherId);
    if (!friendId) return;
    await dmService.markDelivered(userId, friendId);
    io.to("user:" + friendId).emit("dm-status", { from: userId, status: "delivered" });
  });

  // Người nhận báo ĐÃ XEM tin của otherId -> cập nhật cho otherId
  socket.on("dm-seen", async ({ otherId }) => {
    const friendId = Number(otherId);
    if (!friendId) return;
    await dmService.markSeen(userId, friendId);
    io.to("user:" + friendId).emit("dm-status", { from: userId, status: "seen" });
  });
}
