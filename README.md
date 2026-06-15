# Chat Realtime

Ứng dụng chat thời gian thực bằng Node.js, Express, Socket.IO, Sequelize (MySQL), view bằng **EJS**, tổ chức theo mô hình **MVC**.

## Tính năng
- Đăng ký / đăng nhập / đăng xuất (auth bằng session, mật khẩu hash bcrypt)
- Chỉ user đã đăng nhập mới vào được trang chat
- Nhắn tin realtime; tên người gửi lấy từ tài khoản
- Lưu tin nhắn vào MySQL; lịch sử render sẵn phía server bằng EJS
- Đếm số người đang online; báo "đang gõ..." (typing)
- Kết bạn (lời mời + chấp nhận/từ chối) và danh sách bạn bè
- Chat riêng 1-1 với bạn bè (realtime qua socket room riêng)
- Phòng nhóm: tạo phòng, mời nhiều người bằng 1 link mời, chat nhóm realtime
- Gộp tin cùng người/cùng phút; dải ngày "Hôm nay / Hôm qua"; giờ chuẩn múi VN
- Trạng thái Đã gửi / Đã nhận / Đã xem (chat riêng); "Ai đã xem" trong phòng nhóm

## Cấu trúc thư mục (MVC)

```
docs/realtime-socket.md    # Giải thích cơ chế realtime (Socket.IO) từng dòng
server.js                  # Bootstrap: đăng ký alias @/ rồi nạp src/main.js
alias.hooks.js             # Hook ESM: map "@/..." -> "src/..."
jsconfig.json              # Cho VSCode hiểu alias @/
.sequelizerc               # Trỏ đường dẫn config/migration/seeder cho sequelize-cli
config/
└── config.cjs             # Config DB cho sequelize-cli (đọc .env)
database/
├── migrations/            # Migration - phiên bản hóa cấu trúc bảng
└── seeders/               # Seeder - dữ liệu mẫu (user demo)
src/
├── main.js                # Entry thật: HTTP + Socket.IO + chia sẻ session + kết nối DB
├── app.js                 # Khởi tạo Express, EJS, session, static, routes
├── config/
│   ├── database.js        # Kết nối Sequelize -> MySQL (đọc .env)
│   └── session.js         # Cấu hình express-session (dùng chung Express + Socket.IO)
├── models/                # Model (M) - User, Message + quan hệ
│   ├── index.js
│   ├── user.model.js
│   └── message.model.js
├── services/              # Tầng nghiệp vụ, thao tác DB
│   ├── user.service.js    # hash/kiểm tra mật khẩu, tìm user
│   └── message.service.js
├── controllers/           # Controller (C) - viết theo class
│   ├── auth.controller.js # AuthController: đăng ký/đăng nhập/đăng xuất
│   └── home.controller.js # HomeController: trang chat
├── middlewares/
│   ├── auth.middleware.js # requireAuth / requireGuest / loadCurrentUser
│   └── flash.middleware.js# flash message (thông báo 1 lần sau redirect)
├── validators/            # Quy tắc validate (express-validator)
│   ├── auth.validator.js  # rule đăng ký/đăng nhập
│   └── validate.js        # middleware render lại form khi lỗi
├── routes/
│   └── index.js
├── views/                 # View (V) - template EJS
│   ├── layout.ejs         # khung HTML bọc ngoài mọi trang (express-ejs-layouts)
│   ├── index.ejs          # nội dung trang chat
│   ├── auth/
│   │   ├── login.ejs
│   │   └── register.ejs
│   └── partials/
│       └── flash.ejs      # toast thông báo
├── sockets/               # Xử lý sự kiện realtime
│   └── chat.socket.js
└── input.css              # Nguồn Tailwind
public/                    # File tĩnh: client.js, style.css
```

## Routes

