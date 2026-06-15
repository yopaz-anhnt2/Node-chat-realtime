// Model
import { User } from "@/models/index.js";

// Service
import * as roomService from "@/services/room.service.js";

// GET /rooms — danh sách phòng của tôi + form tạo phòng
export async function index(req, res) {
  const rooms = await roomService.getUserRooms(req.session.userId);
  res.render("rooms", { title: "Phòng nhóm", rooms });
}

// POST /rooms — tạo phòng mới
export async function create(req, res) {
  try {
    const room = await roomService.createRoom(req.session.userId, req.body.name);
    req.flash("success", "Đã tạo phòng");
    res.redirect("/rooms/" + room.id);
  } catch (error) {
    req.flash("error", error.message);
    res.redirect("/rooms");
  }
}

// GET /rooms/join/:code — vào phòng bằng link mời
export async function join(req, res) {
  try {
    const { room, joined } = await roomService.joinByInviteCode(
      req.session.userId,
      req.params.code
    );
    // Báo cho người đang ở trong phòng (chỉ khi mới vào)
    if (joined) {
      req.app
        .get("io")
        .to("room:" + room.id)
        .emit("room-system", { text: `${req.currentUser.username} đã vào phòng` });
    }
    req.flash("success", `Đã vào phòng ${room.name}`);
    res.redirect("/rooms/" + room.id);
  } catch (error) {
    req.flash("error", error.message);
    res.redirect("/rooms");
  }
}

// GET /rooms/:id — trang chat của phòng
export async function show(req, res) {
  const meId = req.session.userId;
  const roomId = Number(req.params.id);

  if (!roomId || !(await roomService.isMember(meId, roomId))) {
    req.flash("error", "Bạn chưa ở trong phòng này");
    return res.redirect("/rooms");
  }

  const room = await roomService.getRoom(roomId);
  const messages = await roomService.getRoomMessages(roomId);

  res.render("room", {
    title: room.name,
    room,
    messages,
  });
}

// GET /rooms/:id/members — trang quản lý thành viên
export async function members(req, res) {
  const meId = req.session.userId;
  const roomId = Number(req.params.id);
  if (!roomId || !(await roomService.isMember(meId, roomId))) {
    req.flash("error", "Bạn chưa ở trong phòng này");
    return res.redirect("/rooms");
  }
  const room = await roomService.getRoom(roomId);
  res.render("room-members", { title: "Thành viên - " + room.name, room });
}

// POST /rooms/:id/rename — đổi tên phòng (chỉ chủ phòng)
export async function rename(req, res) {
  const roomId = Number(req.params.id);
  try {
    await roomService.renameRoom(req.session.userId, roomId, req.body.name);
    req.flash("success", "Đã đổi tên phòng");
  } catch (error) {
    req.flash("error", error.message);
  }
  res.redirect("/rooms/" + roomId + "/members");
}

// POST /rooms/:id/kick — đuổi thành viên (chỉ chủ phòng)
export async function kick(req, res) {
  const roomId = Number(req.params.id);
  const targetId = Number(req.body.userId);
  try {
    await roomService.kickMember(req.session.userId, roomId, targetId);

    const target = await User.findByPk(targetId, { attributes: ["username"] });
    const io = req.app.get("io");
    // Báo cho phòng + buộc người bị đuổi rời khỏi trang
    io.to("room:" + roomId).emit("room-system", {
      text: `${target?.username ?? "Một thành viên"} đã bị đưa ra khỏi phòng`,
    });
    io.to("user:" + targetId).emit("kicked-from-room", roomId);

    req.flash("success", "Đã đuổi thành viên");
  } catch (error) {
    req.flash("error", error.message);
  }
  res.redirect("/rooms/" + roomId + "/members");
}

// POST /rooms/:id/leave — rời phòng (thành viên thường)
export async function leave(req, res) {
  const roomId = Number(req.params.id);
  if (await roomService.isOwner(req.session.userId, roomId)) {
    req.flash("error", "Bạn là chủ phòng — hãy xoá phòng thay vì rời");
    return res.redirect("/rooms/" + roomId);
  }
  await roomService.leaveRoom(req.session.userId, roomId);
  req.app
    .get("io")
    .to("room:" + roomId)
    .emit("room-system", { text: `${req.currentUser.username} đã rời phòng` });
  req.flash("success", "Đã rời phòng");
  res.redirect("/rooms");
}

// POST /rooms/:id/delete — xoá phòng (chỉ chủ phòng)
export async function destroy(req, res) {
  try {
    await roomService.deleteRoom(req.session.userId, Number(req.params.id));
    req.flash("success", "Đã xoá phòng");
  } catch (error) {
    req.flash("error", error.message);
  }
  res.redirect("/rooms");
}
