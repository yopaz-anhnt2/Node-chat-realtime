# Deploy lên server (systemd)

Giả sử: Ubuntu/Debian, đã có **Node 18+**, **MySQL**, **git**.
Thư mục dự án ví dụ: `/var/www/node-chat-realtime`. Service tên: **chat-node**.

---

## 1. Lần đầu (setup)

```bash
# Cài Node (nếu chưa) — ví dụ Node 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git

# Lấy code
sudo mkdir -p /var/www && cd /var/www
sudo git clone <repo-url> node-chat-realtime
cd node-chat-realtime
sudo chown -R $USER:$USER /var/www/node-chat-realtime

# Tạo .env (điền DB, SESSION_SECRET thật)
cp .env.example .env
nano .env

# Tạo database trong MySQL
mysql -u root -p -e "CREATE DATABASE chat_realtime CHARACTER SET utf8mb4;"

# Cài + build + tạo bảng + seed user demo
npm ci
npm run build:css
npm run db:migrate
npm run db:seed          # tạo admin / 123456 (tuỳ chọn)
```

## 2. Tạo systemd service

```bash
sudo cp deploy/chat-node.service /etc/systemd/system/chat-node.service
which node                                    # lấy đường dẫn node -> dán vào ExecStart
sudo nano /etc/systemd/system/chat-node.service   # sửa User, WorkingDirectory, ExecStart

sudo systemctl daemon-reload
sudo systemctl enable --now chat-node         # bật + chạy luôn, tự chạy lại khi reboot
sudo systemctl status chat-node
journalctl -u chat-node -f                     # xem log realtime
```

App giờ chạy ở `http://<server-ip>:3000`.

## 3. Nginx + HTTPS (khuyến nghị)

```nginx
# /etc/nginx/sites-available/chat-node
server {
    listen 80;
    server_name chat.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        # >>> 2 dòng cho WebSocket (Socket.IO) — xem giải thích mục 6 <<<
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/chat-node /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d chat.example.com      # tự cấp HTTPS
```

## 4. Deploy lần sau (1 lệnh)

```bash
cd /var/www/node-chat-realtime
./deploy.sh
```

Script làm: `git pull` → `npm ci` → `build:css` → `db:migrate` → `systemctl restart chat-node`.
Bước nặng chạy trước, chỉ restart ở cuối nên gián đoạn ~1-2s (Socket.IO tự kết nối lại).

### Cho phép restart không cần mật khẩu sudo

```bash
sudo visudo -f /etc/sudoers.d/chat-node-deploy
# dán (đổi <deploy-user> thành user chạy deploy):
<deploy-user> ALL=(ALL) NOPASSWD: /bin/systemctl restart chat-node, /bin/systemctl status chat-node
```

---

## 5. Lệnh hữu ích

```bash
sudo systemctl restart chat-node    # khởi động lại
sudo systemctl stop chat-node       # dừng
journalctl -u chat-node -f          # xem log realtime
```

---

## 6. Vì sao cần 2 dòng `Upgrade` / `Connection` cho WebSocket?

```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

**Bối cảnh:** Socket.IO (chat realtime) chạy trên **WebSocket**. Một kết nối WebSocket
bắt đầu bằng request HTTP bình thường, kèm 2 header xin "nâng cấp" lên giao thức WebSocket:

```
Upgrade: websocket
Connection: Upgrade
```

**Vấn đề:** Nginx khi làm reverse proxy mặc định **cắt bỏ** các header kiểu "hop-by-hop"
(trong đó có `Upgrade`, `Connection`) khi chuyển tiếp xuống Node. Nếu bị cắt, cái bắt tay
nâng cấp **không tới được** Node → WebSocket thất bại.

**2 dòng đó để làm gì:**
- `proxy_set_header Upgrade $http_upgrade;` — chuyển tiếp đúng header `Upgrade` mà client gửi
  (`$http_upgrade` = giá trị header Upgrade của request gốc).
- `proxy_set_header Connection "upgrade";` — ép header `Connection: upgrade` để Nginx hiểu
  đây là kết nối cần giữ và nâng cấp, không đóng lại.

**Nếu thiếu 2 dòng này:** kết nối WebSocket bị từ chối → Socket.IO **tự tụt xuống** kiểu
"long-polling" (gọi HTTP liên tục) — vẫn chạy nhưng **chậm, tốn tài nguyên**, có khi lỗi.
Có 2 dòng này thì WebSocket bắt tay thành công → realtime mượt.

> Tóm tắt: chúng **mở đường cho cái bắt tay WebSocket** đi xuyên qua Nginx tới Node.
