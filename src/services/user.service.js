// Libraries
import bcrypt from "bcryptjs";

// Model
import { User } from "@/models/index.js";

// Tìm user theo tên đăng nhập
export async function findByUsername(username) {
  return User.findOne({ where: { username: String(username || "").trim() } });
}

// Tạo user mới với mật khẩu đã hash
export async function createUser(username, password) {
  const hashed = await bcrypt.hash(password, 10);
  return User.create({ username: String(username).trim(), password: hashed });
}

// So khớp mật khẩu thô với hash trong DB
export async function verifyPassword(user, password) {
  return bcrypt.compare(password, user.password);
}
