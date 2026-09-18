import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getAdminCookieName } from './lib/config';

/**
 * src/proxy.ts
 * P2-10: COOKIE_NAME dari config.ts (tidak hardcode 'admin_token')
 * P2-03d: Verifikasi JWT menggunakan fungsi terpusat (sama logika dengan auth.ts)
 * P2-16: Proxy hanya verifikasi tanda tangan JWT — role check di Server Components
 */

function getJwtSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.trim().length < 32) {
    throw new Error(
      '[CRITICAL SECURITY CONFIG] AUTH_SECRET environment variable is missing or shorter than 32 characters.'
    );
  }
  return new TextEncoder().encode(secret.trim());
}

const COOKIE_NAME = getAdminCookieName();

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Proteksi endpoint API Admin (/api/admin/*)
  if (pathname.startsWith('/api/admin')) {
    // Whitelist endpoint publik
    if (
      pathname === '/api/admin/auth/login' ||
      pathname === '/api/admin/auth/logout'
    ) {
      return NextResponse.next();
    }

    let token = req.cookies.get(COOKIE_NAME)?.value;
    const authHeader = req.headers.get('authorization');
    if (!token && authHeader?.startsWith('Bearer ')) {
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

  // 2. Proteksi Halaman Admin (/admin/*)
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

    if (pathname === '/admin/login') {
      if (isValid) return NextResponse.redirect(new URL('/admin/dashboard', req.url));
      return NextResponse.next();
    }

    if (!isValid) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
