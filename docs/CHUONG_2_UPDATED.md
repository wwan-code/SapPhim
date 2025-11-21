# CHƯƠNG 2: THỰC NGHIỆM VÀ TRIỂN KHAI

Chương này trình bày chi tiết về quá trình triển khai dự án "Sạp Phim", từ quy trình phát triển, công cụ sử dụng, đến việc hiện thực hóa các module chức năng cốt lõi dựa trên mã nguồn thực tế và kết quả đạt được.

## 2.1. Quy trình phát triển

### 2.1.1. Quy trình phát triển Phần mềm
Dự án được phát triển theo một quy trình tuần tự, bao gồm các giai đoạn chính được xác định rõ ràng để đảm bảo tiến độ và chất lượng sản phẩm. Mỗi giai đoạn được hoàn thành trước khi chuyển sang giai đoạn tiếp theo.

- **Giai đoạn 1: Phân tích Yêu cầu và Lập kế hoạch**
    - Thu thập và xác định các yêu cầu chức năng và phi chức năng cho hệ thống "Sạp Phim".
    - Phân tích các tính năng cần có như quản lý người dùng, quản lý phim, tính năng xã hội, và tích hợp AI.
    - Lập kế hoạch chi tiết về nguồn lực, thời gian và các cột mốc quan trọng của dự án.

- **Giai đoạn 2: Thiết kế Hệ thống**
    - **Thiết kế kiến trúc:** Lựa chọn các công nghệ chính (React cho Frontend, Node.js/Express cho Backend) và xác định kiến trúc tổng thể (MVC, client-server).
    - **Thiết kế cơ sở dữ liệu:** Thiết kế lược đồ CSDL quan hệ (MySQL) để lưu trữ thông tin về người dùng, phim, bình luận, v.v.
    - **Thiết kế giao diện (UI/UX):** Phác thảo wireframe và mockup cho các giao diện chính của ứng dụng.

- **Giai đoạn 3: Hiện thực hóa (Implementation)**
    - **Backend:** Xây dựng các API endpoint, xử lý logic nghiệp vụ và tương tác với cơ sở dữ liệu theo thiết kế.
    - **Frontend:** Xây dựng các component giao diện người dùng bằng React, quản lý trạng thái bằng Redux và tích hợp API từ backend.
    - Các module chính được phát triển tuần tự, bắt đầu từ nền tảng (xác thực, quản lý người dùng) đến các tính năng nâng cao.

- **Giai đoạn 4: Kiểm thử và Đảm bảo Chất lượng (Testing & QA)**
    - Thực hiện kiểm thử đơn vị (Unit Testing) và kiểm thử tích hợp (Integration Testing) để đảm bảo các module hoạt động chính xác khi kết hợp với nhau.
    - Kiểm thử toàn bộ hệ thống (End-to-End Testing) để xác minh các luồng người dùng hoạt động đúng như mong đợi.
    - Ghi nhận và sửa lỗi (Bug Fixing).

- **Giai đoạn 5: Triển khai và Bảo trì**
    - Triển khai ứng dụng lên môi trường production.
    - Theo dõi hoạt động của hệ thống, thu thập phản hồi từ người dùng và thực hiện các bản cập nhật, sửa lỗi cần thiết.

### 2.1.2. Git Workflow
Nhóm sử dụng mô hình Git Flow:
- **`main`**: Chứa mã nguồn ổn định, sẵn sàng cho production.
- **`develop`**: Nhánh tích hợp cho các tính năng đã hoàn thành.
- **`feature/*`**: Nhánh phát triển cho các tính năng mới (ví dụ: `feature/authentication`).

Quy trình làm việc bao gồm việc tạo Pull Request (PR) vào `develop`, yêu cầu code review từ thành viên khác trước khi merge để đảm bảo chất lượng mã nguồn.

## 2.2. Công cụ quản lý dự án

