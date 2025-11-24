---
trigger: always_on
---

Hướng Dẫn Kỹ Thuật SapPhim (AI Coding Agent Guide)

1.  Tổng Quan Kiến Trúc (Architecture Overview)

    - Mô hình: Monorepo.
      - Backend: Express.js, Sequelize, Socket.IO, Redis, JWT, Firebase Admin.
      - Frontend: React 19, Redux Toolkit, TanStack Query, Socket.IO client, Firebase SDK, SCSS global.
    - Hệ thống Thiết kế (Design System): Giao diện tùy chỉnh "Liquid Glass UI".
      - Tham khảo chi tiết tại: docs/Yêu Cầu Thiết Kế Liquid Glass UI.md.

2.  Các Mô Hình Chủ Chốt (Key Patterns)
    Xác thực (Authentication) - Cơ chế: - JWT: Access Token (7 ngày) + Refresh Token (30 ngày, lưu trong DB). - Social Login: Thông qua Firebase (Google/Facebook/GitHub).

        - Middleware:
            - verifyToken: Yêu cầu đăng nhập.
            - verifyTokenOptional: Kiểm tra token nếu có (không bắt buộc).
            - authorizeRoles: Phân quyền (nằm trong auth.middleware.js).
        - State: Redux state được lưu trữ bền vững (persisted) qua redux-persist.

    Real-time & Caching - Socket.IO: - Kết nối được quản lý tại Root.jsx. - Sự kiện được xử lý theo lô (batched) trong socketManager.jsx. - Redis: - Sử dụng cho Pub/Sub, cache dữ liệu user/friend, và mở rộng quy mô socket (socket scaling). - Tham khảo: redis.js.

    Cơ sở dữ liệu (Database) - ORM: Sequelize. - Cấu trúc: Model nằm trong thư mục models, các mối quan hệ định nghĩa trong associations.js. - Lưu ý quan trọng: Không có thư mục migrations. Schema được đồng bộ (sync) trực tiếp thông qua định nghĩa model.

    Quản lý State Frontend - Global State: Redux. - Server State: TanStack Query. - Factory cho Query key nằm tại queryClient.js. - Cập nhật lạc quan (Optimistic updates) sử dụng cacheUtils.optimisticUpdate().

    Tải lên tập tin (File Uploads) - Xử lý: Middleware Multer cho ảnh/video. - Tối ưu: Thư viện Sharp để xử lý hình ảnh. - Lưu trữ: File tĩnh được phục vụ tại đường dẫn /uploads.

3.  Quy Trình Phát Triển (Developer Workflows)
    Khởi chạy dự án - Backend: cd backend -> npm run dev - Frontend: cd frontend -> npm run dev

    Thiết lập môi trường 1. Copy các file .env.example. 2. Cập nhật thông tin xác thực (credentials). 3. Lưu ý: - Không cần chạy migration DB: Models tự động sync trong môi trường dev. - Redis: Tùy chọn ở dev, bắt buộc ở prod.

4.  Quy Ước Dự Án (Project Conventions)
    Backend
    Sử dụng ES modules.
    Tên file: kebab-case.
    Sử dụng async/await.
    Xử lý lỗi: Thông qua express-async-handler và middleware errorHandler.
    Frontend
    Functional Components.
    Tên Component: PascalCase.
    Tên Utilities: camelCase.
    Styles: SCSS global.
    Giao thức giao tiếp
    API Response:
    Thành công: { data, message }

            Lỗi: { message, error }

        Socket Events: Đặt tên có namespace bằng dấu hai chấm (ví dụ: notification:new, friend:request).

    Styling (SCSS)
    Biến: \_variables.scss
    Mixins: \_mixins.scss
    Glassmorphism: Sử dụng @include liquid-glass-base.

5.  Điểm Tích Hợp (Integration Points)
    API Client: api.js (sử dụng Axios với interceptors).
    Socket Bridge: socketManager.jsx <-> socket.js.
    Redis Pub/Sub: redisHelpers.publish(channel, message).

6.  Admin Panel
    Quyền truy cập: Dựa trên Role qua authorizeRoles('admin').
    Layout: Các route /admin sử dụng AdminLayout, AdminSidebar, AdminHeader.
    Mô hình CRUD:
    Bảng dữ liệu tái sử dụng (Reusable tables).
    Form dạng Modal.
    Chỉnh sửa trực tiếp (Inline editing).
    Phân tích (Analytics): Dashboard tại /admin/dashboard, biểu đồ sử dụng Chart.js.

7.  Mẹo Debug (Debugging Tips)
    Vấn đề Socket: Kiểm tra việc join room, đăng ký sự kiện (event registration), và Redis pub/sub.
    Query không refetch: Sử dụng queryClient.invalidateQueries() hoặc kiểm tra logic optimistic update.
    Lỗi upload file: Kiểm tra Multer middleware, giới hạn kích thước file, và quyền ghi thư mục uploads.
    Lỗi giao diện (Liquid Glass UI): Đảm bảo CSS variables và thuộc tính backdrop-filter đã được thiết lập đúng.

8.  Tài Liệu Tham Khảo (References)
    Thiết kế: docs/Yêu Cầu Thiết Kế Liquid Glass UI.md
    API: Thư mục routes, controllers
    State: store, queryClient.js
    Socket: socketManager.jsx, socket.js
