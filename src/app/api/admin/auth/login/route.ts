import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { signAdminToken, COOKIE_NAME } from '@/lib/auth';
import { getClientIp, checkLoginRateLimit, clearLoginAttempts } from '@/lib/rate-limit';
import { recordAuditLog, AUDIT_ACTIONS } from '@/lib/audit-log';

// Sesi #17 (Temuan R): Implementasi rate-limit login dipindahkan ke modul terpusat
// src/lib/rate-limit.ts dengan preset LOGIN (5 percobaan / 15 menit).
// Implementasi lokal duplikat (loginAttempts Map, checkRateLimit, recordFailedAttempt, clearAttempts)
// telah dihapus dari file ini.

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan kata sandi wajib diisi' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const clientIp = getClientIp(req);
    // Key kombinasi IP+email — granularitas sama seperti implementasi lama
    const rateLimitKey = `${clientIp}:${normalizedEmail}`;

    // Periksa batas percobaan login (modul terpusat)
    const rateLimit = checkLoginRateLimit(rateLimitKey);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Terlalu banyak percobaan login yang gagal. Akun/IP ditangguhkan sementara. Silakan coba kembali dalam ${rateLimit.remainingMinutes} menit demi alasan keamanan.`,
        },
        { status: 429 }
      );
    }

    let user: {
      id: string;
      name: string;
      email: string;
      role: string;
      password?: string;
      isActive?: boolean;
    } | null = null;
    let isMatch = false;

    try {
      user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true, name: true, email: true, role: true, password: true, isActive: true },
      });

      if (user && user.password) {
        isMatch = await bcrypt.compare(password, user.password);
      }
    } catch (dbErr: any) {
      console.error(
        JSON.stringify({
          level: 'ERROR',
          event: 'AUTH_DB_UNREACHABLE',
          message: 'Database query failed during admin login',
          error: dbErr?.message || String(dbErr),
          timestamp: new Date().toISOString(),
        })
      );

      // Fallback dev mode HANYA boleh aktif jika diatur secara eksplisit
      const isDevFallbackAllowed =
        process.env.NODE_ENV === 'development' &&
        process.env.ALLOW_DEV_FALLBACK_LOGIN === 'true';

      if (isDevFallbackAllowed && normalizedEmail === 'admin@adably.com') {
        if (password === 'admin123456') {
          console.warn(
            '[SECURITY WARNING] Dev-mode fallback login used. This MUST be disabled in production.'
          );
          user = {
            id: 'seed-admin-01',
            name: 'Super Admin Adably (Dev Fallback)',
            email: 'admin@adably.com',
            role: 'SUPERADMIN',
            isActive: true,
          };
          isMatch = true;
        }
      } else {
        return NextResponse.json(
          { error: 'Layanan autentikasi database tidak dapat dijangkau. Silakan hubungi administrator.' },
          { status: 503 }
        );
      }
    }

    // Cek kredensial tidak valid
    if (!user || !isMatch) {
      // Rekam percobaan gagal ke modul terpusat
      checkLoginRateLimit(rateLimitKey); // akan menaikkan counter gagal
      // Audit log: login gagal (tanpa throw agar tidak gangu flow)
      await recordAuditLog({
        actorId: null,
        actorName: normalizedEmail,
        actorRole: 'UNKNOWN',
        action: AUDIT_ACTIONS.LOGIN_FAILED,
        metadata: { email: normalizedEmail, ip: clientIp, reason: 'invalid_credentials' },
      });
      return NextResponse.json(
        { error: 'Kredensial login tidak valid' },
        { status: 401 }
      );
    }

    // Sesi #17 (Temuan J): Tolak login jika akun dinonaktifkan
    if (user.isActive === false) {
      await recordAuditLog({
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: AUDIT_ACTIONS.LOGIN_FAILED,
        metadata: { email: normalizedEmail, ip: clientIp, reason: 'account_deactivated' },
      });
      return NextResponse.json(
        { error: 'Akun Anda telah dinonaktifkan oleh administrator. Silakan hubungi SUPERADMIN untuk informasi lebih lanjut.' },
        { status: 403 }
      );
    }

    // Login berhasil — reset counter rate limit
    clearLoginAttempts(rateLimitKey);

    // Audit log: login berhasil
    await recordAuditLog({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: AUDIT_ACTIONS.LOGIN_SUCCESS,
      metadata: { email: normalizedEmail, ip: clientIp },
    });

    const token = await signAdminToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    // Set HTTP-only session cookie
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 hari
    });

    return response;
  } catch (error) {
    console.error('Login system error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat proses login' },
      { status: 500 }
    );
  }
}
