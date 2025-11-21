# AI Coding Agent Instructions

## Architecture Overview

**Fullstack movie streaming + social media hybrid platform** (Sạp Phim). Monorepo with independent `backend/` (Express.js API) and `frontend/` (Vite + React 19) packages.

### Tech Stack
- **Backend**: Express.js (ES modules), Sequelize ORM (MySQL), Socket.IO, Redis, JWT auth, Firebase Admin SDK
- **Frontend**: React 19, Redux Toolkit + Redux Persist, TanStack Query (React Query), Socket.IO client, Firebase client, SCSS modules
- **Design System**: Custom "Liquid Glass" UI inspired by iOS 26 (see `docs/Yêu Cầu Thiết Kế Liquid Glass UI.md`)

## Critical Architecture Patterns

### 1. Authentication & Authorization Flow
- **JWT Tokens**: Access token (7d) + refresh token (30d, stored in DB `RefreshToken` table)
- **Token Refresh**: Automatic via axios interceptor (`frontend/src/services/api.js`). On 401, uses `refreshAccessToken` thunk to get new access token
- **Social Login**: Firebase-based (Google/Facebook/GitHub). Frontend gets ID token → sends to backend `/api/auth/social-login` → backend verifies with Firebase Admin SDK → returns JWT tokens
- **Auth Middleware**: `backend/middlewares/auth.middleware.js` exports:
  - `verifyToken` - Required auth (throws 401 if missing/invalid)
  - `verifyTokenOptional` - Optional auth (attaches user if valid, otherwise continues)
  - `authorizeRoles(...roles)` - Role-based access (e.g., `['admin', 'editor']`)
- **Redux State**: Auth state in `authSlice` with `redux-persist` (persists to localStorage)

### 2. Real-time Communication (Socket.IO)
- **Connection Lifecycle**: Managed in `Root.jsx` → calls `initializeSocket()` when `accessToken` exists
- **Socket Manager**: `frontend/src/socket/socketManager.jsx` handles:
  - Event queue with batch processing (5s timeout, max 1000 events)
  - Automatic reconnection (max 5 attempts)
  - Redis pub/sub bridge for horizontal scaling
- **Backend Socket Config**: `backend/config/socket.js`
  - User status broadcasting (online/offline) via Redis channels
  - Room-based targeting: `user_${userId}` for private events
  - Critical channels in `REDIS_CHANNELS`: `USER_STATUS`, `NOTIFICATION`, `COMMENT`, `FRIEND_REQUEST`, `FRIENDSHIP_UPDATE`
- **Emitting Events**: Use `emitToUser(userId, event, data)` or `emitToUsers([ids], event, data)` helpers

### 3. Database & ORM Patterns
- **Sequelize Models**: All in `backend/models/`, associations in `associations.js`
- **Connection Pool**: Configured for real-time (max 20, min 5, acquire 30s, idle 10s, auto-retry on disconnect)
- **Key Relationships**:
  - `User ↔ Friendship` (bidirectional: `senderId`/`receiverId`)
  - `User ↔ Role` (many-to-many via `user_roles`)
  - `Movie ↔ Genre` (many-to-many via `movie_genres`)
  - `Comment` (self-referencing: `parentId` for nested replies)
  - `Conversation ↔ Message` (1-to-many, lastMessage tracked)
- **No Migrations Folder**: Schema managed via model sync in development (check `backend/config/database.js`)

### 4. Caching Strategy (Redis)
- **Redis Helpers**: `backend/config/redis.js` exports `redisHelpers` with safe fallbacks (app works without Redis)
- **Critical Cache Keys**:
  - `user:${userId}:privacy_settings` (TTL: 600s)
  - `user:${userId}:friends` (TTL: 300s)
  - `friends:${userId}` (friend IDs list)
  - `search:users:${userId}:${query}` (search results)
- **Cache Invalidation**: Always invalidate after mutations (e.g., `invalidateFriendIdsCache(userId)` after accepting friend request)
- **Pub/Sub**: Use `redisHelpers.publish(channel, message)` to broadcast across server instances

### 5. Frontend State Management
- **Redux**: Global state (auth, friends) in `store/slices/`
- **TanStack Query**: Server state caching (notifications, comments, movies, etc.)
  - Query client config: `frontend/src/utils/queryClient.js`
  - Default staleTime: 5min, gcTime: 10min
  - No refetch on window focus, but refetch on reconnect
  - Query key factories in `queryKeys` object (e.g., `queryKeys.notifications.unreadCount()`)
