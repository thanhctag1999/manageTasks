# ManageTasks Finance Suite

Bản mở rộng giữ nguyên toàn bộ logic Task hiện có, bao gồm việc dùng
`is_charged` làm trạng thái hoàn thành. Source bổ sung đăng nhập và một module
quản lý tài chính cá nhân hoàn chỉnh bằng HTML, CSS và JavaScript thuần.

## Cài đặt

1. Mở Supabase SQL Editor và chạy toàn bộ file `database/schema.sql`.
2. Sao chép `setting.example.js` thành `setting.js`.
3. Điền `SUPABASE_URL` và `SUPABASE_ANON_KEY` trong `setting.js`.
4. Chạy thư mục bằng Live Server hoặc một HTTP server tĩnh.
5. Mở `login.html`.

Tài khoản khởi tạo:

- Username: `admin`
- Password: `ChangeMe@123`

Đổi mật khẩu ngay sau lần đăng nhập đầu tiên tại
**Finance → Danh mục & tài khoản → Đổi mật khẩu đăng nhập**.

Không mở trực tiếp bằng giao thức `file://` nếu trình duyệt chặn request đến
Supabase. Có thể chạy nhanh bằng:

```bash
python3 -m http.server 5500
```

Sau đó mở `http://localhost:5500/login.html`.

Nếu lần chạy SQL trước dừng giữa chừng, chỉ cần chạy lại **toàn bộ**
`database/schema.sql` đã cập nhật. Script dùng `if not exists`,
`create or replace` và seed chống trùng nên không cần xóa các bảng đã tạo.
Các hàm `pgcrypto` được gọi rõ qua schema `extensions`, tương thích với cách
Supabase cài extension này.

## Các module đã triển khai

- Đăng nhập bằng bảng `account`, mật khẩu bcrypt và session 12 giờ.
- Session lưu trong `sessionStorage`, do đó tab mới hoặc phiên trình duyệt mới
  yêu cầu đăng nhập lại.
- RLS theo `owner_id` cho toàn bộ dữ liệu tài chính.
- Giao dịch thu, chi, chuyển khoản, hoàn tiền và trạng thái dự kiến/đến hạn.
- CRUD tài khoản tiền mặt, ngân hàng, ví điện tử, tín dụng, tiết kiệm và đầu tư.
- CRUD danh mục chi tiêu, tính chất và độ ưu tiên mặc định.
- Chi phí/thu nhập định kỳ theo tuần, tháng, quý, năm hoặc số ngày tùy chỉnh.
- Sinh giao dịch đến hạn với khóa chống tạo trùng.
- Ngân sách tuần/tháng, ngân sách tổng hoặc theo danh mục.
- Cảnh báo khi dùng trên 80% hoặc vượt 100% hạn mức.
- Dự báo chi phí tuần/tháng/năm từ:
  - giao dịch đã ghi nhận;
  - giao dịch đã lên kế hoạch;
  - lịch định kỳ chưa sinh giao dịch;
  - trung bình chi phí biến đổi trong 56 ngày.
- Mục tiêu tiết kiệm, mức đóng góp cần thiết và lịch sử đóng góp.
- Wishlist, liên kết mục tiêu, tính ngày mua an toàn và chuyển thành giao dịch.
- Kịch bản dòng tiền với biến động thu nhập, chi phí và khoản phát sinh một lần.
- Gợi ý cắt giảm từ chi tiêu ưu tiên P2/P3 trong 90 ngày.
- Xuất giao dịch theo kỳ thành CSV.
- UI Finance và Login đồng bộ concept Synchro đen–lime của web gốc.
- Widget tổng quan hiển thị rõ kỳ phân tích, thời điểm đồng bộ, khoản đến hạn
  trong 45 ngày và tình trạng ngân sách.
- Thanh điều hướng Finance riêng cho tablet/mobile, bảng có vùng cuộn độc lập
  và toàn bộ control tối ưu cho cả chuột lẫn cảm ứng.
- Responsive cho desktop, tablet và mobile.

## Cấu trúc quan trọng

```text
login.html              Màn hình đăng nhập
auth.js                 Quản lý session và bảo vệ các trang
finance.html            Toàn bộ giao diện tài chính
finance.css             Style riêng của module Finance
finance.js              CRUD, dự báo và logic tài chính
database/schema.sql     Schema, RLS, RPC login và dữ liệu khởi tạo
setting.example.js      Mẫu cấu hình Supabase
```

Các file Task gốc vẫn hoạt động với `/task` và `/category`. Module Finance sử
dụng các bảng riêng, vì vậy sẽ không làm thay đổi dữ liệu hoặc ý nghĩa
`is_charged` hiện có.

## Lưu ý bảo mật

- Không commit `setting.js` lên repository công khai.
- Đổi mật khẩu khởi tạo ngay khi cài đặt.
- Nếu website được triển khai công khai, nên giới hạn domain được phép gọi API
  và kiểm tra lại policy của các bảng Task cũ. RLS trong `schema.sql` bảo vệ các
  bảng tài chính, nhưng không tự sửa policy của `/task` và `/category` đã tồn
  tại trước đó.
