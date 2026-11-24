# Hướng Dẫn Đưa Game Lên GitHub & Triển Khai Tự Động Bằng GitHub Pages

Tài liệu này dành cho thầy/cô và người dùng không chuyên lập trình. File cấu hình tự động `.github/workflows/deploy.yml` đã được tạo sẵn trong dự án.

## Bước 1: Tạo Repository trên GitHub
1. Đăng nhập vào [GitHub](https://github.com).
2. Nhấn nút **+** ở góc trên bên phải -> chọn **New repository**.
3. Đặt tên repository (ví dụ: `hanh-trinh-ve-than-tri-thuc`).
4. Chọn **Public**, sau đó nhấn **Create repository**.

## Bước 2: Đưa toàn bộ mã nguồn lên GitHub
Bạn có thể chọn **1 trong 2 cách**:

### Cách A: Tải trực tiếp trên trình duyệt (Không cần cài Git)
1. Giải nén file `.zip` dự án ra máy tính.
2. Trong repository vừa tạo, nhấn **uploading an existing file**.
3. Kéo thả toàn bộ các file và thư mục bên trong thư mục dự án (bao gồm cả thư mục ẩn `.github`, `index.html`, `css`, `js`, `assets`, `data`...) vào khung tải lên.
   > **Lưu ý quan trọng**: Nếu tải bằng trình duyệt trên Windows/Mac, hãy bật hiển thị file ẩn để đảm bảo thư mục `.github/workflows/deploy.yml` cũng được tải lên.
4. Nhấn **Commit changes** (mặc định lên nhánh `main`).

### Cách B: Dùng dòng lệnh Git
```bash
git init
git add .
git commit -m "Khoi tao tro choi giao duc"
git branch -M main
git remote add origin https://github.com/<ten-tai-khoan>/<ten-repo>.git
git push -u origin main
```

## Bước 3: Bật GitHub Pages bằng GitHub Actions
1. Vào repository trên GitHub -> chọn tab **Settings**.
2. Ở menu bên trái, chọn **Pages**.
3. Tại mục **Build and deployment** -> phần **Source**, đổi từ *Deploy from a branch* sang **GitHub Actions**.

## Bước 4: Kiểm tra trạng thái triển khai
1. Chuyển sang tab **Actions** trên repository.
2. Bạn sẽ thấy workflow **Triển khai lên GitHub Pages** đang chạy (màu vàng) hoặc đã xong (dấu tích xanh).
   - Nếu mới bật Pages lần đầu và chưa thấy chạy, bạn có thể nhấn vào tên workflow ở cột trái -> chọn **Run workflow** -> **Run workflow** để chạy thủ công.
3. Khi có dấu tích xanh, đường link trang web sẽ hiện ngay dưới bước `deploy` (dạng `https://<ten-tai-khoan>.github.io/<ten-repo>/`).

## Bước 5: Cập nhật trò chơi sau này
- Mỗi khi bạn sửa bộ câu hỏi `data/questions.json` hoặc thay hình ảnh/âm thanh rồi **commit & push** lên nhánh `main`, GitHub Actions sẽ tự động chạy lại và cập nhật trang web mới.

## Xử lý các lỗi thường gặp
1. **Lỗi 404 (Page not found)**:
   - Kiểm tra xem trong **Settings -> Pages** đã chọn Source là **GitHub Actions** chưa.
   - Đảm bảo file `index.html` nằm ngay ở thư mục gốc của repository (không bị lồng thêm một thư mục cha ở ngoài).
2. **Lỗi mất hình ảnh hoặc không tải được câu hỏi**:
   - Toàn bộ dự án đã dùng đường dẫn tương đối (`./assets/...`, `./data/...`), nên chạy được trên mọi tên repository. Nếu bạn tự sửa đường dẫn, tuyệt đối không bắt đầu bằng dấu `/` (ví dụ `/assets/...`) vì sẽ sai đường dẫn khi chạy dưới `/<ten-repo>/`.
3. **Workflow thất bại (dấu X đỏ)**:
   - Mở tab **Actions**, bấm vào lần chạy bị lỗi để xem thông báo.
   - Kiểm tra **Settings -> Actions -> General -> Workflow permissions** đã bật quyền **Read and write permissions** (hoặc dùng mặc định quyền `pages: write` trong file `deploy.yml`).