- **Trello:** Quản lý công việc theo các cột `Backlog`, `To Do`, `In Progress`, `Done`.
- **GitHub:** Lưu trữ mã nguồn, quản lý phiên bản và thực hiện code review.
- **Postman:** Kiểm thử và tài liệu hóa các API endpoint.
- **MySQL Workbench:** Thiết kế, truy vấn và quản lý cơ sở dữ liệu.

## 2.3. Cấu trúc và Công nghệ

- **Frontend:**
    - **Framework:** React 19
    - **Build Tool:** Vite
    - **State Management:** Redux Toolkit, React Query
    - **Styling:** SASS/SCSS
    - **Cấu trúc thư mục:** `pages`, `components`, `services`, `store`, `hooks` giúp phân tách rõ ràng các mối quan tâm.
- **Backend:**
    - **Framework:** Node.js, Express.js
    - **ORM:** Sequelize
    - **Database:** MySQL
    - **Real-time:** Socket.IO
    - **Cấu trúc thư mục:** Theo mô hình MVC (`controllers`, `services`, `models`, `routes`) giúp mã nguồn có tổ chức và dễ bảo trì.

## 2.4. Triển khai các module chính

### 2.4.1. Module Định tuyến và Bố cục (Routing & Layout)
Module này chịu trách nhiệm điều hướng người dùng và áp dụng bố cục trang phù hợp, được triển khai trong tệp `frontend/src/router/router.jsx`.
- **Công nghệ:** `react-router-dom` v6.
- **Cấu trúc:**
    - `createBrowserRouter` được sử dụng để định nghĩa toàn bộ cấu trúc định tuyến.
    - **`AppLayout`**: Bố cục chính cho các trang công khai, bao gồm `Header` và `Footer`.
    - **`AdminLayout`**: Bố cục cho trang quản trị, bao gồm `AdminSidebar` và `AdminHeader`.
    - **`PrivateRoute`**: Một component tùy chỉnh được sử dụng để bảo vệ các tuyến đường yêu cầu xác thực và phân quyền (`admin`, `editor`). Nó kiểm tra trạng thái đăng nhập và vai trò của người dùng từ Redux store trước khi cho phép truy cập.

**Mã nguồn triển khai:**
```jsx
// frontend/src/router/router.jsx
const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Public Routes */}
      <Route path="/" element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        {/* ... other public routes */}
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={<PrivateRoute allowedRoles={['admin', 'editor']}><AdminLayout /></PrivateRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        {/* ... other admin routes */}
      </Route>
      
      {/* Error Pages */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/*" element={<NotFoundPage />} />
    </>
  )
);
```

### 2.4.2. Module Xác thực và Quản lý Người dùng
Đây là module cốt lõi, đảm bảo tính bảo mật và quản lý định danh người dùng.

**Backend Implementation:**
- **Routes (`backend/routes/auth.routes.js`):**
    - Định nghĩa các API endpoint: `/register`, `/login`, `/social-login`, `/refresh`, `/logout`.
    - Áp dụng `authLimiter` (middleware giới hạn tần suất) để chống lại các cuộc tấn công brute-force.
    ```javascript
    // backend/routes/auth.routes.js
    router.post('/register', authLimiter, authController.register);
    router.post('/login', authLimiter, authController.login);
    router.post('/social-login', authLimiter, authController.socialLogin);
    router.post('/refresh', authController.refresh);
    router.post('/logout', verifyToken, authController.logout);
    ```
- **Controller (`backend/controllers/auth.controller.js`):**
    - Tiếp nhận và xác thực dữ liệu đầu vào từ HTTP request.
    - Gọi các hàm xử lý logic từ `auth.service.js`.
    - Quản lý `refreshToken` bằng cách lưu vào cookie với cờ `httpOnly` và `secure` để tăng cường bảo mật.
    ```javascript
    // backend/controllers/auth.controller.js
    const login = asyncHandler(async (req, res) => {
      const { email, password } = req.body;
      const { user, accessToken, refreshToken } = await authService.loginUser(email, password, req);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: parseInt(process.env.REFRESH_EXPIRES_MS),
      });

      res.status(200).json({ data: { user, accessToken } });
    });
    ```
