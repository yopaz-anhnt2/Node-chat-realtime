// Libraries
import "dotenv/config";
import { Sequelize } from "sequelize";

// Khởi tạo kết nối Sequelize tới MySQL từ biến môi trường (.env)
const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    dialect: process.env.DB_CONNECTION || "mysql",
    timezone: "+07:00", // lưu/đọc datetime theo giờ Việt Nam
    logging: false, // đặt console.log để xem câu SQL
    dialectOptions: {
      connectTimeout: 10000,
    },
    pool: {
      max: 5,
      min: 0,
      idle: 10000,
    },
  }
);

export default sequelize;
