// Model Room — phòng chat nhóm
export default (sequelize, DataTypes) =>
  sequelize.define(
    "Room",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      ownerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      // Mã mời (dùng cho link mời): mọi người có link đều vào được
      inviteCode: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
    },
    {
      tableName: "rooms",
      timestamps: true,
    }
  );
