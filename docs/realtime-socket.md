# Cơ chế Realtime (Socket.IO) — giải thích từng dòng

Tài liệu này giải thích cách chat realtime hoạt động trong dự án, kèm chú thích **từng câu lệnh** ở 3 file liên quan.

---

## 1. Ý tưởng cốt lõi

HTTP thường là "hỏi — đáp rồi cúp máy". Còn chat cần **server tự đẩy** tin xuống mọi người ngay khi có tin mới → dùng **WebSocket** (qua thư viện Socket.IO).

```
HTTP thường:   Client ──hỏi──► Server ──trả──► Client     (xong, đứt)
WebSocket:     Client ◄═══ đường ống mở liên tục ═══► Server   (luôn mở)
```

> WebSocket là **đường ống 2 chiều luôn mở**. Nhờ đó server **chủ động** gửi dữ liệu xuống client mà client không cần hỏi lại.

---

## 2. Sơ đồ luồng (2 người chat)

```
        TRÌNH DUYỆT A                  SERVER (Node)               TRÌNH DUYỆT B
            │                              │                            │
  ① io()  ─┼──── kết nối WebSocket ──────►│                            │
            │     (kèm cookie session)     │ ② io.on("connection")      │
            │                              │   đọc session.userId       │
            │                              │   load user từ DB          │
            │◄──── emit("online", 2) ──────│──── emit("online", 2) ────►│
            │                              │                            │
  ③ emit("chat","hi") ───────────────────►│ ④ socket.on("chat")        │
            │                              │   lưu MySQL (createMessage)│
            │                              │ ⑤ io.emit("chat", {...})   │
            │◄──── "chat" {user,text} ─────│──── "chat" {user,text} ───►│
            │                              │                            │
  ⑥ on("chat") vẽ bong bóng PHẢI          │              ⑥ on("chat") vẽ bong bóng TRÁI
```

---

## 3. Ba file liên quan

| File | Vai trò |
|------|---------|
| [`src/main.js`](../src/main.js) | Tạo server Socket.IO, gắn session, lắng nghe kết nối |
| [`src/sockets/chat.socket.js`](../src/sockets/chat.socket.js) | Xử lý sự kiện cho mỗi kết nối (nhận/gửi tin, online) |
| [`public/client.js`](../public/client.js) | Chạy ở trình duyệt: gửi tin, nhận tin, vẽ bong bóng |

---

## 4. `src/main.js` — dựng server realtime

```js
import { Server } from "socket.io";        // lớp Server của Socket.IO
import { createServer } from "node:http";  // tạo HTTP server thuần của Node
```

```js
const httpServer = createServer(app);      // (1)
const io = new Server(httpServer);         // (2)
```
- **(1)** Tạo HTTP server từ Express app. Express lo route/trang thường; cần server HTTP "trần" này để Socket.IO bám vào.
- **(2)** Gắn Socket.IO lên cùng HTTP server đó → chat và web chung 1 cổng (3000).

```js
io.engine.use(sessionMiddleware);          // (3)
```
- **(3)** Cho Socket.IO **dùng chung session** với Express. Nhờ vậy trong socket đọc được `socket.request.session.userId` → biết **ai** đang kết nối (không phải đăng nhập lại).

```js
io.on("connection", (socket) => registerChatHandlers(io, socket));  // (4)
```
- **(4)** Mỗi khi **một trình duyệt kết nối**, Socket.IO tạo một đối tượng `socket` đại diện cho kết nối đó và gọi `registerChatHandlers`.
  - `io`  = "trung tâm", đại diện **toàn bộ** các kết nối.
  - `socket` = **một** kết nối cụ thể (một tab trình duyệt).

---

## 5. `src/sockets/chat.socket.js` — xử lý từng kết nối

```js
import { User } from "@/models/index.js";
import * as messageService from "@/services/message.service.js";
```
Nạp model `User` (để load người dùng) và service tin nhắn (để lưu DB).

```js
let onlineCount = 0;   // (1)
```
- **(1)** Biến đếm số người online. Đặt **ngoài hàm** → dùng chung cho mọi kết nối (chỉ có 1 bản duy nhất trong server).

```js
export default async function registerChatHandlers(io, socket) {
```
Hàm này chạy **một lần cho mỗi kết nối mới**. `async` vì bên trong có `await` (truy vấn DB).

```js
  const userId = socket.request.session?.userId;   // (2)
  if (!userId) return socket.disconnect(true);      // (3)
```
- **(2)** Lấy `userId` từ session của kết nối này (có được nhờ `io.engine.use` ở main.js). `?.` = nếu chưa có session thì trả `undefined` chứ không lỗi.
- **(3)** Chưa đăng nhập (không có `userId`) → **ngắt kết nối** ngay, không cho chat. `return` để dừng hàm.

