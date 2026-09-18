import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/lib/auth';
import { getSiteSettings, updateSiteSettings } from '@/lib/data-store';
import { recordAuditLog, AUDIT_ACTIONS } from '@/lib/audit-log';

// Sesi #17 (Temuan O) & P1-B: GET mengembalikan data pengaturan dengan perbedaan berbasis role:
// - SUPERADMIN: data lengkap termasuk bankAccounts dan parameter finansial B2B
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
        role: session.role,
        settings: { ...safeSettings, bankAccounts: [] },
        _rbacNote: 'Data rekening bank dan konfigurasi finansial hanya dapat diubah oleh SUPERADMIN.',
      });
    }

    return NextResponse.json({ success: true, role: session.role, settings });
  } catch (error: any) {
    console.error('Error fetching site settings:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memuat pengaturan situs.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const isSuperAdmin = session.role === 'SUPERADMIN';

    // Sensitive financial / payment fields restricted to SUPERADMIN
    const FINANCIAL_FIELDS = [
      'bankAccounts',
      'paymentToleranceAmount',
      'defaultTaxRate',
      'taxEnabled',
      'auditRetentionDays',
      'lowStockAlertThreshold',
    ];

    if (!isSuperAdmin) {
      const attemptedFinancialUpdate = FINANCIAL_FIELDS.some(
        (field) => body[field] !== undefined
      );
      if (attemptedFinancialUpdate) {
        return NextResponse.json(
          {
            error:
              'Akses ditolak: Hanya SUPERADMIN yang berwenang mengubah rekening bank, toleransi pembayaran, pajak, dan retensi audit.',
          },
          { status: 403 }
        );
      }
    }

    // Whitelist sanitization
    const allowedGeneralFields = [
      'siteName',
      'tagline',
      'logoUrl',
      'faviconUrl',
      'primaryColor',
      'csWhatsapp',
      'csEmail',
      'csOperationalHours',
      'address',
      'footerText',
      'shippingPolicy',
    ];

    const safeUpdateData: Record<string, any> = {};
    for (const key of allowedGeneralFields) {
      if (body[key] !== undefined) {
        safeUpdateData[key] = body[key];
      }
    }

    if (isSuperAdmin) {
      if (body.bankAccounts !== undefined) {
        if (!Array.isArray(body.bankAccounts)) {
          return NextResponse.json({ error: 'Format rekening bank tidak valid.' }, { status: 400 });
        }
        safeUpdateData.bankAccounts = body.bankAccounts;
      }
      if (body.paymentToleranceAmount !== undefined) {
        safeUpdateData.paymentToleranceAmount = Math.max(0, Number(body.paymentToleranceAmount) || 0);
      }
      if (body.defaultTaxRate !== undefined) {
        safeUpdateData.defaultTaxRate = Math.max(0, Number(body.defaultTaxRate) || 0);
      }
      if (body.taxEnabled !== undefined) {
        safeUpdateData.taxEnabled = Boolean(body.taxEnabled);
      }
      if (body.auditRetentionDays !== undefined) {
        safeUpdateData.auditRetentionDays = Math.max(30, Number(body.auditRetentionDays) || 365);
      }
      if (body.lowStockAlertThreshold !== undefined) {
        safeUpdateData.lowStockAlertThreshold = Math.max(0, Number(body.lowStockAlertThreshold) || 50);
      }
    }

    const currentSettings = await getSiteSettings();
    const bankChanged =
      isSuperAdmin &&
      body.bankAccounts !== undefined &&
      JSON.stringify((currentSettings as any).bankAccounts) !== JSON.stringify(safeUpdateData.bankAccounts);

    const updated = await updateSiteSettings(safeUpdateData);

    await recordAuditLog({
      actorId: session.id,
      actorName: session.name,
      actorRole: session.role,
      action: bankChanged ? AUDIT_ACTIONS.UPDATE_BANK_ACCOUNTS : AUDIT_ACTIONS.UPDATE_SITE_SETTINGS,
      targetType: 'SiteSetting',
      metadata: bankChanged
        ? {
            previousBankAccounts: (currentSettings as any).bankAccounts,
            newBankAccounts: safeUpdateData.bankAccounts,
          }
        : { updatedFields: Object.keys(safeUpdateData) },
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