- **Optimistic Updates**: Use `cacheUtils.optimisticUpdate()` for instant UI feedback
- **Socket Integration**: Socket events call `queryClient.invalidateQueries()` or `queryClient.setQueryData()` for real-time sync

### 6. File Upload & Processing
- **Multer Middleware**: `backend/middlewares/upload*.middleware.js` (disk storage in `uploads/`)
- **Image Processing**: Sharp for resizing/optimization
- **Upload Paths**: Static served at `/uploads` route
- **Frontend Upload**: Use FormData with axios, handle progress events

## Developer Workflows

### Starting Development
```powershell
# Backend (runs on http://localhost:5000)
cd backend; npm run dev

# Frontend (runs on http://localhost:5173)
cd frontend; npm run dev
```

### Environment Setup
- **Backend**: Copy `backend/.env.example` → `backend/.env`, update DB credentials and Redis URL
  - Required: `JWT_SECRET`, `DB_*` credentials, `CLIENT_URL`
  - Optional: `REDIS_URL` (app has fallbacks), `TMDB_API_KEY`, `GEMINI_API_KEY`
- **Frontend**: Set `VITE_API_BASE_URL`, `VITE_SOCKET_URL`, `VITE_SERVER_URL`, Firebase config in `frontend/.env`
  - All env vars must start with `VITE_` prefix to be accessible via `import.meta.env`
- **Social Login Setup**: See `docs/SOCIAL_LOGIN_QUICKSTART.md` for Firebase, Google, Facebook, GitHub OAuth

### Database Setup
```powershell
# No migrations folder - models auto-sync in development
# For production, manually create tables or use Sequelize sync
```

### Redis Requirement
- **Development**: Optional (app has fallbacks), but recommended for socket scaling and performance
- **Production**: Required for multi-instance deployments (pub/sub for socket events)

### Common Tasks
- **Add New Route**: Create in `backend/routes/*.routes.js`, register in `backend/index.js`
- **Add Socket Event**: Update `attachEventHandlers()` in `backend/config/socket.js`, handle in `frontend/src/socket/socketManager.jsx`
- **Add Query Key**: Add to `queryKeys` object in `frontend/src/utils/queryClient.js`
- **Add Validation**: Use `express-validator` in middleware (see `backend/middlewares/friend.validation.js`)

## Project-Specific Conventions

### Code Style
- **ES Modules**: Use `import/export` (not `require`)
- **Async/Await**: Prefer over `.then()` chains
- **Error Handling**: 
  - Backend controllers: Use `asyncHandler` from `express-async-handler` (wraps try/catch automatically)
  - Services: Use `try/catch` blocks, throw descriptive errors
  - Frontend: Use TanStack Query's built-in error handling + `onError` callbacks
  - All errors caught by `errorHandler` middleware (`backend/middlewares/error.middleware.js`)
- **Component Structure**: Functional components with hooks (no class components)
- **Logger**: Use `logger` utility (`backend/utils/logger.js`) instead of `console.log` in production code

### File Naming
- **Backend**: `kebab-case.js` (e.g., `auth.controller.js`)
- **Frontend**: `PascalCase.jsx` for components, `camelCase.js` for utils
- **SCSS**: `_partial.scss` for imports, `ComponentName.scss` for component styles

### API Response Format
```javascript
// Success
{ data: {...}, message: 'Success message' }

// Error (handled by errorHandler middleware)
{ message: 'Error message', error: {...} }
```

### Socket Event Naming
- Use colon namespace: `notification:new`, `friend:request`, `user:status`
- Backend emits to rooms: `user_${userId}`
- Frontend handles in `socketManager.jsx` event queue

### Query Key Structure
```javascript
// Hierarchical: ['resource', 'operation', ...params]
['notifications', 'list', { page: 1 }]
['comments', 'movie', movieId, 'newest']
['friends', 'search', query]
```

### SCSS Architecture
- **Variables**: `_variables.scss` (CSS custom properties, `--w-*` prefix)
- **Mixins**: `_mixins.scss` (includes Liquid Glass effects)
- **Liquid Glass Mixin**: `@include liquid-glass-base($opacity, $blur, $tint)` for glassmorphism
- **Responsive**: `@include breakpoint($point)` (xs, sm, md, lg, xl, xxl)
- **Motion**: Use `--w-motion-duration-*` and `--w-motion-easing-*` variables

## Key Integration Points

### Frontend ↔ Backend
- **API Client**: `frontend/src/services/api.js` (axios with interceptors)
- **Base URL**: From `VITE_API_BASE_URL` env var
- **Credentials**: `withCredentials: true` for cookies (refresh token)

