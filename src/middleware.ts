import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'mineral_super_secret_session_jwt_key_2026_min32chars!'
);
const COOKIE_NAME = 'mineral_admin_token';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Hanya periksa rute yang diawali dengan /admin
  if (pathname.startsWith('/admin')) {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    let isValid = false;

    if (token) {
      try {
        await jwtVerify(token, SECRET_KEY);
        isValid = true;
      } catch {
        isValid = false;
      }
    }

    // Jika mengakses halaman login admin
    if (pathname === '/admin/login') {
      if (isValid) {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url));
      }
      return NextResponse.next();
    }

    // Rute /admin lainnya wajib terotentikasi
    if (!isValid) {
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
