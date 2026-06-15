// Libraries
import "dotenv/config";
import { Server } from "socket.io";

// Node core
import { createServer } from "node:http";

// App
import app from "@/app.js";

// Model
import { sequelize } from "@/models/index.js";

// Config
import { sessionMiddleware } from "@/config/session.js";

// Socket
import registerChatHandlers from "@/sockets/chat.socket.js";
import registerDmHandlers from "@/sockets/dm.socket.js";
import registerRoomHandlers from "@/sockets/room.socket.js";

const httpServer = createServer(app);
const io = new Server(httpServer);

// Cho controller truy cập io qua req.app.get("io")
app.set("io", io);

// Chia sẻ session với Socket.IO để biết ai đang đăng nhập
io.engine.use(sessionMiddleware);

io.on("connection", (socket) => {
  registerChatHandlers(io, socket); // phòng chat chung
  registerDmHandlers(io, socket); // chat riêng 1-1
  registerRoomHandlers(io, socket); // phòng nhóm
});

const PORT = process.env.PORT || 3000;

async function start() {
  // Kiểm tra kết nối database (cấu trúc bảng do migration quản lý)
  try {
    await sequelize.authenticate();
    console.log("✅ Kết nối MySQL thành công");
  } catch (error) {
    console.error("❌ Lỗi kết nối DB:", error.message);
    console.error("   Chạy `npm run db:migrate` và kiểm tra .env.");
  }

  httpServer.listen(PORT, () => {
    console.log(`🚀 Chat đang chạy tại http://localhost:${PORT}`);
  });
}

start();