### Socket.IO Bridge
- **Frontend Init**: `Root.jsx` → `initializeSocket()` → connects to `VITE_SOCKET_URL`
- **Backend Init**: `backend/index.js` → `initSocket(httpServer)` → Socket.IO instance
- **Auth**: Socket handshake sends `auth.token` (access token), verified in `verifySocketToken()`

### Redis Pub/Sub
- **Publish**: Backend services call `redisHelpers.publish(REDIS_CHANNELS.*, data)`
- **Subscribe**: `backend/config/socket.js` sets up subscribers in `setupRedisSubscriptions()`
- **Use Case**: Broadcast events across multiple backend instances (horizontal scaling)

### React Query ↔ Socket.IO
- **Pattern**: Socket events trigger `queryClient.invalidateQueries()` or `queryClient.setQueryData()`
- **Example**: `notification:new` → optimistically add to cache → invalidate list query
- **Batching**: `batchInvalidate` with 100ms debounce in `socketManager.jsx`

## Common Pitfalls & Solutions

### Problem: Socket events not received
- **Check**: User joined correct room (`user_${userId}`)
- **Check**: Event registered in `attachEventHandlers()`
- **Check**: Redis pub/sub if multi-instance

### Problem: Query not refetching after mutation
- **Solution**: Call `queryClient.invalidateQueries({ queryKey })` in mutation's `onSuccess`
- **Or**: Use optimistic update pattern in `cacheUtils.optimisticUpdate()`

### Problem: 401 errors after token refresh
- **Check**: `isRefreshing` flag in `api.js` interceptor prevents duplicate refresh calls
- **Check**: Queue processes in correct order after refresh

### Problem: Redux persist not working
- **Check**: PersistGate wraps app in `main.jsx`
- **Check**: `whitelist` in `persistConfig` includes slice name

### Problem: Liquid Glass effect not rendering
- **Check**: `--w-glass-*` CSS variables defined in `_variables.scss`
- **Check**: `backdrop-filter` supported (needs `-webkit-` prefix in some browsers)
- **Check**: Element has translucent background to see blur effect

## External Dependencies & APIs

- **Firebase**: Admin SDK (backend) + Client SDK (frontend) for social auth
- **TMDB API**: Movie metadata (`TMDB_API_KEY` in backend `.env`)
- **Google CSE**: Search API for content discovery
- **Gemini AI**: Content generation for movies and AI assistant features (`GEMINI_API_KEY`)

---

## Admin Panel Architecture

### Access Control
- **Route Protection**: All admin routes wrapped in `<PrivateRoute allowedRoles={['admin', 'editor']}>` (see `router.jsx`)
- **Backend Authorization**: Routes use `verifyToken` + `authorizeRoles('admin')` middleware chain
- **Role Check**: User must have `admin` or `editor` role in `user_roles` junction table

### Layout Structure
- **AdminLayout**: Master layout at `/admin` with sidebar + header + content area (`frontend/src/app/AdminLayout.jsx`)
- **AdminSidebar**: Collapsible navigation menu (mobile-responsive with overlay)
- **AdminHeader**: Top bar with toggle button and user controls
- **Outlet**: React Router outlet for nested admin pages

### Navigation Menu (`AdminSidebar.jsx`)
```javascript
// Menu structure:
/admin/dashboard           // Analytics & overview
/admin/genres              // Genre CRUD
/admin/countries           // Country CRUD
/admin/categories          // Category CRUD
/admin/movies              // Movie list + CRUD
/admin/movies/new          // Create movie form
/admin/movies/:id          // Movie detail view
/admin/movies/:id/edit     // Edit movie form
/admin/episodes            // Episode management
/admin/series              // Series management
/admin/sections            // Section management
/admin/comments/reported   // Reported comments moderation
/admin/comments/analytics  // Comment statistics
```

### Admin Pages & Features

#### 1. Dashboard (`/admin/dashboard`)
- **Analytics Cards**: 
  - Total users, movies, comments, views (StatCard components)
  - Real-time updates via React Query (5min staleTime)
- **Trending Movies**: Configurable period (day/week/month) with dropdown selector
- **Charts**: Line chart showing activity trends (Chart.js integration)
- **Data Source**: `GET /api/dashboard/analytics` (admin-only)
- **Refetch**: Manual refresh button with loading state

#### 2. Content Management (Genres/Countries/Categories)
- **Pattern**: Reusable CRUD table with inline editing
- **Operations**:
  - Create: Modal form with validation
  - Read: Paginated table with search/filter
  - Update: Inline edit or modal
  - Delete: Confirmation modal with cascade warning
