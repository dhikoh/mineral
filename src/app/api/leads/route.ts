import { NextResponse } from 'next/server';
import { createOrUpdateLead } from '@/lib/data-store';
import { getClientIp, checkLeadsRateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    // 1. Terapkan Rate Limiting anti-spam RFQ
    const clientIp = getClientIp(req);
    const rateLimit = checkLeadsRateLimit(clientIp);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Batas pengiriman penawaran terlampaui. Alamat IP Anda ditangguhkan sementara. Silakan coba dalam ${rateLimit.remainingMinutes} menit.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { name, phone, company, email, address, preferredCommodity, estimatedVolume, notes } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Nama lengkap / perwakilan PIC wajib diisi.' },
        { status: 400 }
      );
    }

    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return NextResponse.json(
        { error: 'Nomor WhatsApp aktif wajib diisi untuk pengiriman penawaran resmi.' },
        { status: 400 }
      );
    }

    const result = await createOrUpdateLead({
      name: name.trim(),
      phone: phone.trim(),
      company: company?.trim() || null,
      email: email?.trim() || null,
      address: address?.trim() || null,
      preferredCommodity: preferredCommodity?.trim() || null,
      estimatedVolume: estimatedVolume?.trim() || null,
      notes: notes?.trim() || null,
    });

    // 2. Cegah kebocoran data pelanggan (PII): jangan kembalikan objek customer penuh ke publik
    return NextResponse.json({
      success: true,
      message: result.isNew
        ? 'Permintaan penawaran resmi berhasil dikirim. Tim spesialis Adably akan segera menghubungi WhatsApp Anda.'
        : 'Permintaan penawaran tambahan berhasil dicatat. Tim sales kami akan segera menindaklanjuti kebutuhan terbaru Anda.',
    });
  } catch (error: any) {
    console.error('Error submitting RFQ lead:', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal mengirim permintaan penawaran. Silakan coba beberapa saat lagi.' },
      { status: 500 }
    );
  }
}
