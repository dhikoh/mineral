import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { getCustomerById, updateCustomer, deleteCustomer } from '@/lib/data-store';
import { recordAuditLog, AUDIT_ACTIONS } from '@/lib/audit-log';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const customer = await getCustomerById(id);
    if (!customer) {
      return NextResponse.json(
        { error: 'Kontak pelanggan tidak ditemukan' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: customer });
  } catch (error: any) {
    console.error('Error fetching customer detail:', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal memuat detail pelanggan' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    // Sesi #20: teruskan actor agar perubahan status dicatat sebagai CustomerInteraction NOTE
    const actor = { id: session.id, name: session.name };
    const updated = await updateCustomer(id, body, actor);

    await recordAuditLog({
      actorId: session.id,
      actorName: session.name,
      actorRole: session.role,
      action: AUDIT_ACTIONS.UPDATE_CUSTOMER,
      targetType: 'Customer',
      targetId: id,
      metadata: {
        customerName: updated.name,
        type: updated.type,
        status: updated.status,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Data pelanggan berhasil diperbarui',
      data: updated,
    });
  } catch (error: any) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal memperbarui data pelanggan' },
      { status: 400 }
    );
  }
}


export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = await params;
    const existing = await getCustomerById(id);
    await deleteCustomer(id);

    await recordAuditLog({
      actorId: session.id,
      actorName: session.name,
      actorRole: session.role,
      action: AUDIT_ACTIONS.DELETE_CUSTOMER,
      targetType: 'Customer',
      targetId: id,
      metadata: {
        customerName: existing?.name,
        customerPhone: existing?.phone,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Kontak pelanggan berhasil dihapus',
    });
  } catch (error: any) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal menghapus kontak pelanggan' },
      { status: 500 }
    );
  }
}