```js
  const user = await User.findByPk(userId, { attributes: ["id", "username"] });  // (4)
  if (!user) return socket.disconnect(true);                                      // (5)
```
- **(4)** Tìm user trong DB theo id. `attributes` = chỉ lấy 2 cột `id`, `username` (không lấy mật khẩu — gọn + an toàn).
- **(5)** Có `userId` nhưng user không tồn tại (vd bị xóa) → ngắt.

```js
  onlineCount++;                    // (6)
  io.emit("online", onlineCount);   // (7)
```
- **(6)** Có thêm 1 người vào → tăng đếm.
- **(7)** `io.emit` = **phát cho TẤT CẢ** đang kết nối, sự kiện tên `"online"` kèm số mới → mọi người thấy số online cập nhật.

```js
  socket.on("chat", async (text) => {    // (8)
```
- **(8)** **Lắng nghe** sự kiện `"chat"` từ **chính client này**. Khi client `emit("chat", ...)`, hàm trong đây chạy, `text` là dữ liệu client gửi lên.

```js
    const content = String(text || "").trim().slice(0, 500);  // (9)
    if (!content) return;                                      // (10)
```
- **(9)** "Làm sạch" dữ liệu: ép về chuỗi, bỏ khoảng trắng thừa, cắt tối đa 500 ký tự. **Không tin dữ liệu client** → luôn xử lý lại ở server.
- **(10)** Rỗng → bỏ qua, không lưu.

```js
    try {
      const message = await messageService.createMessage({  // (11)
        userId: user.id,
        content,
      });
      io.emit("chat", message);                              // (12)
    } catch (error) {                                        // (13)
      console.error("chat:", error.message);
      socket.emit("error-message", "Không gửi được tin nhắn");
    }
```
- **(11)** Lưu tin vào MySQL (gắn với `user.id`). Trả về object đã chuẩn hóa `{ id, user, text, time }`.
- **(12)** `io.emit("chat", message)` = **phát tin cho TẤT CẢ** (kể cả người gửi) → mọi client vẽ bong bóng. Người gửi cũng nhận lại để biết vẽ bong bóng bên phải.
- **(13)** Nếu lưu DB lỗi → ghi log + `socket.emit` báo lỗi **riêng cho người gửi** (không làm phiền người khác).

```js
  socket.on("disconnect", () => {              // (14)
    onlineCount = Math.max(0, onlineCount - 1);
    io.emit("online", onlineCount);
  });
}
```
- **(14)** Sự kiện `"disconnect"` tự chạy khi client **đóng tab / mất mạng**. Giảm đếm (không cho âm) rồi phát lại số online cho mọi người.

---

## 6. `public/client.js` — phía trình duyệt

```js
const socket = io();   // (1)
```
- **(1)** Mở kết nối WebSocket tới server. `io()` là hàm từ thư viện `/socket.io/socket.io.js` (nạp trong trang). Từ đây `socket` là đầu dây phía client.

```js
const messages = document.getElementById("messages");
const currentUser = messages.dataset.username;   // (2)
```
- **(2)** Lấy tên user hiện tại từ thuộc tính `data-username` (server nhúng sẵn vào HTML). Dùng để so sánh → biết tin nào "của mình".

```js
form.addEventListener("submit", (event) => {
  event.preventDefault();              // (3)
  const text = input.value.trim();
  if (!text) return;
  socket.emit("chat", text);           // (4)
  input.value = "";
});
```
- **(3)** Chặn form reload trang (hành vi mặc định của HTML form).
- **(4)** `socket.emit("chat", text)` = **gửi sự kiện `"chat"`** lên server (khớp với `socket.on("chat")` ở mục 5-(8)).

```js
socket.on("chat", ({ user, text, time }) => {   // (5)
  const mine = user === currentUser;             // (6)
  // ...tạo thẻ bong bóng, căn phải nếu mine, trái nếu không...
  messages.appendChild(wrapper);
  messages.scrollTop = messages.scrollHeight;    // (7)
});
```
- **(5)** **Lắng nghe** `"chat"` từ server (khớp với `io.emit("chat", ...)` ở mục 5-(12)). Mỗi tin mới → hàm này chạy.
- **(6)** So tên người gửi với mình → quyết định bong bóng trái/phải.
- **(7)** Cuộn xuống đáy để luôn thấy tin mới nhất.

```js
socket.on("online", (count) => {       // (8)
  online.textContent = count;
});

socket.on("error-message", (message) => alert(message));   // (9)
```
- **(8)** Nhận số online từ server → cập nhật lên giao diện.
- **(9)** Nhận thông báo lỗi riêng (từ mục 5-(13)) → hiện alert.

