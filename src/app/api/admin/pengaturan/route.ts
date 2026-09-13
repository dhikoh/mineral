import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminSession, requireSuperAdminSession } from '@/lib/auth';
import { getSiteSettings, updateSiteSettings } from '@/lib/data-store';
import { recordAuditLog, AUDIT_ACTIONS } from '@/lib/audit-log';

// Sesi #17 (Temuan O): GET mengembalikan data pengaturan dengan perbedaan berbasis role:
// - SUPERADMIN: data lengkap termasuk bankAccounts
// - ADMIN: data operasional saja, bankAccounts di-omit untuk mencegah kebocoran data keuangan
export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settings = await getSiteSettings();

    // RBAC: Sembunyikan data rekening bank dari role ADMIN
    if (session.role !== 'SUPERADMIN') {
      const { bankAccounts: _omit, ...safeSettings } = settings as any;
      return NextResponse.json({
        success: true,
        settings: { ...safeSettings, bankAccounts: [] },
        _rbacNote: 'Data rekening bank hanya tersedia untuk SUPERADMIN.',
      });
    }

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error('Error fetching site settings:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memuat pengaturan situs.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const session = await requireSuperAdminSession();
  if (!session) {
    return NextResponse.json(
      { error: 'Akses ditolak: Hanya SUPERADMIN yang berwenang mengubah pengaturan situs dan nomor rekening transfer.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    // Sesi #17 (Temuan K): Catat perubahan pengaturan — khususnya bankAccounts untuk audit keuangan
    const currentSettings = await getSiteSettings();
    const bankChanged =
      JSON.stringify((currentSettings as any).bankAccounts) !== JSON.stringify(body.bankAccounts);

    const updated = await updateSiteSettings(body);

    await recordAuditLog({
      actorId: session.id,
      actorName: session.name,
      actorRole: session.role,
      action: bankChanged ? AUDIT_ACTIONS.UPDATE_BANK_ACCOUNTS : AUDIT_ACTIONS.UPDATE_SITE_SETTINGS,
      targetType: 'SiteSetting',
      metadata: bankChanged
        ? {
            previousBankAccounts: (currentSettings as any).bankAccounts,
            newBankAccounts: body.bankAccounts,
          }
        : { updatedFields: Object.keys(body) },
    });

    revalidatePath('/');
    revalidatePath('/produk');
    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    console.error('Error updating site settings:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menyimpan pengaturan situs.' },
      { status: 500 }
    );
  }
}
