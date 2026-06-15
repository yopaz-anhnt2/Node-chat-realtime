// Libraries
import { Router } from "express";

// Controller
import * as HomeController from "@/controllers/home.controller.js";
import * as AuthController from "@/controllers/auth.controller.js";
import * as FriendController from "@/controllers/friend.controller.js";
import * as DmController from "@/controllers/dm.controller.js";
import * as RoomController from "@/controllers/room.controller.js";

// Middleware
import { requireAuth, requireGuest } from "@/middlewares/auth.middleware.js";

// Validator
import { registerRules, loginRules } from "@/validators/auth.validator.js";
import { handleValidation } from "@/validators/validate.js";

const router = Router();

// Trang chat (phải đăng nhập)
router.get("/", requireAuth, HomeController.index);

// Đăng ký
router.get("/register", requireGuest, AuthController.showRegister);
router.post(
  "/register",
  requireGuest,
  registerRules,
  handleValidation("auth/register", "Đăng ký"),
  AuthController.register
);

// Đăng nhập
router.get("/login", requireGuest, AuthController.showLogin);
router.post(
  "/login",
  requireGuest,
  loginRules,
  handleValidation("auth/login", "Đăng nhập"),
  AuthController.login
);

// Đăng xuất
router.post("/logout", requireAuth, AuthController.logout);

// Bạn bè
router.get("/friends", requireAuth, FriendController.index);
router.post("/friends/request", requireAuth, FriendController.send);
router.post("/friends/accept", requireAuth, FriendController.accept);
router.post("/friends/reject", requireAuth, FriendController.reject);
router.post("/friends/cancel", requireAuth, FriendController.cancel);

// Chat riêng 1-1
router.get("/chat/:friendId", requireAuth, DmController.conversation);

// Phòng nhóm
router.get("/rooms", requireAuth, RoomController.index);
router.post("/rooms", requireAuth, RoomController.create);
router.get("/rooms/join/:code", requireAuth, RoomController.join);
router.get("/rooms/:id", requireAuth, RoomController.show);
router.get("/rooms/:id/members", requireAuth, RoomController.members);
router.post("/rooms/:id/rename", requireAuth, RoomController.rename);
router.post("/rooms/:id/kick", requireAuth, RoomController.kick);
router.post("/rooms/:id/leave", requireAuth, RoomController.leave);
router.post("/rooms/:id/delete", requireAuth, RoomController.destroy);

export default router;
