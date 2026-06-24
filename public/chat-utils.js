const CHAT_TZ = "Asia/Ho_Chi_Minh";

// Khoá ngày "2026-06-12" theo giờ VN (để so 2 tin cùng ngày)
function chatDateKey(time) {
  return new Date(time).toLocaleDateString("en-CA", { timeZone: CHAT_TZ });
}

// Nhãn ngày: "Hôm nay" / "Hôm qua" / "dd/mm/yyyy"
function chatDateLabel(time) {
  const key = chatDateKey(time);
  const today = chatDateKey(Date.now());
  const yesterday = chatDateKey(Date.now() - 86400000);
  if (key === today) return "Hôm nay";
  if (key === yesterday) return "Hôm qua";
  return new Date(time).toLocaleDateString("vi-VN", {
    timeZone: CHAT_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Chèn dải ngày vào cuối khung tin
function appendDateHeader(container, time) {
  const wrap = document.createElement("div");
  wrap.className = "flex justify-center my-2";
  wrap.innerHTML = `<span class="text-[11px] text-gray-500 bg-gray-200 rounded-full px-3 py-0.5">${chatDateLabel(time)}</span>`;
  container.appendChild(wrap);
}

// Ô nhập textarea: Enter để gửi, Shift+Enter xuống dòng, tự giãn cao (tối đa 120px)
function setupChatTextarea(textarea, form) {
  function autoGrow() {
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  }
  textarea.addEventListener("input", autoGrow);
  textarea.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault(); // không xuống dòng -> gửi luôn
      form.requestSubmit();
    }
  });
}

// Xoá nội dung + thu nhỏ lại 1 dòng sau khi gửi
function resetChatTextarea(textarea) {
  textarea.value = "";
  textarea.style.height = "auto";
}