| Method | Path        | Controller                | Mô tả                       |
|--------|-------------|---------------------------|-----------------------------|
| GET    | `/`         | `HomeController.index`    | Trang chat (cần đăng nhập)  |
| GET    | `/register` | `AuthController.showRegister` | Form đăng ký            |
| POST   | `/register` | `AuthController.register` | Xử lý đăng ký               |
| GET    | `/login`    | `AuthController.showLogin`| Form đăng nhập              |
| POST   | `/login`    | `AuthController.login`    | Xử lý đăng nhập             |
| POST   | `/logout`   | `AuthController.logout`   | Đăng xuất                   |
| GET    | `/friends`  | `FriendController.index`  | Trang bạn bè (lời mời, danh sách, gợi ý) |
| POST   | `/friends/request` | `FriendController.send` | Gửi lời mời kết bạn   |
| POST   | `/friends/accept`  | `FriendController.accept` | Chấp nhận lời mời   |
| POST   | `/friends/reject`  | `FriendController.reject` | Từ chối lời mời     |
| POST   | `/friends/cancel`  | `FriendController.cancel` | Huỷ lời mời đã gửi  |
| GET    | `/chat/:friendId`  | `DmController.conversation` | Chat riêng 1-1 với bạn |
| GET    | `/rooms`           | `RoomController.index`    | Danh sách phòng + tạo phòng |
| POST   | `/rooms`           | `RoomController.create`   | Tạo phòng mới (sinh mã mời) |
| GET    | `/rooms/join/:code`| `RoomController.join`     | Vào phòng bằng link mời |
| GET    | `/rooms/:id`       | `RoomController.show`     | Trang chat của phòng (cần là thành viên) |
| GET    | `/rooms/:id/members` | `RoomController.members` | Quản lý thành viên (đổi tên, kick) |
| POST   | `/rooms/:id/rename`| `RoomController.rename`   | Đổi tên phòng (chỉ chủ phòng) |
| POST   | `/rooms/:id/kick`  | `RoomController.kick`     | Đuổi thành viên (chỉ chủ phòng) |
| POST   | `/rooms/:id/leave` | `RoomController.leave`    | Rời phòng (thành viên) |
| POST   | `/rooms/:id/delete`| `RoomController.destroy`  | Xoá phòng (chỉ chủ phòng) |

## Sự kiện Socket.IO

| Event | Chiều | Ý nghĩa |
|-------|-------|---------|
| `chat` | client↔server | phòng chat chung |
| `online` | server→all | số người online |
| `typing` / `stop-typing` | client↔server | báo "đang gõ..." |
| `dm` | client↔server | tin nhắn riêng 1-1 (qua room `user:<id>`) |
| `friend-request` | server→1 | thông báo có người gửi lời mời kết bạn |
| `friend-accepted` | server→1 | thông báo lời mời của mình được chấp nhận |
| `dm-delivered` / `dm-seen` / `dm-status` | client↔server | trạng thái Đã gửi / Đã nhận / Đã xem (chat riêng) |
| `room-read` | client↔server | đánh dấu & hiện "ai đã xem" trong phòng |
| `join-room` / `room-message` | client↔server | chat phòng nhóm (qua room `room:<id>`) |
| `room-system` | server→room | thông báo "X đã vào/rời/bị đuổi khỏi phòng" |
| `kicked-from-room` | server→1 | buộc người bị đuổi thoát khỏi trang phòng |

## Path alias `@/`

`@/` trỏ tới thư mục `src/`, ví dụ `import HomeController from "@/controllers/home.controller.js"`.
Cơ chế: `server.js` là bootstrap — đăng ký hook ESM (`alias.hooks.js`) rồi mới dynamic-import
`src/main.js`. Nhờ vậy chạy kiểu nào cũng được (`npm start`, `npm run dev`, hay `node server.js` trực tiếp).

## Cài đặt

```bash
npm install
cp .env.example .env   # rồi điền thông tin DB thật
```

Tạo sẵn database trong MySQL (mặc định tên `chat_realtime`):

```sql
CREATE DATABASE chat_realtime CHARACTER SET utf8mb4;
```

## Database (migration & seeder)

Cấu trúc bảng quản lý bằng **migration** (sequelize-cli), không dùng `sync()`.

```bash
npm run db:migrate        # tạo bảng users, messages
npm run db:seed           # tạo user demo: admin / 123456

npm run db:migrate:undo   # rollback migration gần nhất
npm run db:seed:undo      # xóa dữ liệu seed
```

Thêm/sửa cột về sau: tạo migration mới rồi `db:migrate` (an toàn, không mất dữ liệu),
ví dụ `npx sequelize-cli migration:generate --name add-email-to-users`.

## Chạy (dev)

```bash
npm run dev     # chạy SONG SONG: server (auto-reload) + watch CSS Tailwind
```

Một lệnh duy nhất, dùng `concurrently` chạy cùng lúc 2 việc (output gắn nhãn `[server]` / `[css]`):
- `dev:server` — `node --watch server.js`
- `watch:css` — Tailwind tự build lại `public/style.css` mỗi khi sửa view

Mở http://localhost:3000 trên nhiều tab để thử chat.

## Chạy (production)

```bash
npm run build:css   # build Tailwind 1 lần (đã minify)
npm start           # chạy server
```

> Giao diện dùng **Tailwind CSS v4**: `public/style.css` được sinh từ `src/input.css`, bị gitignore
> nên máy mới / deploy phải `build:css` trước, không thì trang mất style.
