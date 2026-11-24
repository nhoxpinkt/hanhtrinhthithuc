# Hành Trình Vệ Thần Tri Thức

Trò chơi giáo dục 2.5D sử dụng **HTML5 Canvas**, **JavaScript thuần** và hệ thống **2D Skeletal Animation (Rigging)** phong cách Pixar 3D Cute, hoạt động hoàn toàn trên trình duyệt (không cần backend, không cần cài đặt) và sẵn sàng triển khai lên **GitHub Pages** qua **GitHub Actions**.

## Cấu trúc thư mục

```text
hanh-trinh-ve-than-tri-thuc/
├── index.html                    # Điểm khởi chạy ứng dụng (tỷ lệ 16:9)
├── css/style.css                 # Giao diện, HUD, bảng câu hỏi & quản lý giáo viên
├── js/
│   ├── config.js                 # Cấu hình tập trung & trạng thái (STATES)
│   ├── assetManager.js           # Tải hình ảnh, skeleton.json, animations.json
│   ├── audioManager.js           # Quản lý nhạc nền & hiệu ứng âm thanh
│   ├── skeletalEngine.js         # Bộ điều khiển xương 2D (Easing, Blend, Secondary Motion)
│   ├── questionManager.js        # Quản lý câu hỏi, LocalStorage, Import/Export JSON/CSV
│   ├── uiManager.js              # Điều khiển màn hình, HUD & CRUD câu hỏi
│   ├── gameEngine.js             # Vòng lặp game, vật lý nhảy, combat & combo
│   └── main.js                   # Khởi tạo ứng dụng và gắn sự kiện
├── assets/
│   ├── characters/
│   │   ├── player/               # Bé Mầm (parts/*.png, skeleton.json, animations.json)
│   │   └── enemies/              # shroomy/ và mossy/ (parts/*.png, skeleton.json, animations.json)
│   ├── images/                   # Bối cảnh 2.5D Parallax & vật phẩm
│   └── audio/                    # Nhạc nền & hiệu ứng âm thanh (.wav)
├── data/
│   ├── config.json               # Cấu hình cấp độ, điểm thưởng, thời gian
│   └── questions.json            # 30 câu hỏi trắc nghiệm tiếng Việt mẫu
├── docs/KIEN_TRUC_GAME.md        # Tài liệu kỹ thuật hệ thống
├── .github/workflows/deploy.yml  # Workflow triển khai tự động GitHub Pages
├── HUONG_DAN_THAY_TAI_NGUYEN.md  # Hướng dẫn thay nhân vật, âm thanh, câu hỏi
└── HUONG_DAN_GITHUB_PAGES.md     # Hướng dẫn từng bước đưa lên GitHub Pages
```

## Cách chạy thử trên máy cá nhân

Do trình duyệt chặn `fetch()` khi mở trực tiếp file `file://`, bạn hãy chạy bằng một web server tĩnh bất kỳ:

```bash
python3 -m http.server 8080
```

Sau đó mở trình duyệt tại `http://localhost:8080`.

## Cập nhật nội dung nhanh

- **Giáo viên**: Mở trực tiếp mục **Quản lý câu hỏi (Giáo viên)** ngay trong game để thêm, sửa, xóa, hoặc nhập/xuất file `.json` / `.csv`.
- **Cập nhật mã nguồn trên GitHub**: Thay file mới trong thư mục dự án, commit và push lên nhánh `main` — GitHub Actions sẽ tự động triển khai bản mới trong ~1 phút.
