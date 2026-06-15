// Libraries
import "dotenv/config";
import session from "express-session";

// Bắt buộc khai báo SESSION_SECRET trong .env
if (!process.env.SESSION_SECRET) {
  throw new Error("Thiếu SESSION_SECRET trong .env");
}

// Middleware session — dùng chung cho cả Express và Socket.IO
export const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24, // 1 ngày
  },
});
