// Model
import { User } from "@/models/index.js";

// Service
import * as friendService from "@/services/friend.service.js";
import * as dmService from "@/services/dm.service.js";

// GET /chat/:friendId — mở hội thoại riêng với 1 người bạn
export async function conversation(req, res) {
  const meId = req.session.userId;
  const friendId = Number(req.params.friendId);

  // Chỉ chat riêng khi đã là bạn
  if (!friendId || !(await friendService.areFriends(meId, friendId))) {
    req.flash("error", "Hai người chưa phải bạn bè");
    return res.redirect("/friends");
  }

  const friend = await User.findByPk(friendId, { attributes: ["id", "username"] });
  const messages = await dmService.getConversation(meId, friendId);

  res.render("dm", {
    title: `Chat với ${friend.username}`,
    friend,
    messages,
  });
}