---

## 7. Bảng `emit` / `on` (gửi / nghe)

`emit` = **gửi** sự kiện. `on` = **nghe** sự kiện. Tên sự kiện 2 đầu phải **trùng nhau**.

| Sự kiện | Bên gửi (`emit`) | Bên nghe (`on`) | Dữ liệu |
|---------|------------------|------------------|---------|
| `chat` | client → server | server | chuỗi tin nhắn |
| `chat` | server → mọi client | client | `{ id, user, text, time }` |
| `online` | server → mọi client | client | số (đếm) |
| `error-message` | server → 1 client | client | chuỗi lỗi |
| `disconnect` | (tự động) | server | — |

### Phạm vi phát — khác nhau ai nhận

| Câu lệnh | Ai nhận |
|----------|---------|
| `socket.emit(...)` | **chỉ 1 client** đó |
| `io.emit(...)` | **TẤT CẢ** client đang kết nối |
| `socket.broadcast.emit(...)` | tất cả **trừ** người gửi |

> Dự án dùng `io.emit("chat", ...)` nên **người gửi cũng nhận lại** tin của mình → đó là lý do gửi xong bong bóng tự hiện bên phải.

---

## 8. Thuật ngữ nhanh

- **`io`**: trung tâm Socket.IO, đại diện **toàn bộ** kết nối. Dùng `io.emit` để phát cho mọi người.
- **`socket`**: **một** kết nối (một tab trình duyệt). Dùng `socket.on` để nghe, `socket.emit` để gửi riêng.
- **emit**: bắn một sự kiện kèm dữ liệu.
- **on**: đăng ký hàm chạy khi sự kiện đó tới.
- **session dùng chung**: nhờ `io.engine.use(sessionMiddleware)`, socket biết người dùng là ai mà không cần đăng nhập lại.

---

## 9. Luồng xử lý MỘT tin nhắn — từ A đến Z (tới tận DB)

Đây là toàn bộ chặng đường của 1 tin nhắn khi bấm "gửi", kèm bước **lưu database**.

```
[A] CLIENT bấm gửi
    public/client.js
    socket.emit("chat", "hello")
        │  (đi qua đường ống WebSocket)
        ▼
[B] SERVER nghe thấy
    chat.socket.js →  socket.on("chat", async (text) => { ... })
        │
        ▼
[C] LÀM SẠCH dữ liệu (không tin client)
    const content = String(text || "").trim().slice(0, 500);
    if (!content) return;          // rỗng thì bỏ
        │
        ▼
[D] GỌI SERVICE để lưu
    messageService.createMessage({ userId: user.id, content })
        │
        ▼
[E] SERVICE + MODEL nói chuyện với MySQL
    message.service.js:
      Message.create({ userId, content })          → SQL: INSERT INTO messages ...
      Message.findByPk(id, { include: User })       → SQL: SELECT ... JOIN users (lấy tên)
      return formatMessage(...)                      → { id, user, text, time }
        │
        ▼  (trả object gọn về lại socket handler)
[F] PHÁT cho TẤT CẢ
    io.emit("chat", message)        // message = { user, text, time }
        │
        ├───────────────► CLIENT A (người gửi)
        └───────────────► CLIENT B, C... (mọi người)
        ▼
[G] MỌI CLIENT vẽ bong bóng
    client.js → socket.on("chat", ({user,text,time}) => {
      const mine = user === currentUser;   // phải/trái
      messages.appendChild(bongBong);
    })
```

### Soi từng chặng kèm code

**[A] Client gửi** — [`client.js`](../public/client.js):
```js
socket.emit("chat", text);   // bỏ chuỗi tin vào key "chat", đẩy lên server
```

**[B][C] Server nghe + làm sạch** — [`chat.socket.js`](../src/sockets/chat.socket.js):
```js
socket.on("chat", async (text) => {
  const content = String(text || "").trim().slice(0, 500);  // ép chuỗi, bỏ thừa, max 500
  if (!content) return;                                     // rỗng → dừng, không lưu
```

**[D][E] Lưu DB qua service** — [`message.service.js`](../src/services/message.service.js):
```js
export async function createMessage({ userId, content }) {
  const created = await Message.create({ userId, content });     // INSERT vào bảng messages
  const messageWithUser = await Message.findByPk(created.id, {   // lấy lại + JOIN user
    include: [{ model: User, as: "user", attributes: ["username"] }],
  });
  return formatMessage(messageWithUser);    // → { id, user, text, time } (gọn để gửi đi)
}
```
> Vì sao phải `findByPk` lại sau khi `create`? Để **JOIN lấy `username`** của người gửi — dữ liệu phát đi cần có tên hiển thị, không chỉ `userId`.

