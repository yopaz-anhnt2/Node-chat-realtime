// Service
import * as friendService from "@/services/friend.service.js";

// GET /friends — trang bạn bè (4 mục)
export async function index(req, res) {
  const meId = req.session.userId;
  const [friends, incoming, outgoing, discoverable] = await Promise.all([
    friendService.getFriends(meId),
    friendService.getIncomingRequests(meId),
    friendService.getOutgoingRequests(meId),
    friendService.getDiscoverableUsers(meId),
  ]);
  res.render("friends", {
    title: "Bạn bè",
    friends,
    incoming,
    outgoing,
    discoverable,
  });
}

// POST /friends/request — gửi lời mời
export async function send(req, res) {
  try {
    const addresseeId = Number(req.body.userId);
    await friendService.sendRequest(req.session.userId, addresseeId);

    // Báo realtime cho người nhận (nếu họ đang online)
    const io = req.app.get("io");
    const count = await friendService.countIncomingRequests(addresseeId);
    io.to("user:" + addresseeId).emit("friend-request", {
      from: req.currentUser.username,
      count,
    });

    req.flash("success", "Đã gửi lời mời kết bạn");
  } catch (error) {
    req.flash("error", error.message);
  }
  res.redirect("/friends");
}

// POST /friends/accept — chấp nhận lời mời
export async function accept(req, res) {
  try {
    const requesterId = Number(req.body.userId);
    await friendService.acceptRequest(req.session.userId, requesterId);

    // Báo realtime cho NGƯỜI ĐÃ GỬI lời mời: giờ đã thành bạn
    req.app
      .get("io")
      .to("user:" + requesterId)
      .emit("friend-accepted", { from: req.currentUser.username });

    req.flash("success", "Đã chấp nhận lời mời");
  } catch (error) {
    req.flash("error", error.message);
  }
  res.redirect("/friends");
}

// POST /friends/reject — từ chối lời mời đến
export async function reject(req, res) {
  await friendService.rejectRequest(req.session.userId, Number(req.body.userId));
  req.flash("success", "Đã từ chối lời mời");
  res.redirect("/friends");
}

// POST /friends/cancel — huỷ lời mời đã gửi
export async function cancel(req, res) {
  await friendService.cancelRequest(req.session.userId, Number(req.body.userId));
  req.flash("success", "Đã huỷ lời mời");
  res.redirect("/friends");
}
