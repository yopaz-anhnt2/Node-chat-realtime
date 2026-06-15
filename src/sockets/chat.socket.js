// Model
import { User } from "@/models/index.js";

// Service
import * as messageService from "@/services/message.service.js";

let onlineCount = 0;

// Đăng ký các sự kiện socket cho 1 kết nối
export default async function registerChatHandlers(io, socket) {
  // Lấy user từ session (đã chia sẻ qua io.engine.use)
  const userId = socket.request.session?.userId;
  if (!userId) return socket.disconnect(true);

  const user = await User.findByPk(userId, { attributes: ["id", "username"] });
  if (!user) return socket.disconnect(true);

  onlineCount++;
  io.emit("online", onlineCount);

  // Nhận tin nhắn -> lưu DB -> phát cho mọi người
  socket.on("chat", async (text) => {
    const content = String(text || "").trim().slice(0, 500);
    if (!content) return;
    try {
      const message = await messageService.createMessage({
        userId: user.id,
        content,
      });
      io.emit("chat", message);
    } catch (error) {
      console.error("chat:", error.message);
      socket.emit("error-message", "Không gửi được tin nhắn");
    }
  });

  // Đang gõ -> báo cho NHỮNG NGƯỜI KHÁC (broadcast = mọi người trừ mình)
  socket.on("typing", () => socket.broadcast.emit("typing", user.username));
  socket.on("stop-typing", () => socket.broadcast.emit("stop-typing", user.username));

  socket.on("disconnect", () => {
    socket.broadcast.emit("stop-typing", user.username); // đang gõ dở mà thoát thì tắt
    onlineCount = Math.max(0, onlineCount - 1);
    io.emit("online", onlineCount);
  });
}
