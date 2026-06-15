// Socket DÙNG CHUNG cho toàn app — các trang chat tái dùng window.appSocket
// (tránh mỗi trang tạo 1 socket riêng -> đếm online sai).
window.appSocket = io();

(function () {
  const socket = window.appSocket;

  // Có người gửi lời mời kết bạn
  socket.on("friend-request", ({ from, count }) => {
    const badge = document.getElementById("friend-badge");
    if (badge) {
      badge.textContent = count;
      badge.classList.remove("hidden");
    }
    showToast(`${from} đã gửi lời mời kết bạn 👋`);
    if (location.pathname === "/friends") location.reload();
  });

  // Lời mời của mình được chấp nhận
  socket.on("friend-accepted", ({ from }) => {
    showToast(`${from} đã chấp nhận lời mời kết bạn 🎉`);
    if (location.pathname === "/friends") location.reload();
  });

  // Nhận được tin riêng (ở bất kỳ trang nào) -> báo "đã nhận" cho người gửi
  socket.on("dm", (message) => {
    if (
      message.receiverId === window.currentUserId &&
      message.senderId !== window.currentUserId
    ) {
      socket.emit("dm-delivered", { otherId: message.senderId });
    }
  });

  // Toast nổi giữa trên, tự ẩn sau 4s
  function showToast(message) {
    const toast = document.createElement("div");
    toast.className =
      "fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm text-white shadow-lg bg-[#6001D2]";
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }
})();