- **API Pattern**: 
  ```javascript
  GET    /api/{resource}      // List with pagination
  GET    /api/{resource}/all  // All items (no pagination)
  POST   /api/{resource}      // Create (admin-only)
  PUT    /api/{resource}/:id  // Update (admin-only)
  DELETE /api/{resource}/:id  // Delete (admin-only)
  ```

#### 3. Movie Management (`/admin/movies`)
- **MovieList**: 
  - Advanced filters (genre, country, category, year, status)
  - Bulk actions (delete, change status)
  - Quick actions (edit, view, delete)
  - Pagination with configurable page size
- **MovieForm** (Create/Edit):
  - Multi-step form with context (`MovieFormContext`)
  - Image uploads: poster + backdrop (multer middleware)
  - Rich metadata: title, slug, description, release date, duration
  - Relationships: genres (multi-select), country, category, series
  - Episode management: nested form for series
  - Validation: `express-validator` on backend
- **MovieDetail**:
  - View-only mode with all metadata
  - Quick edit button
  - Episode list (if series)
  - Associated comments count
- **API Routes**:
  ```javascript
  GET    /api/movies              // List (public)
  GET    /api/movies/:id          // Detail (admin-only, by ID)
  GET    /api/movie/detail/:slug  // Detail (public, by slug)
  POST   /api/movies              // Create (admin + multer)
  PUT    /api/movies/:id          // Update (admin + multer)
  DELETE /api/movies/:id          // Delete (admin, cascade)
  ```

#### 4. Episode Management (`/admin/episodes`)
- **Nested under Movies**: Episodes belong to movies with `type: 'series'`
- **Bulk Operations**: Import episodes from external API (TMDB)
- **Video Upload**: 
  - Multer handles file upload to `uploads/videos/`
  - FFmpeg processes video (compression, thumbnail, duration)
  - Background job via BullMQ (if enabled)
- **Metadata**: Episode number, name, video URL, thumbnail, duration
- **API Pattern**: `GET/POST/PUT/DELETE /api/movies/:movieId/episodes/:id`

#### 5. Series & Sections Management
- **Series**: Group related movies (e.g., Marvel Cinematic Universe)
  - Routes: `/api/series` (CRUD operations)
  - Relationships: `Series hasMany Movie`
- **Sections**: Homepage content sections (carousels, featured)
  - Routes: `/api/sections` (CRUD operations)
  - Order management: drag-and-drop (frontend), `order` field (backend)
  - Movie assignment: many-to-many via junction table

#### 6. Comment Moderation

**Reported Comments** (`/admin/comments/reported`):
- **List View**: All comments flagged by users
- **Filters**: Status (pending/reviewed/resolved), content type (movie/episode)
- **Actions**:
  - Approve: Clear report flags
  - Hide: Set `isHidden: true` (soft delete)
  - Delete: Permanent removal with cascade to replies
  - Pin: Feature comment at top
- **API**: `GET /api/comments/admin/reported` (admin-only)

**Comment Analytics** (`/admin/comments/analytics`):
- **Metrics**:
  - Total comments by period
  - Average comments per movie/episode
  - Most active users
  - Engagement rate (likes/comments)
- **Charts**: Time-series graphs, user activity heatmap
- **API**: `GET /api/comments/admin/stats` (admin-only)

**Comment Actions** (available in both pages):
```javascript
PUT    /api/comments/:id/approve  // Clear reports
PUT    /api/comments/:id/pin      // Pin to top
PUT    /api/comments/:id/hide     // Soft delete
DELETE /api/comments/:id/admin    // Hard delete
```

### Common Admin Workflows

#### Adding a New Movie
1. Navigate to `/admin/movies` → Click "Add New Movie"
2. Fill basic info: title, slug (auto-generate), description
3. Upload images: poster (required), backdrop (optional)
4. Select category: `single` or `series`
5. If series: Add episodes with video upload
6. Assign genres (multi-select), country, release date
7. (Optional) Add to series group
8. Set status: `draft`, `published`, `archived`
9. Submit → Backend validates → multer processes images → FFmpeg processes videos → save to DB

#### Moderating Reported Content
1. Go to `/admin/comments/reported`
2. Review report details (reporter, reason, timestamp)
3. Read comment context (parent comment, movie/episode)
4. Decision tree:
   - **False report**: Approve comment (clears flag)
   - **Spam/inappropriate**: Hide comment (visible to user only)
   - **Severe violation**: Delete comment (cascade to replies)
   - **Borderline**: Pin comment to highlight issue
