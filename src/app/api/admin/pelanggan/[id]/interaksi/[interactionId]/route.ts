import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { deleteCustomerInteraction } from '@/lib/data-store';
import { recordAuditLog, AUDIT_ACTIONS } from '@/lib/audit-log';

// DELETE /api/admin/pelanggan/[id]/interaksi/[interactionId]
// Sesi #20: Hapus log interaksi — hanya pembuat atau SUPERADMIN, entri SYSTEM tidak bisa dihapus
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; interactionId: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, interactionId } = await params;

    await deleteCustomerInteraction(interactionId, session.id, session.role);

    await recordAuditLog({
      actorId: session.id,
      actorName: session.name,
      actorRole: session.role,
      action: AUDIT_ACTIONS.DELETE_INTERACTION,
      targetType: 'CustomerInteraction',
      targetId: interactionId,
      metadata: { customerId: id },
    });

    return NextResponse.json({
      success: true,
      message: 'Catatan interaksi berhasil dihapus',
    });
  } catch (error: any) {
    console.error('Error deleting customer interaction:', error);
    const isAuthError =
      error?.message?.includes('izin') || error?.message?.includes('sistem');
    return NextResponse.json(
      { error: error?.message || 'Gagal menghapus catatan interaksi' },
      { status: isAuthError ? 403 : 500 }
    );
  }
}
