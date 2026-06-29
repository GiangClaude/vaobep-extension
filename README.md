1. Hướng dẫn Cấu hình (Trước khi cài đặt)

Bước 1: Tạo file cấu hình
Trong thư mục vaobep-extension, bạn sẽ thấy một file mẫu tên là config.example.js. Hãy copy file này và đổi tên thành config.js.
(Lưu ý: File config.js đã được cho vào .gitignore để tránh bị đẩy nhầm lên Github).
Bước 2: Cập nhật đường dẫn API
Mở file config.js vừa tạo và chỉnh sửa lại đường dẫn trỏ về Backend/Frontend của bạn (Localhost hoặc Server thật):

Hướng dẫn Cài đặt lên Chrome (Load Unpacked)

Vì đây là bản phát triển chưa được đưa lên Chrome Web Store, bạn cần cài đặt thủ
công thông qua chế độ Developer Mode của Google Chrome.

Bước 1: Mở trang quản lý Tiện ích mở rộng

1.  Mở trình duyệt Google Chrome.
2.  Nhập đường dẫn sau vào thanh địa chỉ và nhấn Enter:
    chrome://extensions/
    (Hoặc click vào biểu tượng Tiện ích ở góc phải trên cùng -> Chọn "Quản lý
    tiện ích").

Bước 2: Bật Chế độ Dành cho nhà phát triển

Nhìn lên góc trên cùng bên phải của trang tiện ích, bạn sẽ thấy một công tắc
(toggle) có tên "Chế độ dành cho nhà phát triển" (Developer mode). Hãy bật
công tắc này lên.

Bước 3: Tải thư mục Extension lên

1.  Sau khi bật Developer mode, 3 nút chức năng mới sẽ xuất hiện ở góc trên bên
    trái.
2.  Click vào nút "Tải tiện ích đã giải nén" (Load unpacked).
3.  Cửa sổ chọn thư mục hiện ra. Hãy trỏ đường dẫn tới thư mục chứa các file của
    Extension (thư mục chứa file manifest.json, background.js, v.v...).
4.  Click Select Folder (Chọn thư mục).

Hoàn tất: Extension "Trợ Lý Vào Bếp AI" sẽ xuất hiện trong danh sách. Hãy
click vào biểu tượng cái ghim để ghim Extension ra ngoài thanh công cụ cho dễ
sử dụng.

Cách Cập nhật lại Code (Reload)

Trong quá trình dev, nếu bạn thay đổi code trong thư mục Extension (ví dụ sửa
CSS, sửa logic trong JS), bạn phải thực hiện các bước sau để Chrome nhận code
mới:

1.  Vào lại chrome://extensions/.
2.  Tìm đến ô của Extension "Trợ Lý Vào Bếp AI".
3.  Click vào biểu tượng Mũi tên xoay vòng (Reload/Tải lại).
4.  Tải lại (F5) tab trang web mà bạn đang test để Content Script được nạp lại.