- **Service (`backend/services/auth.service.js`):**
    - **Logic nghiệp vụ:** Chứa toàn bộ logic xử lý cốt lõi.
    - **Đăng ký:** Kiểm tra email tồn tại, băm mật khẩu bằng `bcrypt` trước khi lưu vào CSDL.
    - **Đăng nhập:** Tìm người dùng theo email và so sánh mật khẩu đã băm.
    - **Tạo Token:** Sử dụng `jsonwebtoken` để tạo `accessToken` (ngắn hạn) và `refreshToken` (dài hạn).
    - **Đăng nhập mạng xã hội:** Tích hợp `firebase-admin` để xác thực `idToken` từ Google, Facebook, GitHub. Tự động tạo người dùng mới hoặc cập nhật thông tin nếu họ đã tồn tại.
    - **Tương tác CSDL:** Sử dụng `Sequelize` ORM để làm việc với các model `User`, `Role`, `RefreshToken`, `LoginHistory`.

**Frontend Implementation:**
- **State Management (`frontend/src/store/slices/authSlice.js`):**
    - Sử dụng **Redux Toolkit** với `createSlice` để quản lý trạng thái xác thực (`user`, `accessToken`, `loading`, `error`).
    - `createAsyncThunk` được dùng để xử lý các tác vụ bất đồng bộ như `login`, `register`, `loginWithThirdParty`. Các thunk này gọi API, xử lý kết quả thành công hoặc thất bại, và cập nhật state tương ứng.
    - Giao diện người dùng (UI) sẽ phản ứng với các thay đổi trong state này để hiển thị spinner khi đang tải, thông báo lỗi, hoặc chuyển hướng người dùng sau khi đăng nhập thành công.
    ```javascript
    // frontend/src/store/slices/authSlice.js
    export const login = createAsyncThunk(
      'auth/login',
      async (credentials, { rejectWithValue }) => {
        try {
          const response = await authService.login(credentials.email, credentials.password);
          return response.data.data;
        } catch (error) {
          const message = error.response?.data?.message || error.message;
          return rejectWithValue(message);
        }
      }
    );

    const authSlice = createSlice({
      name: 'auth',
      initialState,
      reducers: { /* ... */ },
      extraReducers: (builder) => {
        builder
          .addCase(login.pending, (state) => {
            state.loading = true;
          })
          .addCase(login.fulfilled, (state, action) => {
            state.loading = false;
            state.user = action.payload.user;
            state.accessToken = action.payload.accessToken;
          })
          .addCase(login.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
          });
      },
    });
    ```

### 2.4.3. Module Thông báo (Notifications)
Module này quản lý việc tạo và gửi thông báo real-time đến người dùng, sử dụng Socket.IO để đẩy dữ liệu trực tiếp đến client.

**Backend Implementation:**
- **Real-time Engine:** Sử dụng `Socket.IO` để tạo kết nối hai chiều giữa server và client. Mỗi người dùng khi đăng nhập sẽ tham gia vào một "room" riêng (`user_{userId}`).
- **Service (`backend/services/notification.service.js`):**
    - Chứa hàm `createNotification` là trung tâm xử lý.
    - **Kiểm tra quyền:** Trước khi tạo, hàm kiểm tra xem người dùng có cho phép nhận loại thông báo này trong cài đặt của họ không.
    - **Lưu vào CSDL:** Thông báo được lưu vào bảng `Notifications` bằng Sequelize.
    - **Phát sự kiện (Emit):** Sau khi lưu thành công, server phát hai sự kiện đến room của người dùng:
        - `notification:new`: Gửi toàn bộ dữ liệu của thông báo mới.
        - `notification:unread-count`: Gửi số lượng thông báo chưa đọc mới nhất.
    ```javascript
    // backend/services/notification.service.js
    export const createNotification = async (notificationData) => {
      // ... (Kiểm tra và tạo thông báo trong DB) ...

      // Gửi sự kiện qua socket
      const io = getIo();
      const userRoom = `user_{userId}`;

      // 1. Gửi thông báo mới
      io.to(userRoom).emit('notification:new', fullNotification);

      // 2. Cập nhật số lượng chưa đọc
      const unreadCount = await getUnreadNotificationsCount(userId);
      io.to(userRoom).emit('notification:unread-count', { unread: unreadCount });

      return fullNotification;
    };
    ```
