/**
 * POST /api/admin/auth/logout
 * P2-02: Pakai clearAdminSessionCookie helper (tidak tulis cookie manual)
 * P2-12: Catat LOGOUT ke audit log
 */
import { NextResponse } from 'next/server';
import { clearAdminSessionCookie, getAdminSession } from '@/lib/auth';
import { recordAuditLog, AUDIT_ACTIONS } from '@/lib/audit-log';

export async function POST() {
  try {
    // Ambil session sebelum dihapus untuk audit log
    const session = await getAdminSession();

    // P2-02: Pakai helper — satu-satunya tempat yang boleh hapus cookie
    await clearAdminSessionCookie();

    // P2-12: Catat logout ke audit log
    if (session) {
      await recordAuditLog({
        actorId: session.id,
        actorName: session.name,
        actorRole: session.role,
        action: AUDIT_ACTIONS.LOGOUT,
        metadata: { email: session.email },
      }).catch(err => console.error('Audit log logout error:', err));
    }

    return NextResponse.json({
      success: true,
      message: 'Berhasil keluar dari sesi admin',
    });
  } catch {
    // Tetap hapus cookie meski ada error
    await clearAdminSessionCookie().catch(() => null);
    return NextResponse.json({ success: true, message: 'Sesi dihapus.' });
  }
}
