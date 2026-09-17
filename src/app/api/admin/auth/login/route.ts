/**
 * POST /api/admin/auth/login
 * P1-09: Fix counter rate limit naik 2× — pakai peekRateLimit + consumeLoginRateLimit
 * P0-05: getClientIp sudah pakai TRUSTED_PROXY_COUNT
 * P2-02: setAdminSessionCookie dari auth.ts (tidak tulis cookie manual)
 * P2-10: COOKIE_NAME dari config.ts via auth.ts
 */
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { signAdminToken, setAdminSessionCookie } from '@/lib/auth';
import {
  getClientIp,
  peekRateLimit,
  consumeLoginRateLimit,
  clearRateLimit,
  checkLoginEmailRateLimit,
  RATE_LIMIT_PRESETS,
} from '@/lib/rate-limit';
import { recordAuditLog, AUDIT_ACTIONS } from '@/lib/audit-log';

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
    const ipEmailKey = `login:${clientIp}:${normalizedEmail}`;
    const emailKey = `login_email:${normalizedEmail}`;

    // P1-09: PEEK dulu — jangan naik counter hanya karena cek status
    const ipEmailLimit = peekRateLimit(ipEmailKey, RATE_LIMIT_PRESETS.LOGIN);
    if (!ipEmailLimit.allowed) {
      return NextResponse.json(
        {
          error: `Terlalu banyak percobaan login yang gagal. Coba lagi dalam ${ipEmailLimit.remainingMinutes} menit.`,
        },
        { status: 429 }
      );
    }

    // P0-05 defense-in-depth: juga cek per-email lintas IP
    const emailLimit = checkLoginEmailRateLimit(emailKey);
    if (!emailLimit.allowed) {
      return NextResponse.json(
        { error: `Akun ini terkunci sementara. Coba lagi dalam ${emailLimit.remainingMinutes} menit.` },
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
      user = await prisma.user.findFirst({
        where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
        select: { id: true, name: true, email: true, role: true, password: true, isActive: true },
      });

      if (user?.password) {
        isMatch = await bcrypt.compare(password, user.password);
      }
    } catch (dbErr: unknown) {
      const err = dbErr as Error;
      console.error(JSON.stringify({
        level: 'ERROR',
        event: 'AUTH_DB_UNREACHABLE',
        message: 'Database query failed during admin login',
        error: err?.message || String(dbErr),
        timestamp: new Date().toISOString(),
      }));

      const isDevFallbackAllowed =
        process.env.NODE_ENV === 'development' &&
        process.env.ALLOW_DEV_FALLBACK_LOGIN === 'true';

      const devEmail = process.env.DEV_FALLBACK_EMAIL || 'admin@adably.com';
      const devPass = process.env.DEV_FALLBACK_PASSWORD || 'admin123456';

      if (isDevFallbackAllowed && normalizedEmail === devEmail && password === devPass) {
        console.warn('[SECURITY WARNING] Dev-mode fallback login used. MUST be disabled in production.');
        user = {
          id: 'seed-admin-01',
          name: 'Super Admin (Dev Fallback)',
          email: devEmail,
          role: 'SUPERADMIN',
          isActive: true,
        };
        isMatch = true;
      } else {
        return NextResponse.json(
          { error: 'Layanan autentikasi tidak dapat dijangkau. Hubungi administrator.' },
          { status: 503 }
        );
      }
    }

    // Kredensial tidak valid → CONSUME counter (naik 1, bukan 2)
    if (!user || !isMatch) {
      consumeLoginRateLimit(ipEmailKey); // P1-09: hanya di sini counter naik
      await recordAuditLog({
        actorId: null,
        actorName: normalizedEmail,
        actorRole: 'UNKNOWN',
        action: AUDIT_ACTIONS.LOGIN_FAILED,
        metadata: { email: normalizedEmail, ip: clientIp, reason: 'invalid_credentials' },
      });
      return NextResponse.json({ error: 'Kredensial login tidak valid' }, { status: 401 });
    }

    // Akun nonaktif
    if (user.isActive === false) {
      consumeLoginRateLimit(ipEmailKey);
      await recordAuditLog({
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: AUDIT_ACTIONS.LOGIN_FAILED,
        metadata: { email: normalizedEmail, ip: clientIp, reason: 'account_deactivated' },
      });
      return NextResponse.json({ error: 'Akun Anda telah dinonaktifkan.' }, { status: 403 });
    }

    // Login berhasil — reset counter, buat token, set cookie
    clearRateLimit(ipEmailKey); // P1-09: reset setelah sukses

    const token = await signAdminToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as 'SUPERADMIN' | 'ADMIN',
      issuedAt: Math.floor(Date.now() / 1000),
    });

    // P2-02 + P2-03a: Pakai helper — tidak tulis cookie manual
    await setAdminSessionCookie(token);

    await recordAuditLog({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: AUDIT_ACTIONS.LOGIN_SUCCESS,
      metadata: { ip: clientIp },
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Login route error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem.' }, { status: 500 });
  }
}