**[F] Phát cho mọi người** — [`chat.socket.js`](../src/sockets/chat.socket.js):
```js
  const message = await messageService.createMessage({ userId: user.id, content });
  io.emit("chat", message);   // io = phát cho TẤT CẢ kết nối đang mở
```

**[G] Mọi client nhận & vẽ** — [`client.js`](../public/client.js):
```js
socket.on("chat", ({ user, text, time }) => {
  const mine = user === currentUser;   // tin của mình? → bong bóng phải, không thì trái
  // ...tạo thẻ, appendChild vào #messages, cuộn xuống đáy
});
```

### Nếu lưu DB lỗi thì sao?
```js
} catch (error) {
  console.error("chat:", error.message);
  socket.emit("error-message", "Không gửi được tin nhắn");  // báo RIÊNG người gửi
}
```
→ Lỗi DB thì **không** `io.emit` (không phát tin hỏng cho ai), chỉ `socket.emit` báo lỗi cho đúng người vừa gửi.

> **Khác với HTTP:** ở đây không có `req`/`res`/`res.render`. Socket nhận dữ liệu qua tham số callback (`text`), xử lý, rồi `emit` đẩy ngược ra — không "trả response" như request HTTP.

---

## 10. Tin CŨ vs tin MỚI — cùng đổ vào `#messages`

Khung chat `#messages` được **2 nguồn khác nhau** đổ tin vào. Đây là chỗ hay nhầm "controller có render lại không".

```
GIAI ĐOẠN 1 — LÚC MỞ TRANG (chạy 1 LẦN, ở SERVER)
   GET /  →  HomeController.index  →  res.render("index", { messages })
                                              │
                                              ▼
   index.ejs:  <% messages.forEach(...) %>   ← EJS chạy Ở SERVER, đổ 50 tin CŨ thành HTML
                                              │
                                              ▼
   Trình duyệt nhận HTML đã có sẵn 50 bong bóng cũ.   ✅ controller XONG việc.


GIAI ĐOẠN 2 — KHI CÓ TIN MỚI (realtime, KHÔNG qua controller)
   ai đó gửi  →  server  io.emit("chat", message)
                                              │
                                              ▼
   client.js:  socket.on("chat", ...) → messages.appendChild(bongBongMới)
                                              │
                                              ▼
   Bong bóng mới chèn THẲNG vào DOM.  ❌ KHÔNG render lại, ❌ KHÔNG gọi controller.
```

### Mấu chốt
- `<% messages.forEach %>` trong [`index.ejs`](../src/views/index.ejs) chạy **trên server, đúng 1 lần** lúc mở trang → biến mảng `messages` (controller đưa) thành HTML tĩnh.
- Khi HTML đã tới trình duyệt thì **EJS không chạy lại được nữa**, controller cũng không bị gọi lại (trừ khi F5).
- Tin **mới** không đến từ EJS/controller — nó do **client.js** chèn thẳng vào DOM.

### Cả hai cùng ghi vào MỘT khung `#messages`

EJS đổ tin cũ vào — [`index.ejs`](../src/views/index.ejs):
```html
<div id="messages" ...>
  <% messages.forEach(function (message) { %>   <!-- 50 tin cũ, render Ở SERVER -->
    ...bong bóng...
  <% }); %>
</div>
```

client.js chèn tin mới vào CHÍNH khung đó — [`client.js`](../public/client.js):
```js
const messages = document.getElementById("messages");  // lấy đúng <div id="messages">
socket.on("chat", (...) => {
  const wrapper = document.createElement("div");        // tạo bong bóng mới
  messages.appendChild(wrapper);                        // CHÈN vào cuối khung
});
```

### Bảng so sánh

| | Tin CŨ (lịch sử) | Tin MỚI (realtime) |
|---|---|---|
| Nguồn | controller → `res.render` | socket → `client.js` |
| Ai dựng HTML | EJS (server) | JavaScript (trình duyệt) |
| Khi nào | 1 lần lúc mở trang | mỗi khi có tin, tức thì |
| Controller chạy lại? | — | **KHÔNG** |

> **Ví von:** `<% forEach %>` = in sẵn mấy dòng cũ lên giấy rồi đưa bạn (1 lần, ở nhà in = server).
> Tin mới = bạn cầm bút viết thêm dòng vào tờ giấy đó (client.js viết thẳng lên DOM) — không in lại tờ mới (không gọi controller).

---

## 11. Tóm tắt 1 câu

> Trình duyệt mở **một đường ống WebSocket** tới server và để đó. Ai gửi tin → server **làm sạch → lưu DB (qua service/model) → `io.emit` phát lại cho toàn bộ** đường ống đang mở → mọi người thấy ngay, không cần F5.
