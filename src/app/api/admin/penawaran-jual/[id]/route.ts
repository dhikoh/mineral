import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { getSellOfferById, updateSellOffer } from '@/lib/data-store';
import type { SellOfferStatus } from '@/lib/data-store';
import { recordAuditLog, AUDIT_ACTIONS } from '@/lib/audit-log';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const offer = await getSellOfferById(id);
  if (!offer) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
  return NextResponse.json({ success: true, data: offer });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    const body = await req.json();
    const { status, adminNotes } = body;

    const VALID_STATUSES: SellOfferStatus[] = ['BARU', 'DIHUBUNGI', 'DIVERIFIKASI', 'DITOLAK'];
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 });
    }

    const updated = await updateSellOffer(id, {
      status: status as SellOfferStatus | undefined,
      adminNotes: adminNotes !== undefined ? String(adminNotes) : undefined,
    });

    await recordAuditLog({
      actorId: session.id,
      actorName: session.name,
      actorRole: session.role,
      action: AUDIT_ACTIONS.UPDATE_SELL_OFFER_STATUS,
      targetType: 'SellOffer',
      targetId: id,
      metadata: {
        newStatus: status || null,
        adminNotes: adminNotes ?? null,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Gagal memperbarui' }, { status: 500 });
  }
}
