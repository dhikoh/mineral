import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export function getJwtSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.trim().length < 32) {
    throw new Error(
      '[CRITICAL SECURITY CONFIG] AUTH_SECRET environment variable is missing or shorter than 32 characters. Please configure a strong random secret (>= 32 chars) in .env before starting the application.'
    );
  }
  return new TextEncoder().encode(secret.trim());
}

const COOKIE_NAME = 'adably_admin_token';
const TOKEN_EXPIRY = '7d';

export interface AdminSessionPayload {
  id: string;
  email: string;
  name: string;
  role: string;
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

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export async function setAdminSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 hari
  });
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export function isSuperAdmin(session: AdminSessionPayload | null): boolean {
  return session?.role === 'SUPERADMIN';
}

export function isAdmin(session: AdminSessionPayload | null): boolean {
  return session?.role === 'ADMIN' || session?.role === 'SUPERADMIN';
}

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

export { COOKIE_NAME };

