// Libraries
import { DataTypes } from "sequelize";

// Config
import sequelize from "@/config/database.js";

// Model
import UserModel from "@/models/user.model.js";
import MessageModel from "@/models/message.model.js";
import FriendshipModel from "@/models/friendship.model.js";
import DirectMessageModel from "@/models/direct-message.model.js";
import RoomModel from "@/models/room.model.js";
import RoomMemberModel from "@/models/room-member.model.js";
import RoomMessageModel from "@/models/room-message.model.js";

// Khởi tạo các model
const User = UserModel(sequelize, DataTypes);
const Message = MessageModel(sequelize, DataTypes);
const Friendship = FriendshipModel(sequelize, DataTypes);
const DirectMessage = DirectMessageModel(sequelize, DataTypes);
const Room = RoomModel(sequelize, DataTypes);
const RoomMember = RoomMemberModel(sequelize, DataTypes);
const RoomMessage = RoomMessageModel(sequelize, DataTypes);

// Quan hệ: 1 User có nhiều Message (chat phòng chung)
User.hasMany(Message, { foreignKey: "userId", as: "messages" });
Message.belongsTo(User, { foreignKey: "userId", as: "user" });

// Quan hệ Friendship: 2 phía requester / addressee đều là User
Friendship.belongsTo(User, { foreignKey: "requesterId", as: "requester" });
Friendship.belongsTo(User, { foreignKey: "addresseeId", as: "addressee" });

// Quan hệ DirectMessage: người gửi / người nhận đều là User
DirectMessage.belongsTo(User, { foreignKey: "senderId", as: "sender" });
DirectMessage.belongsTo(User, { foreignKey: "receiverId", as: "receiver" });

// Quan hệ phòng nhóm
Room.belongsTo(User, { foreignKey: "ownerId", as: "owner" });
Room.hasMany(RoomMember, { foreignKey: "roomId", as: "members" });
RoomMember.belongsTo(Room, { foreignKey: "roomId", as: "room" });
RoomMember.belongsTo(User, { foreignKey: "userId", as: "user" });
RoomMessage.belongsTo(Room, { foreignKey: "roomId", as: "room" });
RoomMessage.belongsTo(User, { foreignKey: "userId", as: "user" });

export {
  sequelize,
  User,
  Message,
  Friendship,
  DirectMessage,
  Room,
  RoomMember,
  RoomMessage,
};
