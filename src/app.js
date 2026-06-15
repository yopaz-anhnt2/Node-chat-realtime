// Libraries
import express from "express";
import expressLayouts from "express-ejs-layouts";

// Node core
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Route
import routes from "@/routes/index.js";

// Config
import { sessionMiddleware } from "@/config/session.js";

// Middleware
import { flash } from "@/middlewares/flash.middleware.js";
import { loadCurrentUser } from "@/middlewares/auth.middleware.js";

// Util
import { dateKey, dateLabel } from "@/utils/datetime.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

// Cấu hình EJS + layout (View)
app.set("view engine", "ejs");
app.set("views", join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layout"); // views/layout.ejs bọc ngoài mọi trang

// Helper ngày dùng được trong mọi view EJS
app.locals.dateKey = dateKey;
app.locals.dateLabel = dateLabel;

// Đọc dữ liệu form và JSON
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// File tĩnh: css, client.js
app.use(express.static(join(__dirname, "..", "public")));

// Session + flash + nạp user hiện tại
app.use(sessionMiddleware);
app.use(flash);
app.use(loadCurrentUser);

// Routes
app.use("/", routes);

export default app;
