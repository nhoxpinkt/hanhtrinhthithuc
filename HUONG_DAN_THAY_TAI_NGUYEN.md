# Hướng Dẫn Thay Tài Nguyên (Hình Ảnh, Âm Thanh, Câu Hỏi)

Dự án được thiết kế tách biệt hoàn toàn giữa **dữ liệu**, **tài nguyên** và **logic**, giúp bạn thay đổi nội dung mà không cần sửa code JavaScript.

## 1. Thay bộ câu hỏi mặc định
1. Mở file `data/questions.json`.
2. Giữ nguyên cấu trúc mỗi câu hỏi:
   ```json
   {
     "id": "q01",
     "category": "Môn học",
     "question": "Nội dung câu hỏi?",
     "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
     "correctIndex": 0,
     "explanation": "Giải thích ngắn (tùy chọn)"
   }
   ```
   Trong đó `correctIndex` nhận giá trị `0` (A), `1` (B), `2` (C), hoặc `3` (D).
3. **Cách nhanh hơn cho giáo viên**: Nhấn nút **Quản lý câu hỏi (Giáo viên)** ngay trên màn hình chính để thêm/sửa hoặc **Nhập JSON/CSV** trực tiếp trên trình duyệt.

## 2. Thay hình ảnh nhân vật & giữ nguyên Skeletal Rigging
- Nhân vật chính nằm tại: `assets/characters/player/parts/`
- Quái vật nằm tại: `assets/characters/enemies/shroomy/parts/` và `assets/characters/enemies/mossy/parts/`
- Để thay ngoại hình nhân vật mà không phải viết lại hoạt ảnh, bạn chỉ cần thay các file `.png` trong thư mục `parts/` (giữ nguyên tên file và nền trong suốt).
- Nếu muốn chỉnh vị trí khớp xương hoặc độ xoay, chỉnh trực tiếp trong `skeleton.json` và `animations.json` của nhân vật đó.

## 3. Thay bối cảnh 2.5D và vật phẩm
Thay các file trong `assets/images/` (khuyến nghị giữ đúng tỷ lệ 1280×720 cho ảnh nền):
- `bg_sky.png`: Bầu trời
- `bg_mountains.png`: Dãy núi xa
- `bg_trees_far.png`, `bg_trees_near.png`: Rừng cây 2 lớp
- `ground_tile.png`: Mặt đất nối liền (512×160)
- `star_knowledge.png`, `heart_gem.png`, `shield_orb.png`: Vật phẩm

## 4. Thay âm thanh
Thay các file `.wav` trong `assets/audio/` giữ nguyên tên file:
- `bgm_forest.wav` (nhạc nền)
- `click.wav`, `jump.wav`, `correct.wav`, `wrong.wav`, `attack.wav`, `hurt.wav`, `victory.wav`, `defeat.wav`
