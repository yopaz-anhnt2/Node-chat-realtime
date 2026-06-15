const TZ = "Asia/Ho_Chi_Minh";

// Khoá ngày dạng "2026-06-12" (theo giờ VN) để so sánh 2 tin có cùng ngày không
export function dateKey(time) {
  return new Date(time).toLocaleDateString("en-CA", { timeZone: TZ });
}

// Nhãn ngày hiển thị: "Hôm nay" / "Hôm qua" / "dd/mm/yyyy"
export function dateLabel(time) {
  const key = dateKey(time);
  const today = dateKey(Date.now());
  const yesterday = dateKey(Date.now() - 86400000); // trừ 1 ngày
  if (key === today) return "Hôm nay";
  if (key === yesterday) return "Hôm qua";
  return new Date(time).toLocaleDateString("vi-VN", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
