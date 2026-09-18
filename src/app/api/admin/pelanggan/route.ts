import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { getCustomers, createCustomer } from '@/lib/data-store';
import { recordAuditLog, AUDIT_ACTIONS } from '@/lib/audit-log';

export async function GET(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || undefined;
    const type = searchParams.get('type') || undefined;
    const status = searchParams.get('status') || undefined;
    // Sesi #19 (Fix #2): Pagination
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const result = await getCustomers({ q, type, status, page, limit });
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error fetching admin customers:', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal memuat data pelanggan' },
      { status: 500 }
    );
  }
}


export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await req.json();
    const {
      name,
      phone,
      company,
      email,
      address,
      type,
      status,
      source,
      preferredCommodity,
      estimatedVolume,
      notes,
    } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Nama kontak / PIC wajib diisi.' },
        { status: 400 }
      );
    }

    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return NextResponse.json(
        { error: 'Nomor telepon / WhatsApp wajib diisi.' },
        { status: 400 }
      );
    }

    const newCustomer = await createCustomer({
      name: name.trim(),
      phone: phone.trim(),
      company: company?.trim() || null,
      email: email?.trim() || null,
      address: address?.trim() || null,
      type: type || 'PROSPECT',
      status: status || 'BARU',
      source: source || 'MANUAL_ADMIN',
      preferredCommodity: preferredCommodity?.trim() || null,
      estimatedVolume: estimatedVolume?.trim() || null,
      notes: notes?.trim() || null,
    });

    await recordAuditLog({
      actorId: session.id,
      actorName: session.name,
      actorRole: session.role,
      action: AUDIT_ACTIONS.CREATE_CUSTOMER,
      targetType: 'Customer',
      targetId: newCustomer.id,
      metadata: {
        customerName: newCustomer.name,
        customerPhone: newCustomer.phone,
        type: newCustomer.type,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Kontak pelanggan/prospek berhasil ditambahkan.',
      data: newCustomer,
    });
  } catch (error: any) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal menambahkan kontak pelanggan' },
      { status: 400 }
    );
  }
}