- **Routes (`backend/routes/notification.routes.js`):** Cung cấp các endpoint RESTful để client có thể lấy danh sách thông báo, đánh dấu đã đọc, xóa, v.v.

**Frontend Implementation:**
- **Socket Manager:** Một module quản lý việc kết nối và lắng nghe sự kiện từ Socket.IO.
- **Redux Store:** Cập nhật trạng thái thông báo (danh sách, số lượng chưa đọc) khi nhận được sự kiện từ server, giúp giao diện tự động re-render.

### 2.4.4. Module Tích hợp AI (AI Integration)
Module AI đóng vai trò là một trợ lý thông minh, hỗ trợ cả người dùng và quản trị viên thông qua các API endpoint chuyên biệt.

**Backend Implementation:**
- **AI Provider:** Kết nối đến một nhà cung cấp dịch vụ AI (ví dụ: OpenAI, Google Gemini) để xử lý các yêu cầu ngôn ngữ tự nhiên.
- **Service (`backend/services/ai.service.js`):**
    - **`chatWithAI`:** Đây là hàm cốt lõi, hoạt động như một "Action Router".
        1.  **Phân loại ý định (Intent Classification):** Khi nhận được prompt từ người dùng, nó gọi AI để xác định ý định (ví dụ: `search_movie`, `recommend_movie`, `navigation`).
        2.  **Định tuyến hành động (Action Routing):** Dựa trên ý định, nó gọi các hàm xử lý riêng biệt (`_handleSearchMovie`, `_handleRecommendMovie`).
        3.  **Thực thi và trả về:** Các hàm xử lý này sẽ tương tác với CSDL để lấy dữ liệu (ví dụ: tìm phim, lấy lịch sử xem) và định dạng kết quả trả về cho client dưới dạng một cấu trúc JSON có thể hành động được (ví dụ: `{type: 'movie_list', payload: [...]}`).
    ```javascript
    // backend/services/ai.service.js
    const chatWithAI = async (userId, prompt) => {
      // ... (Lấy ngữ cảnh, lịch sử chat) ...

      // BƯỚC 1: Gọi AI để phân loại ý định
      const intentResponse = await callAIProvider(intentPrompt);
      const intentData = parseAIResponse(intentResponse);

      // BƯỚC 2: Định tuyến hành động dựa trên ý định
      let finalResponse;
      switch (intentData.intent) {
        case 'search_movie':
          finalResponse = await _handleSearchMovie(intentData.entities);
          break;
        case 'recommend_movie':
          finalResponse = await _handleRecommendMovie(userId, intentData.entities);
          break;
        // ... các case khác
        default:
          finalResponse = _handleGeneralChat(intentData.response_to_user);
      }

      // BƯỚC 3: Ghi log và trả về
      await logAiInteraction(userId, prompt, JSON.stringify(finalResponse), 'chat');
      return finalResponse;
    };
    ```
- **Routes & Controllers:** Cung cấp các endpoint cho các chức năng AI khác nhau như gợi ý phim, dịch thuật, và các công cụ hỗ trợ quản trị viên (tạo nội dung SEO, phân loại bình luận).

## 2.5. Testing và Quality Assurance

Để đảm bảo chất lượng sản phẩm, nhóm đã áp dụng một chiến lược kiểm thử đa tầng, tập trung vào việc xác minh tính đúng đắn của cả backend và frontend.

