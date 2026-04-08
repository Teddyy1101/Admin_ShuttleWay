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
| date-fns | 4.1.0 | Xử lý ngày tháng |
| exceljs | 4.4.0 | Xuất file Excel |
| file-saver | 2.0.5 | Lưu file client-side |
| react-big-calendar | 1.19.4 | Lịch trình / calendar view |
| cookies-next | 6.1.1 | Quản lý cookies (middleware auth) |

## Cấu trúc thư mục (root = `dashboard/`)
```
app/
├── layout.tsx              # Root layout (bọc ThemeProvider, Toaster)
├── globals.css             # CSS toàn cục
├── middleware.ts            # Auth middleware (kiểm tra token, redirect /login)
├── login/page.tsx          # Trang đăng nhập
└── (dashboard)/
    ├── layout.tsx           # Dashboard layout (bọc DashboardLayout)
    ├── page.tsx             # Trang tổng quan (StatCard, RevenueChart)
    ├── accounts/page.tsx    # Quản lý tài khoản (CRUD, filter, phân trang)
    ├── buses/page.tsx       # Quản lý xe buýt (CRUD, filter, phân trang)
    ├── stations/page.tsx    # Quản lý trạm dừng (CRUD, bản đồ, phân trang)
    ├── routes/
    │   ├── page.tsx         # Danh sách tuyến đường
    │   └── [id]/page.tsx    # Chi tiết tuyến đường (4 tab: Thông tin, Trạm dừng, Chuyến đi, Học sinh)
    ├── trips/page.tsx       # Quản lý chuyến đi (lịch trình, phân công, lọc)
    ├── promotions/page.tsx  # Quản lý khuyến mãi (CRUD, filter, phân trang)
    ├── transactions/page.tsx # Lịch sử giao dịch (filter, phân trang, xuất Excel)
    ├── tickets/page.tsx     # Quản lý vé xe (filter, phân trang)
    ├── notifications/
    │   ├── send/page.tsx    # Gửi thông báo (broadcast/individual)
    │   └── history/page.tsx # Lịch sử thông báo
    └── requests/
        ├── absence/page.tsx # Quản lý đơn xin nghỉ phép
        └── support/page.tsx # Quản lý phiếu hỗ trợ (ticket support)

components/
├── ConfirmModal.tsx         # Modal xác nhận tái sử dụng
├── PageHeader.tsx           # Header trang (breadcrumb, tiêu đề)
├── PageWrapper.tsx          # Wrapper layout cho page content
├── Pagination.tsx           # Component phân trang tái sử dụng
├── UserFormDrawer.tsx       # Drawer thêm/sửa tài khoản (form + upload avatar)
├── buses/
│   └── BusFormDrawer.tsx    # Drawer thêm/sửa xe buýt
├── dashboard/
│   ├── StatCard.tsx         # Card thống kê (icon, số liệu, animation)
│   ├── RevenueChart.tsx     # Biểu đồ doanh thu (recharts)
│   └── SkeletonLoader.tsx   # Skeleton loading cho dashboard
├── layout/
│   ├── DashboardLayout.tsx  # Layout chính (Sidebar + Header + Content)
│   ├── ConditionalLayout.tsx # Điều kiện hiển thị layout (ẩn ở /login)
│   ├── Sidebar.tsx          # Sidebar điều hướng (collapsible, nhóm menu)
│   └── Header.tsx           # Header (search, theme toggle, user menu, notifications)
├── routes/
│   ├── RouteInfoTab.tsx     # Tab thông tin tuyến đường (table layout)
│   ├── RouteStationsTab.tsx # Tab danh sách trạm dừng
│   ├── RouteTripsTab.tsx    # Tab danh sách chuyến đi
│   ├── RouteStudentsTab.tsx # Tab danh sách học sinh
│   ├── RouteFormDrawer.tsx  # Drawer thêm tuyến đường mới
│   ├── RouteEditModal.tsx   # Modal sửa thông tin tuyến đường
│   ├── BulkAssignModal.tsx  # Modal gán lịch trình hàng loạt
│   ├── EditTripAssignmentModal.tsx # Modal sửa phân công chuyến đi
│   ├── StudentDetailDrawer.tsx    # Drawer chi tiết học sinh
│   └── MapPreview.tsx       # Bản đồ Leaflet hiển thị trạm dừng
├── stations/
│   ├── StationModal.tsx     # Modal thêm/sửa trạm dừng
│   ├── AddStationModal.tsx  # Modal thêm trạm vào tuyến đường
│   └── StationMapPicker.tsx # Chọn vị trí trạm trên bản đồ
├── trips/
│   ├── TripDetailDrawer.tsx # Drawer chi tiết chuyến đi
│   └── TripSwapModal.tsx    # Modal hoán đổi chuyến đi
└── promotions/
    └── PromotionFormDrawer.tsx # Drawer thêm/sửa khuyến mãi

services/                    # Tầng gọi API (chỉ Axios, KHÔNG React)
├── authService.ts           # POST /auth/login
├── dashboardService.ts      # GET /dashboard/overview
├── userService.ts           # CRUD /users
├── busService.ts            # CRUD /buses
├── stationService.ts        # CRUD /stations
├── routeService.ts          # GET /routes, GET /routes/:id
├── tripService.ts           # CRUD /trips (schedule, assign, swap, getStudentsAtStation)
├── promotionService.ts      # CRUD /promotions
├── transactionService.ts    # GET /transactions (list, filter)
├── ticketService.ts         # GET /tickets (list, filter)
├── notificationService.ts   # CRUD /notifications (send, history)
├── leaveRequestService.ts   # CRUD /leave-requests (absence)
└── supportTicketService.ts  # CRUD /support-tickets (support)

hooks/                       # Tầng quản lý state & logic
├── useAuth.ts               # Zustand store: login, logout, checkAuth (chỉ cho ADMIN)
├── useDashboard.ts          # SWR: stats dashboard (auto-refresh 30s)
├── useUsers.ts              # SWR: useUsers (list, filter, toggleStatus, deleteAccount, CRUD)
├── useBuses.ts              # SWR: useBuses (list, filter, CRUD)
├── useStations.ts           # SWR: useStations (list, filter, CRUD)
├── useRoute.ts              # SWR: useRoutes (list + filter), useRouteDetail (by id)
├── useTrips.ts              # SWR: useTrips (list, filter)
├── useTripDetail.ts         # SWR: useTripDetail (chi tiết chuyến đi)
├── usePromotions.ts         # SWR: usePromotions (list, filter, CRUD)
├── useTransactions.ts       # SWR: useTransactions (list, filter)
├── useTickets.ts            # SWR: useTickets (list, filter)
├── useNotifications.ts      # SWR: useNotifications (send, history)
├── useGroupedNotifications.ts # Nhóm thông báo theo ngày/loại
├── useLeaveRequests.ts      # SWR: useLeaveRequests (list, approve/reject)
└── useSupportTickets.ts     # SWR: useSupportTickets (list, reply, update status)

types/                       # TypeScript interfaces
├── api.ts                   # ApiResponse<T>, PaginatedData<T>, PaginatedMeta
├── auth.ts                  # AuthUser, LoginRequest, LoginResponse
├── dashboard.ts             # DashboardStats, RevenueDataPoint
├── user.ts                  # User, Role, AccountStatus, GetUsersParams
├── bus.ts                   # Bus, BusStatus, GetBusesParams
├── route.ts                 # Route, Station, Trip, Direction, ShiftType, TripStatus, GetRoutesParams
├── trip.ts                  # Trip, TripSchedule, TripAssignment, TripStatus, StationStudentItem, StationStudentsResponse
├── promotion.ts             # Promotion, PromotionType, GetPromotionsParams
├── transaction.ts           # Transaction, TransactionStatus, GetTransactionsParams
├── ticket.ts                # Ticket, TicketStation, TicketStatus, GetTicketsParams
├── notification.ts          # Notification, NotificationType, SendNotificationDto
├── leaveRequest.ts          # LeaveRequest, LeaveStatus, GetLeaveRequestsParams
└── supportTicket.ts         # SupportTicket, TicketCategory, TicketStatus

lib/
├── axiosClient.ts           # Axios instance (baseURL, Bearer token interceptor, 401 auto-logout)
└── geocoder.ts              # Geocoding helper (chuyển đổi địa chỉ ↔ tọa độ)

providers/
└── ThemeProvider.tsx         # next-themes ThemeProvider wrapper
```

