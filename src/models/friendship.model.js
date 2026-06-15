// Model Friendship — lời mời & quan hệ bạn bè
// requesterId: người GỬI lời mời, addresseeId: người NHẬN
// status: "pending" (đang chờ) | "accepted" (đã là bạn)
export default (sequelize, DataTypes) =>
  sequelize.define(
    "Friendship",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      requesterId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      addresseeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("pending", "accepted"),
        allowNull: false,
        defaultValue: "pending",
      },
    },
    {
      tableName: "friendships",
      timestamps: true,
      indexes: [{ unique: true, fields: ["requesterId", "addresseeId"] }],
    }
  );