### 2.5.1. Backend Testing
- **API Endpoint Testing:** Sử dụng **Postman** để thực hiện kiểm thử thủ công cho tất cả các API endpoint. Các kịch bản kiểm thử bao gồm:
    - **Happy Paths:** Kiểm tra các trường hợp thành công với dữ liệu hợp lệ.
    - **Edge Cases:** Kiểm tra các trường hợp biên như dữ liệu trống, sai định dạng.
    - **Error Handling:** Đảm bảo server trả về mã lỗi và thông báo phù hợp khi có lỗi xảy ra.
    - **Security:** Kiểm tra các cơ chế bảo mật như xác thực token, phân quyền và giới hạn tần suất request.
- **Unit Testing:** (Dự kiến) Sử dụng framework như **Jest** hoặc **Mocha** để viết các bài kiểm thử đơn vị cho các hàm xử lý logic phức tạp trong tầng `service`, đảm bảo mỗi thành phần hoạt động độc lập một cách chính xác.

### 2.5.2. Frontend Testing
- **Manual Testing:** Thực hiện kiểm thử thủ công trên các trình duyệt phổ biến (Chrome, Firefox) để đảm bảo:
    - **Giao diện người dùng (UI):** Hiển thị đúng trên các kích thước màn hình khác nhau (Responsive Design).
    - **Chức năng (Functionality):** Các tương tác của người dùng như click, nhập liệu hoạt động như mong đợi.
    - **Luồng người dùng (User Flow):** Các quy trình nghiệp vụ như đăng ký, đăng nhập, đặt hàng diễn ra trôi chảy.
- **Component Testing:** (Dự kiến) Sử dụng **React Testing Library** và **Jest** để kiểm thử các component React một cách riêng lẻ, xác minh rằng chúng render đúng và xử lý logic chính xác dựa trên props và state.

### 2.5.3. Quality Assurance
- **Code Review:** Mọi thay đổi về mã nguồn đều phải thông qua quy trình Pull Request và được ít nhất một thành viên khác trong nhóm review trước khi được hợp nhất vào nhánh `develop`.
- **Coding Conventions:** Nhóm tuân thủ các quy ước về định dạng mã nguồn (sử dụng ESLint và Prettier) để đảm bảo mã nguồn nhất quán, dễ đọc và dễ bảo trì.

## 2.6. Kết luận chung

Báo cáo đã trình bày chi tiết quá trình xây dựng và phát triển dự án "Sạp Phim", từ giai đoạn khảo sát, phân tích yêu cầu ban đầu cho đến khi triển khai thành công một nền tảng web hoàn chỉnh.

Chương 1 đã đặt nền móng với việc xác định rõ mục tiêu, phạm vi và các yêu cầu chức năng, phi chức năng của hệ thống. Dựa trên nền tảng đó, Chương 2 đã đi sâu vào quá trình thực nghiệm và hiện thực hóa, áp dụng một quy trình phát triển phần mềm có cấu trúc, kết hợp với các công cụ quản lý hiện đại và một bộ công nghệ mạnh mẽ (React, Node.js).

Qua quá trình triển khai, dự án đã đạt được những kết quả quan trọng:
- **Hiện thực hóa thành công tầm nhìn:** Từ các yêu cầu ban đầu, dự án đã xây dựng thành công một ứng dụng web phức tạp, giàu tính năng, đáp ứng đúng mục tiêu đã đề ra.
- **Kiến trúc vững chắc và linh hoạt:** Hệ thống được xây dựng trên kiến trúc MVC ở backend và component-based ở frontend, đảm bảo tính bảo mật, dễ bảo trì và sẵn sàng cho việc mở rộng trong tương lai.
- **Các tính năng cốt lõi hoạt động ổn định:** Các module quan trọng như xác thực người dùng, thông báo thời gian thực, và tích hợp trợ lý AI đã được triển khai thành công, mang lại trải nghiệm người dùng mượt mà và hiện đại.

Tóm lại, dự án "Sạp Phim" đã hoàn thành các mục tiêu chính của giai đoạn này. Những thành công trong việc phân tích, thiết kế và triển khai không chỉ chứng minh tính đúng đắn của các lựa chọn kỹ thuật mà còn tạo ra một sản phẩm chất lượng, có tiềm năng phát triển mạnh mẽ trong tương lai.
