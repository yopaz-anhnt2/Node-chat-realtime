// Model
import { User } from "@/models/index.js";

// Nạp user đang đăng nhập vào req + res.locals (để view dùng currentUser)
export async function loadCurrentUser(req, res, next) {
  res.locals.currentUser = null;
  req.currentUser = null;
  try {
    if (req.session.userId) {
      const user = await User.findByPk(req.session.userId, {
        attributes: ["id", "username"],
      });
      res.locals.currentUser = user;
      req.currentUser = user;
    }
  } catch (error) {
    console.error("loadCurrentUser:", error.message);
  }
  next();
}

// Chỉ cho qua nếu ĐÃ đăng nhập
export function requireAuth(req, res, next) {
  if (!req.session.userId) return res.redirect("/login");
  next();
}

// Chỉ cho qua nếu CHƯA đăng nhập (trang login/register)
export function requireGuest(req, res, next) {
  if (req.session.userId) return res.redirect("/");
  next();
}
