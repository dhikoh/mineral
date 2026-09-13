import { NextRequest, NextResponse } from 'next/server';
import { createSellOffer, getSiteSettings } from '@/lib/data-store';
import { checkSellOfferRateLimit, getClientIp } from '@/lib/rate-limit';
import { buildSellOfferWaMessage } from '@/lib/wa-notify';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = checkSellOfferRateLimit(ip);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Terlalu banyak pengiriman. Silakan coba lagi dalam ${rateLimit.remainingMinutes} menit.` },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { name, company, phone, email, province, commodityName, commoditySpec, estimatedVolume, priceExpected, photoUrls } = body;

    if (!name || typeof name !== 'string' || !name.trim())
      return NextResponse.json({ error: 'Nama kontak wajib diisi' }, { status: 400 });
    if (!phone || typeof phone !== 'string' || !phone.trim())
      return NextResponse.json({ error: 'Nomor WhatsApp wajib diisi' }, { status: 400 });
    if (!commodityName || typeof commodityName !== 'string' || !commodityName.trim())
      return NextResponse.json({ error: 'Nama komoditas wajib diisi' }, { status: 400 });

    const offer = await createSellOffer({
      name: name.trim(), company: company?.trim() || undefined,
      phone: phone.trim(), email: email?.trim() || undefined,
      province: province?.trim() || undefined,
      commodityName: commodityName.trim(), commoditySpec: commoditySpec?.trim() || undefined,
      estimatedVolume: estimatedVolume?.trim() || undefined,
      priceExpected: priceExpected?.trim() || undefined,
      photoUrls: Array.isArray(photoUrls) ? photoUrls : [],
    });

    let settings: any = null;
    try { settings = await getSiteSettings(); } catch {}

    const waMessage = buildSellOfferWaMessage({
      name: offer.name, company: offer.company, phone: offer.phone,
      commodityName: offer.commodityName, estimatedVolume: offer.estimatedVolume,
      priceExpected: offer.priceExpected, province: offer.province, siteName: settings?.siteName,
    });

    return NextResponse.json({
      success: true, data: { id: offer.id },
      message: 'Penawaran Anda berhasil dikirim. Tim kami akan menghubungi Anda segera.',
      _waNotify: { to: settings?.csWhatsapp || null, message: waMessage },
    }, { status: 201 });
  } catch (error: any) {
    console.error('[/api/jual POST]', error);
    return NextResponse.json({ error: error?.message || 'Gagal menyimpan penawaran' }, { status: 500 });
  }
}
