import { register } from "node:module";

// Đăng ký alias "@/" -> "src/" TRƯỚC khi nạp app.
// Dùng dynamic import để hook đã sẵn sàng khi src/main.js resolve các "@/...".
register("./alias.hooks.js", import.meta.url);

await import("./src/main.js");
