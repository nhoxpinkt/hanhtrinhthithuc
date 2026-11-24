# Kiến Trúc Kỹ Thuật Trò Chơi

## 1. Luồng trạng thái (State Machine)
Trò chơi quản lý trạng thái tập trung qua `window.VTTT.STATES`:
- `MENU`: Trang chủ hiển thị điểm cao và số câu hỏi hiện có.
- `GUIDE`, `SETTINGS`, `TEACHER`: Các màn hình chức năng.
- `PLAYING`: Đang chạy trên sân khấu Canvas 2D và đối đầu câu hỏi.
- `PAUSED`: Tạm dừng vòng lặp cập nhật và đồng hồ đếm ngược.
- `VICTORY` / `GAME_OVER`: Tổng kết kết quả và lưu điểm cao.

## 2. Hệ thống Skeletal Rigging (`js/skeletalEngine.js`)
- Mỗi nhân vật gồm 3 thành phần độc lập: `parts/*.png`, `skeleton.json`, `animations.json`.
- `SkeletalRig` tính toán ma trận biến đổi 2D (`DOMMatrix`) theo cây phân cấp xương cha-con, nội suy keyframe bằng hàm `easeInOut`, trộn chuyển động (`blendDuration = 0.16s`), tạo chuyển động phụ (`spring` / `lag`) và chớp mắt tự động.

## 3. Tính toàn vẹn câu hỏi (`js/questionManager.js` & `js/gameEngine.js`)
- Biến `questionLocked` đảm bảo mỗi câu hỏi chỉ được chấm đúng 1 lần duy nhất dù người chơi bấm liên tục hoặc hết giờ trùng lúc bấm.
- Dữ liệu lưu trong `localStorage` luôn được bọc trong `try/catch` và tự khôi phục từ `data/questions.json` nếu bị lỗi định dạng.
