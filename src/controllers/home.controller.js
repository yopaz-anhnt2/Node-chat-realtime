// Service
import * as messageService from "@/services/message.service.js";
import * as friendService from "@/services/friend.service.js";

// GET / — trang chat, render kèm lịch sử tin nhắn
export async function index(req, res) {
  let messages = [];
  try {
    messages = await messageService.getRecentMessages(50);
  } catch (error) {
    console.error("HomeController.index:", error.message);
  }
  const pendingCount = await friendService.countIncomingRequests(req.session.userId);
  res.render("index", { title: "Chat Realtime", messages, pendingCount });
}
