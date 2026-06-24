const socket = window.appSocket; // socket dùng chung (tạo ở notifications.js)

const form = document.getElementById("form");
const input = document.getElementById("input");
const messages = document.getElementById("messages");
const online = document.getElementById("online");
const typing = document.getElementById("typing");
const currentUser = messages.dataset.username;

// Cuộn xuống cuối khi mở trang (lịch sử do EJS render sẵn)
messages.scrollTop = messages.scrollHeight;

// Ô nhập: Enter gửi, Shift+Enter xuống dòng, tự giãn cao
setupChatTextarea(input, form);

// Gửi tin nhắn
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  socket.emit("chat", text);
  socket.emit("stop-typing"); // gửi xong thì hết gõ
  clearTimeout(typingTimer);
  resetChatTextarea(input);
});

// Báo "đang gõ" khi nhập, tự tắt sau 1.5s ngừng gõ
let typingTimer = null;
input.addEventListener("input", () => {
  socket.emit("typing");
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => socket.emit("stop-typing"), 1500);
});

// Nhận tin nhắn mới realtime
let lastUser = null;
let lastTime = null;
let lastDate = messages.dataset.lastDate || "";
socket.on("chat", ({ user, text, time }) => {
  // Sang ngày mới -> chèn dải ngày + reset gộp nhóm
  const curDate = chatDateKey(time);
  if (curDate !== lastDate) {
    appendDateHeader(messages, time);
    lastDate = curDate;
    lastUser = null;
    lastTime = null;
  }

  const mine = user === currentUser;
  const formattedTime = new Date(time).toLocaleTimeString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
  });
  // Cùng người + cùng phút thì không hiện lại meta (gộp nhóm)
  const showMeta = user !== lastUser || formattedTime !== lastTime;
  lastUser = user;
  lastTime = formattedTime;

  const wrapper = document.createElement("div");
  wrapper.className = "flex flex-col " + (mine ? "items-end" : "items-start");

  if (mine) {
    const meta = showMeta
      ? `<span class="text-[11px] text-gray-400 mb-0.5 mr-1">${formattedTime}</span>`
      : "";
    wrapper.innerHTML = `${meta}<div class="max-w-[78%] px-3.5 py-2 rounded-2xl rounded-br-md bg-[#6001D2] text-white text-sm whitespace-pre-wrap wrap-break-word">${escapeHtml(text)}</div>`;
  } else {
    const meta = showMeta
      ? `<span class="text-[11px] text-gray-500 mb-0.5 ml-1">${escapeHtml(user)} · ${formattedTime}</span>`
      : "";
    wrapper.innerHTML = `${meta}<div class="max-w-[78%] px-3.5 py-2 rounded-2xl rounded-bl-md bg-white border border-gray-200 text-gray-800 text-sm whitespace-pre-wrap wrap-break-word">${escapeHtml(text)}</div>`;
  }

  messages.appendChild(wrapper);
  messages.scrollTop = messages.scrollHeight;
});

socket.on("online", (count) => {
  online.textContent = count;
});

socket.on("error-message", (message) => alert(message));

// (Thông báo kết bạn đã chuyển sang notifications.js — chạy ở mọi trang)

// Hiển thị "đang gõ" của người khác
const typingUsers = new Set();

socket.on("typing", (name) => {
  typingUsers.add(name);
  renderTyping();
});

socket.on("stop-typing", (name) => {
  typingUsers.delete(name);
  renderTyping();
});

function renderTyping() {
  const names = [...typingUsers];
  if (names.length === 0) {
    typing.textContent = "";
  } else if (names.length === 1) {
    typing.textContent = `${names[0]} đang gõ...`;
  } else if (names.length === 2) {
    typing.textContent = `${names[0]} và ${names[1]} đang gõ...`;
  } else {
    typing.textContent = "Nhiều người đang gõ...";
  }
}

function escapeHtml(text) {
  const element = document.createElement("div");
  element.textContent = text;
  return element.innerHTML;
}