## Quy ước quan trọng
1. **Ngôn ngữ UI:** Mọi text hiển thị, comment, toast đều bằng **tiếng Việt**
2. **Service-Hook Pattern:** Service → chỉ gọi API | Hook → bọc SWR + logic | Component → chỉ render
3. **Auth:** Token lưu `localStorage('accessToken')`, user info lưu `localStorage('user')`. Chỉ role `ADMIN` mới truy cập được dashboard. Middleware kiểm tra token từ cookies.
4. **API Response chuẩn:** `{ statusCode, message, data }` — phân trang: `{ data: T[], meta: { total, page, limit, totalPages } }`
5. **Dark mode:** Tailwind `dark:` prefix, quản lý bởi `next-themes`
6. **Animation:** Component dùng `<motion.div>` phải có `'use client'`
7. **Bản đồ:** Sử dụng **Leaflet + react-leaflet** (đã gỡ bỏ Google Maps)
8. **Path alias:** `@/` trỏ đến root (`dashboard/`)
9. **Action column:** Sử dụng 3-dot dropdown menu (`MoreHorizontal` icon) cho các hành động trên bảng
10. **Xuất dữ liệu:** Sử dụng `exceljs` + `file-saver` để xuất Excel

## Trang đã hoàn thành
- [x] Đăng nhập (`/login`)
- [x] Tổng quan Dashboard (`/`) — StatCard, RevenueChart, SkeletonLoader
- [x] Quản lý tài khoản (`/accounts`) — Bảng, filter role/status, search, phân trang, CRUD (Drawer), khóa/mở khóa, xóa (ConfirmModal)
- [x] Quản lý xe buýt (`/buses`) — Bảng, filter, search, phân trang, CRUD (BusFormDrawer)
- [x] Quản lý trạm dừng (`/stations`) — Bảng, filter, search, phân trang, CRUD (StationModal), chọn vị trí trên bản đồ
- [x] Danh sách tuyến đường (`/routes`) — Bảng, filter, search, phân trang, CRUD (RouteFormDrawer)
- [x] Chi tiết tuyến đường (`/routes/[id]`) — 4 tab: Thông tin (RouteInfoTab), Trạm dừng (RouteStationsTab), Chuyến đi (RouteTripsTab), Học sinh (RouteStudentsTab) + MapPreview Leaflet
- [x] Quản lý chuyến đi (`/trips`) — Lịch trình, phân công tài xế/xe, gán hàng loạt (BulkAssignModal), hoán đổi (TripSwapModal)
- [x] Quản lý khuyến mãi (`/promotions`) — Bảng, filter loại/trạng thái, search, phân trang, CRUD (PromotionFormDrawer)
- [x] Lịch sử giao dịch (`/transactions`) — Bảng, filter trạng thái/ngày, search, phân trang, xuất Excel
- [x] Quản lý vé xe (`/tickets`) — Bảng, filter, phân trang, **cột Điểm đón/trả** (hiển thị `pickUpStation` / `dropOffStation` với icon ArrowUpCircle/ArrowDownCircle)
- [x] Gửi thông báo (`/notifications/send`) — Gửi broadcast/individual, chọn người nhận
- [x] Lịch sử thông báo (`/notifications/history`) — Bảng, filter, nhóm theo ngày
- [x] Đơn xin nghỉ phép (`/requests/absence`) — Bảng, filter trạng thái, duyệt/từ chối
- [x] Phiếu hỗ trợ (`/requests/support`) — Bảng, filter trạng thái/category, xem chi tiết, trả lời

