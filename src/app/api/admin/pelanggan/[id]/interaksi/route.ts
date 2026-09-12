import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { addCustomerInteraction } from '@/lib/data-store';

// POST /api/admin/pelanggan/[id]/interaksi
// Sesi #20: Tambah log interaksi manual oleh staf
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: customerId } = await params;
    const body = await req.json();

    const { type, summary, relatedOrderId } = body;

    if (!type || !summary) {
      return NextResponse.json(
        { error: 'Tipe dan ringkasan interaksi wajib diisi.' },
        { status: 400 }
      );
    }

    const allowedTypes = ['CALL', 'WHATSAPP', 'EMAIL', 'MEETING', 'SITE_VISIT', 'NOTE'];
    if (!allowedTypes.includes(type)) {
      return NextResponse.json(
        { error: `Tipe interaksi tidak valid. Pilihan: ${allowedTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const interaction = await addCustomerInteraction({
      customerId,
      type,
      summary,
      actorId: session.id,
      actorName: session.name,
      relatedOrderId: relatedOrderId || null,
    });

    return NextResponse.json({
      success: true,
      message: 'Catatan interaksi berhasil disimpan',
      data: interaction,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding customer interaction:', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal menyimpan catatan interaksi' },
      { status: 400 }
    );
  }
}
