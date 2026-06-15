// Model RoomMember — thành viên của 1 phòng (nối Room <-> User)
export default (sequelize, DataTypes) =>
  sequelize.define(
    "RoomMember",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      roomId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      lastReadMessageId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "room_members",
      timestamps: true,
      indexes: [{ unique: true, fields: ["roomId", "userId"] }],
    }
  );
