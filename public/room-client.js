const socket = window.appSocket; // socket dùng chung (tạo ở notifications.js)

const form = document.getElementById("form");
const input = document.getElementById("input");
const messages = document.getElementById("messages");
const inviteBtn = document.getElementById("invite-btn");
const roomId = Number(messages.dataset.room);
const meId = Number(messages.dataset.me);

// Vào phòng socket + cuộn xuống cuối
socket.emit("join-room", roomId);
messages.scrollTop = messages.scrollHeight;

// ----- Ai đã xem -----
const roomSeen = document.getElementById("room-seen");
let lastMessageId = Number(roomSeen.dataset.lastId) || 0;
let lastSenderId = Number(roomSeen.dataset.lastSender) || 0;
const reads = new Map(); // userId -> { username, lastReadId }
JSON.parse(roomSeen.dataset.reads || "[]").forEach((r) =>
  reads.set(r.userId, { username: r.username, lastReadId: r.lastReadId })
);

// Đang mở phòng -> báo đã đọc tới tin mới nhất
socket.emit("room-read", roomId);

function renderSeen() {
  const names = [];
  for (const [uid, info] of reads) {
    if (uid !== lastSenderId && uid !== meId && info.lastReadId >= lastMessageId) {
      names.push(info.username);
    }
  }
  roomSeen.textContent = names.length ? "Đã xem: " + names.join(", ") : "";
}

// Ai đó vừa đọc -> cập nhật
socket.on("room-read", ({ userId, username, lastReadMessageId }) => {
  reads.set(userId, { username, lastReadId: lastReadMessageId });
  renderSeen();
});

// Gửi tin cho cả phòng
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  socket.emit("room-message", { roomId, text });
  input.value = "";
});

// Nhận tin realtime của phòng
let lastUser = null;
let lastTime = null;
let lastDate = messages.dataset.lastDate || "";
socket.on("room-message", ({ id, userId, user, text, time }) => {
  // Sang ngày mới -> chèn dải ngày + reset gộp nhóm
  const curDate = chatDateKey(time);
  if (curDate !== lastDate) {
    appendDateHeader(messages, time);
    lastDate = curDate;
    lastUser = null;
    lastTime = null;
  }

  const mine = userId === meId;
  const formattedTime = new Date(time).toLocaleTimeString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
  });
  // Cùng người + cùng phút thì gộp, không hiện lại meta
  const showMeta = userId !== lastUser || formattedTime !== lastTime;
  lastUser = userId;
  lastTime = formattedTime;

  const wrapper = document.createElement("div");
  wrapper.className = "flex flex-col " + (mine ? "items-end" : "items-start");

  if (mine) {
    const meta = showMeta
      ? `<span class="text-[11px] text-gray-400 mb-0.5 mr-1">${formattedTime}</span>`
      : "";
    wrapper.innerHTML = `${meta}<div class="max-w-[78%] px-3.5 py-2 rounded-2xl rounded-br-md bg-[#6001D2] text-white text-sm wrap-break-word">${escapeHtml(text)}</div>`;
  } else {
    const meta = showMeta
      ? `<span class="text-[11px] text-gray-500 mb-0.5 ml-1">${escapeHtml(user)} · ${formattedTime}</span>`
      : "";
    wrapper.innerHTML = `${meta}<div class="max-w-[78%] px-3.5 py-2 rounded-2xl rounded-bl-md bg-white border border-gray-200 text-gray-800 text-sm wrap-break-word">${escapeHtml(text)}</div>`;
  }

  messages.appendChild(wrapper);
  messages.scrollTop = messages.scrollHeight;

  // Cập nhật "ai đã xem" theo tin mới nhất + tự báo mình đã đọc
  lastMessageId = id || lastMessageId;
  lastSenderId = userId;
  renderSeen();
  socket.emit("room-read", roomId);
});

// Thông báo hệ thống (vào/rời/bị đuổi) — dòng xám giữa khung
socket.on("room-system", ({ text }) => {
  const line = document.createElement("div");
  line.className = "text-center text-[11px] text-gray-400 my-1";
  line.textContent = text;
  messages.appendChild(line);
  messages.scrollTop = messages.scrollHeight;
});

// Bị đuổi khỏi phòng đang mở -> tự thoát ra
socket.on("kicked-from-room", (id) => {
  if (id === roomId) {
    alert("Bạn đã bị đưa ra khỏi phòng.");
    window.location.href = "/rooms";
  }
});

socket.on("error-message", (message) => alert(message));

// Copy link mời vào clipboard
inviteBtn.addEventListener("click", async () => {
  const link = `${window.location.origin}/rooms/join/${inviteBtn.dataset.code}`;
  try {
    await navigator.clipboard.writeText(link);
    alert("Đã copy link mời:\n" + link);
  } catch {
    prompt("Copy link mời này:", link);
  }
});

function escapeHtml(text) {
  const element = document.createElement("div");
  element.textContent = text;
  return element.innerHTML;
}
