// Node core
import { randomBytes } from "node:crypto";

// Model
import { Room, RoomMember, RoomMessage, User } from "@/models/index.js";

const PUBLIC_FIELDS = ["id", "username"];

function formatRoomMessage(message) {
  return {
    id: message.id,
    userId: message.userId,
    user: message.user?.username ?? "Ẩn danh",
    text: message.content,
    time: message.createdAt,
  };
}

// Tạo phòng mới + tự thêm chủ phòng làm thành viên
export async function createRoom(ownerId, name) {
  const cleanName = String(name || "").trim().slice(0, 100);
  if (!cleanName) throw new Error("Vui lòng nhập tên phòng");

  const inviteCode = randomBytes(6).toString("hex"); // 12 ký tự
  const room = await Room.create({ name: cleanName, ownerId, inviteCode });
  await RoomMember.create({ roomId: room.id, userId: ownerId });
  return room;
}

// Vào phòng bằng mã mời (đã có thì thôi).
// Trả { room, joined }: joined=true nếu mới được thêm (để biết có nên báo không)
export async function joinByInviteCode(userId, code) {
  const room = await Room.findOne({ where: { inviteCode: code } });
  if (!room) throw new Error("Link mời không hợp lệ");
  const [, created] = await RoomMember.findOrCreate({
    where: { roomId: room.id, userId },
  });
  return { room, joined: created };
}

// Có phải thành viên phòng không?
export async function isMember(userId, roomId) {
  const row = await RoomMember.findOne({ where: { userId, roomId } });
  return Boolean(row);
}

// Có phải chủ phòng không?
export async function isOwner(userId, roomId) {
  const room = await Room.findByPk(roomId, { attributes: ["ownerId"] });
  return room ? room.ownerId === userId : false;
}

// Đổi tên phòng (chỉ chủ phòng)
export async function renameRoom(userId, roomId, name) {
  const cleanName = String(name || "").trim().slice(0, 100);
  if (!cleanName) throw new Error("Tên phòng không được rỗng");
  const room = await Room.findByPk(roomId);
  if (!room) throw new Error("Phòng không tồn tại");
  if (room.ownerId !== userId) throw new Error("Chỉ chủ phòng mới đổi tên");
  room.name = cleanName;
  await room.save();
  return room;
}

// Đuổi thành viên (chỉ chủ phòng, không tự đuổi mình)
export async function kickMember(ownerId, roomId, targetUserId) {
  const room = await Room.findByPk(roomId);
  if (!room) throw new Error("Phòng không tồn tại");
  if (room.ownerId !== ownerId) throw new Error("Chỉ chủ phòng mới đuổi được thành viên");
  if (targetUserId === ownerId) throw new Error("Không thể tự đuổi mình");
  await RoomMember.destroy({ where: { roomId, userId: targetUserId } });
}

// Rời phòng (xoá bản thân khỏi danh sách thành viên)
export async function leaveRoom(userId, roomId) {
  await RoomMember.destroy({ where: { userId, roomId } });
}

// Xoá phòng (chỉ chủ phòng) — cascade xoá luôn members + messages
export async function deleteRoom(userId, roomId) {
  const room = await Room.findByPk(roomId);
  if (!room) throw new Error("Phòng không tồn tại");
  if (room.ownerId !== userId) throw new Error("Chỉ chủ phòng mới xoá được phòng");
  await room.destroy();
}

// Lấy phòng kèm chủ phòng + danh sách thành viên
export async function getRoom(roomId) {
  return Room.findByPk(roomId, {
    include: [
      { model: User, as: "owner", attributes: PUBLIC_FIELDS },
      {
        model: RoomMember,
        as: "members",
        include: [{ model: User, as: "user", attributes: PUBLIC_FIELDS }],
      },
    ],
  });
}

// Danh sách phòng mà user là thành viên
export async function getUserRooms(userId) {
  const memberships = await RoomMember.findAll({
    where: { userId },
    include: [{ model: Room, as: "room" }],
    order: [["createdAt", "DESC"]],
  });
  return memberships.map((membership) => membership.room);
}

// Lấy tin nhắn gần nhất của phòng (cũ -> mới)
export async function getRoomMessages(roomId, limit = 50) {
  const messages = await RoomMessage.findAll({
    where: { roomId },
    include: [{ model: User, as: "user", attributes: ["username"] }],
    order: [["createdAt", "DESC"]],
    limit,
  });
  return messages.reverse().map(formatRoomMessage);
}

// Đánh dấu user đã đọc phòng tới tin mới nhất; trả về id tin đó
export async function markRoomRead(userId, roomId) {
  const last = await RoomMessage.findOne({
    where: { roomId },
    order: [["id", "DESC"]],
    attributes: ["id"],
  });
  const lastId = last ? last.id : 0;
  await RoomMember.update(
    { lastReadMessageId: lastId },
    { where: { userId, roomId } }
  );
  return lastId;
}

// Lưu 1 tin nhắn phòng rồi trả về dạng chuẩn hoá
export async function createRoomMessage({ roomId, userId, content }) {
  const created = await RoomMessage.create({ roomId, userId, content });
  const withUser = await RoomMessage.findByPk(created.id, {
    include: [{ model: User, as: "user", attributes: ["username"] }],
  });
  return formatRoomMessage(withUser);
}
