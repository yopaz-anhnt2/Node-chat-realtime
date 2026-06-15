// Libraries
import { Op } from "sequelize";

// Model
import { Friendship, User } from "@/models/index.js";

const PUBLIC_FIELDS = ["id", "username"];

// Có phải bạn bè (đã accepted) không?
export async function areFriends(aId, bId) {
  const row = await Friendship.findOne({
    where: {
      status: "accepted",
      [Op.or]: [
        { requesterId: aId, addresseeId: bId },
        { requesterId: bId, addresseeId: aId },
      ],
    },
  });
  return Boolean(row);
}

// Lấy quan hệ giữa me và other (bất kể chiều), trả null nếu chưa có
export async function getRelationship(meId, otherId) {
  return Friendship.findOne({
    where: {
      [Op.or]: [
        { requesterId: meId, addresseeId: otherId },
        { requesterId: otherId, addresseeId: meId },
      ],
    },
  });
}

// Gửi lời mời kết bạn
export async function sendRequest(requesterId, addresseeId) {
  if (requesterId === addresseeId) throw new Error("Không thể tự kết bạn");
  if (await getRelationship(requesterId, addresseeId)) {
    throw new Error("Đã có lời mời hoặc đã là bạn");
  }
  return Friendship.create({ requesterId, addresseeId, status: "pending" });
}

// Chấp nhận lời mời (me là người NHẬN)
export async function acceptRequest(meId, requesterId) {
  const row = await Friendship.findOne({
    where: { requesterId, addresseeId: meId, status: "pending" },
  });
  if (!row) throw new Error("Không tìm thấy lời mời");
  row.status = "accepted";
  await row.save();
  return row;
}

// Từ chối lời mời đến (me là người NHẬN)
export async function rejectRequest(meId, requesterId) {
  await Friendship.destroy({
    where: { requesterId, addresseeId: meId, status: "pending" },
  });
}

// Huỷ lời mời mình đã gửi
export async function cancelRequest(meId, addresseeId) {
  await Friendship.destroy({
    where: { requesterId: meId, addresseeId, status: "pending" },
  });
}

// Danh sách bạn bè (đã accepted) — trả về "người kia"
export async function getFriends(meId) {
  const rows = await Friendship.findAll({
    where: {
      status: "accepted",
      [Op.or]: [{ requesterId: meId }, { addresseeId: meId }],
    },
    include: [
      { model: User, as: "requester", attributes: PUBLIC_FIELDS },
      { model: User, as: "addressee", attributes: PUBLIC_FIELDS },
    ],
    order: [["updatedAt", "DESC"]],
  });
  return rows.map((row) =>
    row.requesterId === meId ? row.addressee : row.requester
  );
}

// Đếm số lời mời ĐẾN đang chờ (cho badge)
export async function countIncomingRequests(meId) {
  return Friendship.count({ where: { addresseeId: meId, status: "pending" } });
}

// Lời mời ĐẾN (người khác gửi cho mình, đang chờ)
export async function getIncomingRequests(meId) {
  const rows = await Friendship.findAll({
    where: { addresseeId: meId, status: "pending" },
    include: [{ model: User, as: "requester", attributes: PUBLIC_FIELDS }],
    order: [["createdAt", "DESC"]],
  });
  return rows.map((row) => row.requester);
}

// Lời mời ĐÃ GỬI (đang chờ người kia duyệt)
export async function getOutgoingRequests(meId) {
  const rows = await Friendship.findAll({
    where: { requesterId: meId, status: "pending" },
    include: [{ model: User, as: "addressee", attributes: PUBLIC_FIELDS }],
    order: [["createdAt", "DESC"]],
  });
  return rows.map((row) => row.addressee);
}

// Người dùng có thể kết bạn (chưa dính quan hệ nào với mình)
export async function getDiscoverableUsers(meId) {
  const relations = await Friendship.findAll({
    where: { [Op.or]: [{ requesterId: meId }, { addresseeId: meId }] },
    attributes: ["requesterId", "addresseeId"],
  });

  const relatedIds = new Set([meId]);
  for (const relation of relations) {
    relatedIds.add(relation.requesterId);
    relatedIds.add(relation.addresseeId);
  }

  return User.findAll({
    where: { id: { [Op.notIn]: [...relatedIds] } },
    attributes: PUBLIC_FIELDS,
    order: [["username", "ASC"]],
  });
}
