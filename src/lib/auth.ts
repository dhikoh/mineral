/**
 * src/lib/auth.ts
 * P2-02: Pakai setAdminSessionCookie / clearAdminSessionCookie (hapus penulisan manual duplikat)
 * P2-03a: Satu fungsi cookie — login & logout pakai helper ini
 * P2-07: Role diambil dari DB bukan JWT; invalidasi session saat DB mati di produksi
 */

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { getAdminCookieName } from './config';
import { isProduction } from './env';

// ─── Konstanta ────────────────────────────────────────────────────────────────

export const COOKIE_NAME = getAdminCookieName(); // P2-10: dari config.ts
const TOKEN_EXPIRY = '7d';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminSessionPayload {
  id: string;
  name: string;
  email: string;
  role: 'SUPERADMIN' | 'ADMIN';
  issuedAt?: number;
}

// ─── JWT Helpers (edge-safe) ──────────────────────────────────────────────────

export function getJwtSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.trim().length < 32) {
    throw new Error(
      '[CRITICAL SECURITY CONFIG] AUTH_SECRET environment variable is missing or shorter than 32 characters.'
    );
  }
  return new TextEncoder().encode(secret.trim());
}

export async function signAdminToken(payload: AdminSessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(getJwtSecretKey());
}

export async function verifyAdminToken(token: string): Promise<AdminSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    return payload as unknown as AdminSessionPayload;
  } catch {
    return null;
  }
}

// ─── Cookie Helpers ───────────────────────────────────────────────────────────

/**
 * P2-02 + P2-03a: Satu-satunya fungsi yang menulis cookie sesi admin.
 * Login route WAJIB menggunakan ini — jangan tulis cookie manual.
 */
export async function setAdminSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 hari
  });
}

/**
 * P2-02 + P2-03a: Satu-satunya fungsi yang menghapus cookie sesi admin.
 * Logout route WAJIB menggunakan ini.
 */
export async function clearAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// ─── Session Management ───────────────────────────────────────────────────────

/**
 * P2-07: Verifikasi sesi lengkap — JWT + validasi DB.
 * Role diambil dari DB (bukan JWT) agar perubahan role efektif seketika.
 * Di produksi: DB unreachable → tolak sesi (bukan loloskan).
 */
export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const jwtPayload = await verifyAdminToken(token);
    if (!jwtPayload || !jwtPayload.id) return null;

    // P2-07: Validasi ulang dari DB — dapatkan isActive + role terkini
    const { prisma } = await import('./db');
    const user = await prisma.user.findUnique({
      where: { id: jwtPayload.id },
      select: { isActive: true, role: true, passwordChangedAt: true },
    });

    if (!user || !user.isActive) return null;

    // P2-07: Invalidasi token yang diterbitkan sebelum password diubah
    if (user.passwordChangedAt && jwtPayload.issuedAt) {
      const passwordChangedMs = user.passwordChangedAt.getTime();
      const tokenIssuedMs = jwtPayload.issuedAt * 1000;
      if (tokenIssuedMs < passwordChangedMs) return null;
    }

    // Return payload dengan role DARI DB (bukan dari JWT)
    return {
      ...jwtPayload,
      role: user.role as AdminSessionPayload['role'],
    };
  } catch (err) {
    // P2-07: Di produksi, DB unreachable = tolak sesi
    if (isProduction()) return null;
    // Di development, log dan loloskan berdasarkan JWT saja (untuk dev tanpa DB)
    console.warn('[AUTH] DB unavailable in dev, falling back to JWT-only session:', err);
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get(COOKIE_NAME)?.value;
      if (!token) return null;
      return await verifyAdminToken(token);
    } catch {
      return null;
    }
  }
}

/**
 * P2-02: Dipakai di semua route /api/admin/** sebagai guard utama.
 * Memastikan isAdmin benar-benar berjalan (bukan hanya cek token ada).
 */
export async function requireAdminSession(): Promise<AdminSessionPayload | null> {
  const session = await getAdminSession();
  if (!session || !isAdmin(session)) return null;
  return session;
}

export async function requireSuperAdminSession(): Promise<AdminSessionPayload | null> {
  const session = await getAdminSession();
  if (!session || !isSuperAdmin(session)) return null;
  return session;
}

// ─── Role Helpers ─────────────────────────────────────────────────────────────

export function isSuperAdmin(session: AdminSessionPayload | null): boolean {
  return session?.role === 'SUPERADMIN';
}

export function isAdmin(session: AdminSessionPayload | null): boolean {
  return session?.role === 'ADMIN' || session?.role === 'SUPERADMIN';
}

export { COOKIE_NAME as ADMIN_COOKIE_NAME };
