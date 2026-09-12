import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdminSession } from '@/lib/auth';
import { updateAdminUser, deleteAdminUser } from '@/lib/data-store';
import { recordAuditLog, AUDIT_ACTIONS } from '@/lib/audit-log';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSuperAdminSession();
  if (!session) {
    return NextResponse.json(
      { error: 'Akses ditolak: Hanya SUPERADMIN yang dapat memperbarui akun pengguna.' },
      { status: 403 }
    );
  }

  const { id } = await params;

  try {
    const body = await req.json();

    if (body.role && body.role !== 'ADMIN' && body.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Nilai role tidak valid. Pilihan yang sah: ADMIN atau SUPERADMIN.' },
        { status: 400 }
      );
    }

    // Sesi #17 (Temuan J): Proteksi self-deactivation — SUPERADMIN tidak boleh menonaktifkan dirinya sendiri
    if (id === session.id && body.isActive === false) {
      return NextResponse.json(
        { error: 'SUPERADMIN tidak dapat menonaktifkan akunnya sendiri.' },
        { status: 400 }
      );
    }

    const updated = await updateAdminUser(id, body, session.id);

    // Sesi #17 (Temuan K): Audit log — catat perubahan status aktif secara spesifik
    const action =
      body.isActive === false
        ? AUDIT_ACTIONS.DEACTIVATE_USER
        : body.isActive === true
          ? AUDIT_ACTIONS.ACTIVATE_USER
          : AUDIT_ACTIONS.UPDATE_USER;

    await recordAuditLog({
      actorId: session.id,
      actorName: session.name,
      actorRole: session.role,
      action,
      targetType: 'User',
      targetId: id,
      metadata: {
        updatedFields: Object.keys(body).filter((k) => k !== 'password'),
        targetName: updated.name,
        targetEmail: updated.email,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Akun ${updated.name} berhasil diperbarui.`,
      data: updated,
    });
  } catch (err: any) {
    console.error('Error updating admin user:', err);
    return NextResponse.json(
      { error: err.message || 'Gagal memperbarui pengguna admin.' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSuperAdminSession();
  if (!session) {
    return NextResponse.json(
      { error: 'Akses ditolak: Hanya SUPERADMIN yang dapat menghapus akun pengguna.' },
      { status: 403 }
    );
  }

  const { id } = await params;

  try {
    await deleteAdminUser(id, session.id);

    // Sesi #17 (Temuan K): Audit log penghapusan akun
    await recordAuditLog({
      actorId: session.id,
      actorName: session.name,
      actorRole: session.role,
      action: AUDIT_ACTIONS.DELETE_USER,
      targetType: 'User',
      targetId: id,
    });

    return NextResponse.json({
      success: true,
      message: 'Akun admin berhasil dihapus.',
    });
  } catch (err: any) {
    console.error('Error deleting admin user:', err);
    return NextResponse.json(
      { error: err.message || 'Gagal menghapus pengguna admin.' },
      { status: 400 }
    );
  }
}
