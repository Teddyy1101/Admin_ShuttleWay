# Memory - Frontend Dashboard (Admin Panel)

## Tổng quan dự án
- **Loại:** Admin Dashboard cho hệ thống quản lý xe buýt trường học (School Bus Management)
- **Framework:** Next.js 16.1.6 (App Router, KHÔNG dùng `src/`)
- **Ngôn ngữ:** Strict TypeScript
- **Backend:** NestJS (REST API tại `http://localhost:8080`)
- **Pattern:** Service → Hook → Component (bắt buộc tuân thủ `rule.md`)

## Tech Stack
| Thư viện | Phiên bản | Vai trò |
|---|---|---|
| Next.js | 16.1.6 | Framework chính (App Router) |
| React | 19.2.3 | UI Library |
| Tailwind CSS | v4 | Styling (Dark mode class-based) |
| next-themes | 0.4.6 | Quản lý Dark/Light mode |
| framer-motion | 12.36.0 | Animation (bắt buộc `'use client'`) |
| lucide-react | 0.577.0 | Icon library |
| SWR | 2.4.1 | Data fetching & caching |
| Axios | 1.13.6 | HTTP client |
| Zustand | 5.0.11 | Client state (chỉ auth state) |
| react-hot-toast | 2.6.0 | Thông báo toast |
| Leaflet / react-leaflet | 1.9.4 / 5.0.0 | Bản đồ (thay thế Google Maps) |
| recharts | 3.8.0 | Biểu đồ doanh thu |

## Cấu trúc thư mục (root = `dashboard/`)
```
app/
├── layout.tsx              # Root layout (bọc ThemeProvider, Toaster)
├── globals.css             # CSS toàn cục
├── login/page.tsx          # Trang đăng nhập
└── (dashboard)/
    ├── layout.tsx           # Dashboard layout (bọc DashboardLayout)
    ├── page.tsx             # Trang tổng quan (StatCard, RevenueChart)
    ├── accounts/page.tsx    # Quản lý tài khoản (CRUD, filter, phân trang)
    └── routes/
        ├── page.tsx         # Danh sách tuyến đường
        └── [id]/page.tsx    # Chi tiết tuyến đường (3 tab)

components/
├── ConfirmModal.tsx         # Modal xác nhận tái sử dụng
├── PageHeader.tsx           # Header trang (breadcrumb, tiêu đề)
├── PageWrapper.tsx          # Wrapper layout cho page content
├── Pagination.tsx           # Component phân trang tái sử dụng
├── UserFormDrawer.tsx       # Drawer thêm/sửa tài khoản (form + upload avatar)
├── dashboard/
│   ├── StatCard.tsx         # Card thống kê (icon, số liệu, animation)
│   ├── RevenueChart.tsx     # Biểu đồ doanh thu (recharts)
│   └── SkeletonLoader.tsx   # Skeleton loading cho dashboard
├── layout/
│   ├── DashboardLayout.tsx  # Layout chính (Sidebar + Header + Content)
│   ├── ConditionalLayout.tsx # Điều kiện hiển thị layout (ẩn ở /login)
│   ├── Sidebar.tsx          # Sidebar điều hướng (collapsible)
│   └── Header.tsx           # Header (search, theme toggle, user menu)
└── routes/
    ├── RouteInfoTab.tsx     # Tab thông tin tuyến đường (table layout)
    ├── RouteStationsTab.tsx # Tab danh sách trạm dừng
    ├── RouteTripsTab.tsx    # Tab danh sách chuyến đi
    └── MapPreview.tsx       # Bản đồ Leaflet hiển thị trạm dừng

services/                    # Tầng gọi API (chỉ Axios, KHÔNG React)
├── authService.ts           # POST /auth/login
├── dashboardService.ts      # GET /dashboard/overview
├── routeService.ts          # GET /routes, GET /routes/:id
└── userService.ts           # CRUD /users (getUsers, getUserById, createUser, updateUser, updateUserStatus, deleteUser)

hooks/                       # Tầng quản lý state & logic
├── useAuth.ts               # Zustand store: login, logout, checkAuth (chỉ cho ADMIN)
├── useDashboard.ts          # SWR: stats dashboard (auto-refresh 30s)
├── useRoute.ts              # SWR: useRoutes (list + filter), useRouteDetail (by id)
└── useUsers.ts              # SWR: useUsers (list, filter, toggleStatus, deleteAccount, createUser, updateUser)

types/                       # TypeScript interfaces
├── api.ts                   # ApiResponse<T>, PaginatedData<T>, PaginatedMeta
├── auth.ts                  # AuthUser, LoginRequest, LoginResponse
├── dashboard.ts             # DashboardStats, RevenueDataPoint
├── route.ts                 # Route, Station, Trip, Direction, ShiftType, TripStatus, GetRoutesParams
└── user.ts                  # User, Role, AccountStatus, GetUsersParams

lib/
└── axiosClient.ts           # Axios instance (baseURL, Bearer token interceptor, 401 auto-logout)

providers/
└── ThemeProvider.tsx         # next-themes ThemeProvider wrapper
```

## Quy ước quan trọng
1. **Ngôn ngữ UI:** Mọi text hiển thị, comment, toast đều bằng **tiếng Việt**
2. **Service-Hook Pattern:** Service → chỉ gọi API | Hook → bọc SWR + logic | Component → chỉ render
3. **Auth:** Token lưu `localStorage('accessToken')`, user info lưu `localStorage('user')`. Chỉ role `ADMIN` mới truy cập được dashboard
4. **API Response chuẩn:** `{ statusCode, message, data }` — phân trang: `{ data: T[], meta: { total, page, limit, totalPages } }`
5. **Dark mode:** Tailwind `dark:` prefix, quản lý bởi `next-themes`
6. **Animation:** Component dùng `<motion.div>` phải có `'use client'`
7. **Bản đồ:** Sử dụng **Leaflet + react-leaflet** (đã gỡ bỏ Google Maps)
8. **Path alias:** `@/` trỏ đến root (`dashboard/`)

## Trang đã hoàn thành
- [x] Đăng nhập (`/login`)
- [x] Tổng quan Dashboard (`/`) — StatCard, RevenueChart, SkeletonLoader
- [x] Quản lý tài khoản (`/accounts`) — Bảng, filter role/status, search, phân trang, CRUD (Drawer), khóa/mở khóa, xóa (ConfirmModal)
- [x] Danh sách tuyến đường (`/routes`) — Bảng, filter, search, phân trang
- [x] Chi tiết tuyến đường (`/routes/[id]`) — 3 tab: Thông tin, Trạm dừng, Chuyến đi + MapPreview Leaflet

## Component tái sử dụng
- `ConfirmModal` — Modal xác nhận hành động nguy hiểm (xóa, khóa...)
- `PageHeader` — Breadcrumb + tiêu đề trang
- `PageWrapper` — Wrapper padding/spacing cho nội dung trang
- `Pagination` — Phân trang với thông tin "Hiển thị X-Y trên Z"
- `UserFormDrawer` — Drawer form thêm/sửa tài khoản (hỗ trợ upload avatar)

## Lưu ý kỹ thuật
- `useAuth` dùng **Zustand** (không dùng SWR) vì quản lý client state
- Các hook khác (`useUsers`, `useRoutes`, `useDashboard`) dùng **SWR** với `keepPreviousData`
- `useUsers` có **optimistic update** cho toggleStatus
- `axiosClient` tự động gắn `Bearer token` và redirect `/login` khi 401
- Biến môi trường: `NEXT_PUBLIC_API_URL` (default: `http://localhost:8080`)
