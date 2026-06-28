import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  const currentPath = request.nextUrl.pathname;
  const isLoginPage = currentPath.startsWith('/login');

  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Cấu hình những route nào Middleware này sẽ chạy qua
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images).*)'],
};