// Service
import * as userService from "@/services/user.service.js";

// GET /register — hiển thị form đăng ký
export function showRegister(req, res) {
  res.render("auth/register", { title: "Đăng ký", errors: [], old: {} });
}

// POST /register — xử lý đăng ký (đã qua validate ở route)
export async function register(req, res) {
  const { username, password } = req.body;
  try {
    const user = await userService.createUser(username, password);
    req.session.userId = user.id;
    req.flash("success", `Đăng ký thành công. Chào ${user.username}!`);
    res.redirect("/");
  } catch (error) {
    res.status(400).render("auth/register", {
      title: "Đăng ký",
      errors: [error.message],
      old: req.body,
    });
  }
}

// GET /login — hiển thị form đăng nhập
export function showLogin(req, res) {
  res.render("auth/login", { title: "Đăng nhập", errors: [], old: {} });
}

// POST /login — xử lý đăng nhập (đã qua validate ở route)
export async function login(req, res) {
  const { username, password } = req.body;
  try {
    const user = await userService.findByUsername(username);
    if (!user || !(await userService.verifyPassword(user, password))) {
      throw new Error("Sai tên đăng nhập hoặc mật khẩu");
    }
    req.session.userId = user.id;
    req.flash("success", `Chào mừng trở lại, ${user.username}!`);
    res.redirect("/");
  } catch (error) {
    res.status(401).render("auth/login", {
      title: "Đăng nhập",
      errors: [error.message],
      old: req.body,
    });
  }
}

// POST /logout — đăng xuất
export function logout(req, res) {
  req.session.userId = null;
  req.flash("success", "Bạn đã đăng xuất");
  res.redirect("/login");
}
