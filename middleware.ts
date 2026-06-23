import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. Lấy token từ Cookie (thường khi login thành công, bạn phải lưu token vào cookie)
  // Lưu ý: Middleware chạy trên Server Edge nên không đọc được localStorage đâu nhé!
  const token = request.cookies.get('accessToken')?.value;
  
  const currentPath = request.nextUrl.pathname;
  const isLoginPage = currentPath.startsWith('/login');

  // 2. Nếu CHƯA CÓ token và đang cố vào các trang nội bộ -> Đuổi về /login
  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. Nếu ĐÃ CÓ token mà lại cố tình vào trang /login -> Đẩy vào Dashboard (trang chủ)
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 4. Hợp lệ thì cho qua
  return NextResponse.next();
}

// Cấu hình những route nào Middleware này sẽ chạy qua
export const config = {
  // Matcher bỏ qua các file tĩnh (ảnh, css, font, API nội bộ) để web chạy mượt
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images).*)'],
};