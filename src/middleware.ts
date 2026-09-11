import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

function getJwtSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.trim().length < 32) {
    throw new Error(
      '[CRITICAL SECURITY CONFIG] AUTH_SECRET environment variable is missing or shorter than 32 characters.'
    );
  }
  return new TextEncoder().encode(secret.trim());
}

const COOKIE_NAME = 'mineral_admin_token';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Proteksi endpoint API Admin (/api/admin/*)
  if (pathname.startsWith('/api/admin')) {
    // Whitelist endpoint autentikasi publik (login & logout)
    if (pathname === '/api/admin/auth/login' || pathname === '/api/admin/auth/logout') {
      return NextResponse.next();
    }

    // Ambil token dari cookie atau Authorization header
    let token = req.cookies.get(COOKIE_NAME)?.value;
    const authHeader = req.headers.get('authorization');
    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }

    let isValid = false;
    if (token) {
      try {
        await jwtVerify(token, getJwtSecretKey());
        isValid = true;
      } catch {
        isValid = false;
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { error: 'Unauthorized: Sesi admin tidak valid atau belum login' },
        { status: 401 }
      );
    }

    return NextResponse.next();
  }

  // 2. Proteksi Halaman Antarmuka Admin (/admin/*)
  if (pathname.startsWith('/admin')) {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    let isValid = false;

    if (token) {
      try {
        await jwtVerify(token, getJwtSecretKey());
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
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
