// Libraries
import { body } from "express-validator";

// Service
import * as userService from "@/services/user.service.js";

// Quy tắc cho đăng ký
export const registerRules = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Vui lòng nhập tên đăng nhập")
    .bail()
    .isLength({ max: 30 })
    .withMessage("Tên đăng nhập tối đa 30 ký tự")
    .bail()
    .custom(async (value) => {
      if (await userService.findByUsername(value)) {
        throw new Error("Tên đăng nhập đã tồn tại");
      }
    }),
  body("password")
    .notEmpty()
    .withMessage("Vui lòng nhập mật khẩu")
    .bail()
    .isLength({ min: 6 })
    .withMessage("Mật khẩu tối thiểu 6 ký tự"),
  body("confirm")
    .custom((value, { req }) => value === req.body.password)
    .withMessage("Mật khẩu nhập lại không khớp"),
];

// Quy tắc cho đăng nhập
export const loginRules = [
  body("username").trim().notEmpty().withMessage("Vui lòng nhập tên đăng nhập"),
  body("password").notEmpty().withMessage("Vui lòng nhập mật khẩu"),
];
