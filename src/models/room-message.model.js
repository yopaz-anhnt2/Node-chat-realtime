// Model RoomMessage — tin nhắn trong phòng nhóm
export default (sequelize, DataTypes) =>
  sequelize.define(
    "RoomMessage",
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
      content: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
    },
    {
      tableName: "room_messages",
      timestamps: true,
    }
  );
