// Libraries
import { validationResult } from "express-validator";

// Tạo middleware: nếu validate lỗi -> render lại view kèm lỗi + dữ liệu cũ.
// Truyền sẵn tên view và title để dùng lại cho nhiều route.
export function handleValidation(view, title) {
  return (req, res, next) => {
    const result = validationResult(req);
    if (result.isEmpty()) return next();

    res.status(422).render(view, {
      title,
      errors: result.array().map((item) => item.msg),
      old: req.body,
    });
  };
}
