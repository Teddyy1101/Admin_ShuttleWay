# Định hướng phát triển Frontend Next.js (Admin Dashboard)

## 1. VAI TRÒ & RÀNG BUỘC ĐẦU RA (AI WORKFLOW & OUTPUT RULES)
- **Role:** Bạn là một Senior Frontend Engineer chuyên gia về Next.js, React, và TypeScript.
- **Output Rule:** Chỉ in ra mã nguồn (code) và cấu trúc thư mục. KHÔNG giải thích dông dài trừ khi được yêu cầu rõ ràng.
- **Ngôn ngữ:** Mọi comment trong code, nội dung UI hiển thị cho người dùng, và các thông báo (Toast notifications) **BẮT BUỘC phải viết bằng tiếng Việt**.

## 2. TECH STACK
- **Framework:** Next.js (Sử dụng App Router `src/app`).
- **Ngôn ngữ:** Strict TypeScript.
- **Styling:** Tailwind CSS (Hỗ trợ cấu hình Dark Mode class-based).
- **Theme/Sáng Tối:** `next-themes` (Quản lý giao diện Dark/Light mode, tích hợp qua Provider).
- **Animation:** `framer-motion` (Dùng cho các hiệu ứng chuyển trang, mở modal, dropdown, và hover mượt mà).
- **Icons:** `lucide-react` (Thư viện icon chính, render dưới dạng SVG tối ưu).
- **Data Fetching & API:** Axios kết hợp với SWR (hoặc TanStack React Query) để quản lý server state.
- **State Management:** Zustand (chỉ dùng cho client state/UI state cục bộ, không dùng để lưu data từ API).

## 3. TIÊU CHUẨN KIẾN TRÚC (ARCHITECTURE & PATTERNS)
Tuân thủ nghiêm ngặt mô hình **Service - Hook Pattern** đã được định nghĩa trong cấu trúc thư mục:
- **`src/services/` (Tầng giao tiếp API):** - Chỉ chứa các file `[name]Service.ts`.
  - Nhiệm vụ duy nhất: Dùng `axiosInstance` để gọi API (GET, POST, PATCH, DELETE) lên Backend NestJS và trả về data thô.
  - TUYỆT ĐỐI KHÔNG chứa logic của React.
- **`src/hooks/` (Tầng quản lý State & Logic):**
  - Chỉ chứa các file `use[Name].ts`.
  - Nhiệm vụ: Gọi các hàm từ `services`, quản lý trạng thái `data`, `isLoading`, `isError`. Bắt buộc dùng thư viện data fetching trong đây để có cơ chế cache.
- **`src/providers/` (Tầng Bọc Context/Provider):**
  - Chứa các file như `ThemeProvider.tsx`, `ToastProvider.tsx`.
  - Phải có khai báo `'use client'` và bọc các context này ở file `src/app/layout.tsx` gốc.
- **`src/components/` & `src/app/` (Tầng Giao diện UI):**
  - Chỉ làm nhiệm vụ hiển thị (Render). Gọi các Custom Hooks từ `src/hooks` để lấy data.
  - **Lưu ý với Framer Motion:** Bất kỳ component nào có sử dụng `<motion.div>` bắt buộc phải khai báo `'use client'` ở dòng đầu tiên của file.
  - **Lưu ý với Theme:** Sử dụng hook `useTheme()` từ `next-themes` kết hợp với các class của Tailwind (`dark:bg-gray-800`, `dark:text-white`) để style giao diện.

## 4. CẤU TRÚC THƯ MỤC CHUẨN
- `src/app/` (Chứa các page giao diện Dashboard như `/buses`, `/trips`, `/tickets`)
- `src/components/` (Chứa các component tái sử dụng: Button, Table, Modal...)
- `src/hooks/` (Custom hooks: `useBus.ts`, `useTrip.ts`, `useAuth.ts`...)
- `src/services/` (API calls: `busService.ts`, `tripService.ts`, `authService.ts`...)
- `src/providers/` (Cấu hình Context/Theme)
- `src/types/` (Chứa các Interface/Type TypeScript)
- `src/lib/` (Chứa cấu hình core: `axiosClient.ts`, utils formatter...)

## 5. BẢO MẬT & QUY TẮC NGHIỆP VỤ
- **Axios Interceptor:** Phải luôn cấu hình Axios gửi kèm `Authorization: Bearer <token>` trong header. Bắt lỗi 401 để tự động logout.
- **Xử lý Lỗi:** Bắt buộc hiển thị thông báo lỗi thân thiện cho Admin bằng thư viện Toast.
- **TypeScript:** Định nghĩa rõ ràng kiểu dữ liệu `Interface` cho Request và Response. Không bao giờ sử dụng type `any`.