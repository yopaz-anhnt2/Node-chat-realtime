// CommonJS (.cjs) vì sequelize-cli không chạy được ESM.
// Đọc cùng biến môi trường với app trong .env.
require("dotenv").config();

const common = {
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD || null,
  database: process.env.DB_DATABASE,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  dialect: process.env.DB_CONNECTION || "mysql",
};

module.exports = {
  development: common,
  test: common,
  production: common,
};
