/**
 * src/lib/wa-notify.ts
 * Sesi #19 (Fix #4): Template pesan WhatsApp otomatis untuk notifikasi pembeli.
 *
 * Zero-dependency — tidak ada HTTP call keluar, tidak ada biaya API gateway.
 * Teks pesan disisipkan di JSON response API dan di-copy admin untuk dikirim manual ke WA pembeli.
 * Jika di masa depan perlu integrasi API gateway WA (Fonnte/Wablas), tambahkan di sini
 * sebagai driver alternatif tanpa mengubah caller code.
 */

export type WaEventType =
  | 'checkout_success'
  | 'payment_verified'
  | 'payment_rejected'
  | 'order_shipped'
  | 'order_completed';

export interface WaOrderContext {
  orderCode: string;
  buyerName: string;
  buyerPhone: string;
  total: number;
  trackingNumber?: string | null;
  items?: { name: string; qty: number; unit?: string }[];
  siteName?: string;
  csWhatsapp?: string;
  rejectionReason?: string;
}

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

/**
 * Bangun teks pesan WhatsApp sesuai event siklus pesanan.
 * @returns Teks pesan siap-copy, atau null jika event tidak dikenal
 */
export function buildWhatsAppMessage(
  context: WaOrderContext,
  event: WaEventType
): string | null {
  const site = context.siteName || 'Adably';
  const cs = context.csWhatsapp ? `\n📞 CS: ${context.csWhatsapp}` : '';
  const total = formatRupiah(context.total);

  switch (event) {
    case 'checkout_success': {
      const itemList = context.items
        ?.map((i) => `  • ${i.name} (${i.qty} ${i.unit || 'kg'})`)
        .join('\n') || '';
      return (
        `Halo *${context.buyerName}* 👋\n\n` +
        `Terima kasih telah memesan di *${site}*!\n\n` +
        `📋 *Detail Pesanan:*\n` +
        `Kode Pesanan: \`${context.orderCode}\`\n` +
        (itemList ? `Produk:\n${itemList}\n` : '') +
        `Total: *${total}*\n\n` +
        `💳 *Langkah Selanjutnya:*\n` +
        `Silakan lakukan transfer pembayaran sesuai informasi rekening yang tertera, ` +
        `lalu upload bukti transfer di halaman pesanan Anda.\n\n` +
        `🔍 Cek status pesanan: [klik Lacak Pesanan]\n` +
        `Kode: \`${context.orderCode}\`${cs}`
      );
    }

    case 'payment_verified': {
      return (
        `Halo *${context.buyerName}* 👋\n\n` +
        `✅ *Pembayaran Anda Telah Dikonfirmasi!*\n\n` +
        `Kode Pesanan: \`${context.orderCode}\`\n` +
        `Total: *${total}*\n\n` +
        `Pesanan Anda sedang kami proses. Kami akan segera mengirimkan informasi resi pengiriman. ` +
        `Terima kasih atas kepercayaan Anda kepada *${site}*! 🙏${cs}`
      );
    }

    case 'payment_rejected': {
      return (
        `Halo *${context.buyerName}* 👋\n\n` +
        `⚠️ *Bukti Pembayaran Tidak Dapat Diverifikasi*\n\n` +
        `Kode Pesanan: \`${context.orderCode}\`\n` +
        (context.rejectionReason
          ? `Alasan: ${context.rejectionReason}\n\n`
          : '\n') +
        `Mohon upload ulang bukti transfer yang valid di halaman pesanan Anda, ` +
        `atau hubungi kami jika ada pertanyaan.${cs}`
      );
    }

    case 'order_shipped': {
      return (
        `Halo *${context.buyerName}* 👋\n\n` +
        `🚚 *Pesanan Anda Sedang Dalam Perjalanan!*\n\n` +
        `Kode Pesanan: \`${context.orderCode}\`\n` +
        (context.trackingNumber
          ? `No. Resi: *${context.trackingNumber}*\n\n`
          : '\n') +
        `Silakan pantau status pengiriman menggunakan nomor resi di atas. ` +
        `Hubungi kami jika ada kendala dalam proses pengiriman.${cs}`
      );
    }

    case 'order_completed': {
      return (
        `Halo *${context.buyerName}* 👋\n\n` +
        `🎉 *Pesanan Selesai — Terima Kasih!*\n\n` +
        `Kode Pesanan: \`${context.orderCode}\`\n\n` +
        `Semoga produk yang Anda terima sesuai harapan. ` +
        `Jika ada kebutuhan selanjutnya, kami siap melayani Anda kembali di *${site}*. 🙏${cs}`
      );
    }

    default:
      return null;
  }
}

/**
 * Sesi #21: Bangun teks pesan WhatsApp ke admin/CS saat ada penawaran jual baru masuk.
 * Pesan ini dikirim secara manual oleh sistem atau bisa diintegrasikan ke WA gateway.
 */
export interface WaSellOfferContext {
  name: string;
  company?: string | null;
  phone: string;
  commodityName: string;
  estimatedVolume?: string | null;
  priceExpected?: string | null;
  province?: string | null;
  siteName?: string;
}

export function buildSellOfferWaMessage(ctx: WaSellOfferContext): string {
  const site = ctx.siteName || 'Adably';
  const lines = [
    `🔔 *Penawaran Jual Komoditas Baru — ${site}*`,
    ``,
    `👤 *Penawar:* ${ctx.name}${ctx.company ? ` (${ctx.company})` : ''}`,
    `📞 *WhatsApp:* ${ctx.phone}`,
    ctx.province ? `📍 *Provinsi:* ${ctx.province}` : null,
    ``,
    `🪨 *Komoditas:* ${ctx.commodityName}`,
    ctx.estimatedVolume ? `📦 *Volume:* ${ctx.estimatedVolume}` : null,
    ctx.priceExpected ? `💰 *Harga Harapan:* ${ctx.priceExpected}` : null,
    ``,
    `➡️ Cek detail di Dashboard Admin > Penawaran Jual`,
  ];
  return lines.filter(Boolean).join('\n');
}
