// Model DirectMessage — tin nhắn riêng 1-1 giữa 2 người
export default (sequelize, DataTypes) =>
  sequelize.define(
    "DirectMessage",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      senderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      receiverId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      content: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      deliveredAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      seenAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "direct_messages",
      timestamps: true,
    }
  );