## Component tái sử dụng
- `ConfirmModal` — Modal xác nhận hành động nguy hiểm (xóa, khóa...)
- `PageHeader` — Breadcrumb + tiêu đề trang
- `PageWrapper` — Wrapper padding/spacing cho nội dung trang
- `Pagination` — Phân trang với thông tin "Hiển thị X-Y trên Z"
- `UserFormDrawer` — Drawer form thêm/sửa tài khoản (hỗ trợ upload avatar)
- `BusFormDrawer` — Drawer form thêm/sửa xe buýt
- `RouteFormDrawer` — Drawer form thêm tuyến đường
- `PromotionFormDrawer` — Drawer form thêm/sửa khuyến mãi
- `StationModal` / `AddStationModal` — Modal thêm/sửa trạm dừng
- `StationMapPicker` — Chọn vị trí trạm trên bản đồ Leaflet
- `TripDetailDrawer` — Drawer chi tiết chuyến đi. **Danh sách trạm dừng clickable** (nhấn trạm → gọi `getStudentsAtStation` API → hiển thị mảng học sinh cần đón (xanh lá) và cần trả (cam)). Hỗ trợ điểm danh thủ công.
- `TripSwapModal` — Modal hoán đổi chuyến đi
- `BulkAssignModal` — Modal gán lịch trình hàng loạt
- `EditTripAssignmentModal` — Modal sửa phân công chuyến đi
- `StudentDetailDrawer` — Drawer chi tiết thông tin học sinh
- `RouteEditModal` — Modal sửa thông tin tuyến đường

## Lưu ý kỹ thuật
- `useAuth` dùng **Zustand** (không dùng SWR) vì quản lý client state
- Các hook khác (`useUsers`, `useRoutes`, `useDashboard`, ...) dùng **SWR** với `keepPreviousData`
- `useUsers` có **optimistic update** cho toggleStatus
- `axiosClient` tự động gắn `Bearer token` và redirect `/login` khi 401
- `middleware.ts` kiểm tra token từ cookies, redirect chưa đăng nhập về `/login`
- `geocoder.ts` hỗ trợ chuyển đổi địa chỉ ↔ tọa độ cho bản đồ
- Biến môi trường: `NEXT_PUBLIC_API_URL` (default: `http://localhost:8080`)
- Sidebar hỗ trợ nhóm menu (collapsible groups) với trạng thái active/expanded được giữ khi chuyển trang
