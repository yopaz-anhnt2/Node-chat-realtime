const socket = window.appSocket; // socket dùng chung (tạo ở notifications.js)

const form = document.getElementById("form");
const input = document.getElementById("input");
const messages = document.getElementById("messages");
const dmStatus = document.getElementById("dm-status");
const meId = Number(messages.dataset.me);
const friendId = Number(messages.dataset.friend);

// Cuộn xuống cuối khi mở trang
messages.scrollTop = messages.scrollHeight;

// Đang mở hội thoại -> báo ĐÃ XEM các tin của bạn
socket.emit("dm-seen", { otherId: friendId });

function setDmStatus(text) {
  if (dmStatus) dmStatus.textContent = text;
}

// Gửi tin riêng
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  socket.emit("dm", { toUserId: friendId, text });
  input.value = "";
});

// Nhận tin riêng realtime
let lastSender = null;
let lastTime = null;
let lastDate = messages.dataset.lastDate || "";
socket.on("dm", (message) => {
  // Chỉ hiện tin thuộc đúng hội thoại đang mở (giữa mình và người bạn này)
  const involvesFriend =
    message.senderId === friendId || message.receiverId === friendId;
  if (!involvesFriend) return;

  // Sang ngày mới -> chèn dải ngày + reset gộp nhóm
  const curDate = chatDateKey(message.time);
  if (curDate !== lastDate) {
    appendDateHeader(messages, message.time);
    lastDate = curDate;
    lastSender = null;
    lastTime = null;
  }

  const mine = message.senderId === meId;
  const formattedTime = new Date(message.time).toLocaleTimeString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
  });
  // Cùng người + cùng phút thì gộp, không hiện lại giờ
  const showMeta = message.senderId !== lastSender || formattedTime !== lastTime;
  lastSender = message.senderId;
  lastTime = formattedTime;

  const wrapper = document.createElement("div");
  wrapper.className = "flex flex-col " + (mine ? "items-end" : "items-start");

  const align = mine ? "mr-1" : "ml-1";
  const bubble = mine
    ? "rounded-br-md bg-[#6001D2] text-white"
    : "rounded-bl-md bg-white border border-gray-200 text-gray-800";

  const meta = showMeta
    ? `<span class="text-[11px] text-gray-400 mb-0.5 ${align}">${formattedTime}</span>`
    : "";
  wrapper.innerHTML = `${meta}<div class="max-w-[78%] px-3.5 py-2 rounded-2xl ${bubble} text-sm wrap-break-word">${escapeHtml(message.text)}</div>`;

  messages.appendChild(wrapper);
  messages.scrollTop = messages.scrollHeight;

  // Cập nhật trạng thái theo tin cuối
  if (mine) {
    setDmStatus("Đã gửi");
  } else {
    setDmStatus(""); // tin cuối là của bạn -> không hiện trạng thái
    socket.emit("dm-seen", { otherId: friendId }); // đang xem -> báo đã xem
  }
});

// Bạn đã nhận / đã xem tin của mình -> cập nhật trạng thái
socket.on("dm-status", ({ from, status }) => {
  if (from !== friendId) return;
  setDmStatus(status === "seen" ? "Đã xem" : "Đã nhận");
});

socket.on("error-message", (message) => alert(message));

function escapeHtml(text) {
  const element = document.createElement("div");
  element.textContent = text;
  return element.innerHTML;
}
