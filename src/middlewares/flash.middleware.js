// Flash message: thông báo hiển thị đúng 1 lần sau redirect
export function flash(req, res, next) {
  // Đưa flash hiện có ra view rồi xóa khỏi session
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;

  // Helper set flash cho request kế tiếp
  req.flash = (type, message) => {
    req.session.flash = { type, message };
  };

  next();
}
