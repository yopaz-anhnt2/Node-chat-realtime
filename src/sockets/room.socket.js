// Model
import { User } from "@/models/index.js";

// Service
import * as roomService from "@/services/room.service.js";

// Đăng ký xử lý chat phòng nhóm cho 1 kết nối
export default function registerRoomHandlers(io, socket) {
  const userId = socket.request.session?.userId;
  if (!userId) return;

  // Vào "phòng socket" room:<id> (chỉ khi là thành viên)
  socket.on("join-room", async (roomId) => {
    const id = Number(roomId);
    if (!id || !(await roomService.isMember(userId, id))) return;
    socket.join("room:" + id);
  });

  // Đánh dấu đã xem phòng -> báo cho cả phòng (để hiện "Đã xem bởi ai")
  socket.on("room-read", async (roomId) => {
    const id = Number(roomId);
    if (!id || !(await roomService.isMember(userId, id))) return;
    const lastReadMessageId = await roomService.markRoomRead(userId, id);
    const user = await User.findByPk(userId, { attributes: ["username"] });
    io.to("room:" + id).emit("room-read", {
      userId,
      username: user?.username ?? "",
      lastReadMessageId,
    });
  });

  // Nhận tin -> lưu DB -> phát cho cả phòng
  socket.on("room-message", async ({ roomId, text }) => {
    const id = Number(roomId);
    const content = String(text || "").trim().slice(0, 500);
    if (!id || !content) return;
    try {
      if (!(await roomService.isMember(userId, id))) return;
      const message = await roomService.createRoomMessage({
        roomId: id,
        userId,
        content,
      });
      io.to("room:" + id).emit("room-message", message);
    } catch (error) {
      console.error("room-message:", error.message);
      socket.emit("error-message", "Không gửi được tin nhắn");
    }
  });
}