5. Action triggers:
   - Backend updates `Comment` table
   - Socket.IO emits update to affected users
   - Redis cache invalidation for comment lists

#### Bulk Importing Episodes
1. Create movie with type `series`
2. In MovieForm, use "Import from TMDB" feature
3. Enter TMDB series ID → fetch episodes via API
4. Backend scrapes episode metadata (name, air date, thumbnail)
5. Bulk insert into `Episode` table with `movieId` FK
6. Frontend displays episode list for manual video upload

### Admin-Specific Components

**StatCard** (`components/admin/StatCard.jsx`):
- Props: `title`, `value`, `icon`, `trend` (percentage change)
- Hover effect with Liquid Glass background
- Color-coded trends (green: positive, red: negative)

**ChartCard** (`components/admin/ChartCard.jsx`):
- Wrapper for Chart.js with consistent styling
- Props: `title`, `data`, `type` (line, bar, pie)
- Theme-aware colors (adapts to dark mode)

**ListCard** (`components/admin/ListCard.jsx`):
- Generic list component with pagination
- Props: `items`, `renderItem`, `emptyMessage`
- Built-in loading skeleton

**AdminHeader** (`components/admin/AdminHeader.jsx`):
- Sidebar toggle button (mobile)
- User dropdown (profile, settings, logout)
- Breadcrumbs (optional, via React Router)

### Admin API Patterns

**Authorization Chain**:
```javascript
// Standard admin route
router.get('/resource', 
  verifyToken,              // Check JWT
  authorizeRoles('admin'),  // Check role
  controller.method         // Execute
);

// Optional auth (public + admin features)
router.get('/resource', 
  verifyTokenOptional,      // Attach user if token present
  controller.method         // Execute with conditional logic
);
```

**Response Format**:
```javascript
// Success
{ data: {...}, message: 'Success', pagination: {...} }

// Error (handled by errorHandler)
{ message: 'Error', error: {...}, statusCode: 400 }
```

**Pagination**:
```javascript
// Query params: ?page=1&limit=10&sort=createdAt&order=desc
// Response includes:
{
  data: [...],
  pagination: {
    page: 1,
    limit: 10,
    totalPages: 5,
    totalItems: 50,
    hasNext: true,
    hasPrev: false
  }
}
```

### Admin Security Considerations

- **CSRF Protection**: Session-based auth with `sameSite: 'lax'` cookies
- **Rate Limiting**: Admin routes have higher limits (250 req/10min vs 100)
- **File Upload**: 
  - Multer validates MIME types (images: jpg/png/webp, videos: mp4/mov/avi)
  - Max size: images 5MB, videos 100MB (configurable in `.env`)
  - Sharp sanitizes images (strip EXIF, resize)
- **SQL Injection**: Sequelize parameterized queries
- **XSS**: DOMPurify sanitizes user input on frontend
- **Input Validation**: `express-validator` on all POST/PUT routes

### Admin Performance Tips

- **React Query**: 
  - Set longer staleTime for static data (genres, countries: 10min)
  - Use `prefetchQuery` for predictable navigation (e.g., edit page prefetches movie data)
- **Pagination**: Always paginate large lists (movies, comments)
- **Lazy Loading**: Code-split admin pages (`React.lazy()`)
- **Image Optimization**: Sharp generates multiple sizes (thumbnail, medium, full)
- **Video Processing**: Use BullMQ for async FFmpeg jobs (set `ENABLE_CRON_TASKS=true` in `.env`)

### Debugging Admin Issues

**Problem: "Unauthorized" on admin route**
- **Check**: User has `admin` or `editor` role in `user_roles` table
- **Check**: JWT token includes roles in payload (see `jwt.utils.js`)
- **Check**: `authorizeRoles()` middleware applied to route

**Problem: File upload fails**
- **Check**: Multer middleware in route definition
- **Check**: File size within limit (`MAX_VIDEO_SIZE` in `.env`)
- **Check**: `uploads/` directory exists and writable
- **Check**: Network tab for 413 Payload Too Large error

**Problem: Dashboard analytics shows stale data**
- **Check**: React Query cache (use DevTools extension)
- **Check**: Backend caching (Redis TTL for analytics)
- **Solution**: Click refresh button or invalidate cache manually

**Problem: Video processing stuck**
- **Check**: BullMQ queue status (if enabled)
- **Check**: FFmpeg logs in `backend/logs/`
- **Check**: CPU usage (FFmpeg is CPU-intensive)

---

**When in doubt**: Check `backend/index.js` for route registration, `frontend/src/main.jsx` for provider hierarchy, and `docs/` folder for feature-specific guides.
