/**
 * src/app/api/admin/katalog-pdf/route.ts
 * Sesi #28 — API Route: Generate & Download PDF Katalog Produk
 *
 * GET /api/admin/katalog-pdf
 *   ?categoryId=  (opsional, "" = semua)
 *   &usageId=     (opsional, "" = semua)
 *   &q=           (opsional, search nama produk case-insensitive)
 *   &showPrice=   ("true" | "false", default: "true")
 *   &buyerName=   (opsional, maks 100 char)
 *   &buyerCompany=(opsional, maks 100 char)
 *
 * Keamanan:
 *   - proxy.ts sudah guard /api/admin/:path* dengan HTTP 401 instan
 *   - getAdminSession() sebagai double-guard di dalam route
 *   - Filter produk dilakukan in-memory setelah getProducts() — tidak ada raw SQL
 *   - Query params di-sanitize (trim + maxLength) sebelum dipakai
 */

import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';

export const dynamic = 'force-dynamic';
import fs from 'fs';
import path from 'path';
import { getAdminSession } from '@/lib/auth';
import { getProducts, getCategories, getUsages, getSiteSettings } from '@/lib/data-store';
import type { ProductItem } from '@/lib/data-store';
import { CatalogDocument } from '@/lib/pdf/catalog-template';

// Batas ukuran string dari query param
const MAX_PARAM_LENGTH = 100;

function sanitizeParam(value: string | null, maxLen = MAX_PARAM_LENGTH): string {
  if (!value) return '';
  return value.trim().slice(0, maxLen);
}

// Format nomor referensi: ADL/KAT/YYYY/MMDD-HHMM
function buildRefNumber(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `ADL/KAT/${yyyy}/${mm}${dd}-${hh}${min}`;
}

// Format tanggal untuk display di PDF
function formatDate(date: Date): string {
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  }) + ' WIB';
}

export async function GET(request: NextRequest) {
  // ── 1. Auth Guard ──────────────────────────────────────────────────────
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── 2. Parse & sanitize query params ───────────────────────────────────
  const { searchParams } = request.nextUrl;
  const categoryId   = sanitizeParam(searchParams.get('categoryId'));
  const usageId      = sanitizeParam(searchParams.get('usageId'));
  const q            = sanitizeParam(searchParams.get('q'));
  const showPrice    = searchParams.get('showPrice') !== 'false'; // default true
  const buyerName    = sanitizeParam(searchParams.get('buyerName'));
  const buyerCompany = sanitizeParam(searchParams.get('buyerCompany'));

  // ── 3. Fetch data ───────────────────────────────────────────────────────
  try {
    const [allProducts, settings] = await Promise.all([
      getProducts(),
      getSiteSettings(),
    ]);

    // ── 4. Filter in-memory ─────────────────────────────────────────────
    let products = (allProducts as ProductItem[]).filter((p) => p.isActive !== false);

    // Filter kategori
    if (categoryId) {
      products = products.filter((p) => p.categoryId === categoryId);
    }

    // Filter peruntukan (usages)
    if (usageId) {
      products = products.filter((p) =>
        p.usageIds?.includes(usageId) ||
        p.usages?.some((u: any) => u.usage?.id === usageId || u.usageId === usageId)
      );
    }

    // Filter nama produk (case-insensitive search)
    if (q) {
      const lq = q.toLowerCase();
      products = products.filter((p) =>
        p.name.toLowerCase().includes(lq) ||
        p.description?.toLowerCase().includes(lq) ||
        p.tags?.some((t: string) => t.toLowerCase().includes(lq))
      );
    }

    // Guard: jika tidak ada produk, kembalikan JSON error yang informatif
    if (products.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada produk yang sesuai filter. Silakan ubah kriteria filter.' },
        { status: 404 }
      );
    }

    // ── 5. Build PDF ────────────────────────────────────────────────────
    const refNumber   = buildRefNumber();
    const generatedAt = formatDate(new Date());

    // Resolusi gambar: konversi file lokal ke base64 data URI atau absolute URL
    const baseUrl =
      process.env.COOLIFY_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      request.nextUrl.origin ||
      'https://adably.id';

    const resolvedProducts: ProductItem[] = await Promise.all(
      products.map(async (p) => {
        const rawImg = p.images?.[0];
        let resolvedImg: string | null = null;

        if (rawImg) {
          if (rawImg.startsWith('/')) {
            // Coba baca langsung dari disk container Next.js
            const localPath = path.join(process.cwd(), 'public', rawImg);
            try {
              if (fs.existsSync(localPath)) {
                const ext = path.extname(localPath).toLowerCase();
                const mime =
                  ext === '.png'
                    ? 'image/png'
                    : ext === '.webp'
                    ? 'image/webp'
                    : 'image/jpeg';
                const fileBuf = await fs.promises.readFile(localPath);
                resolvedImg = `data:${mime};base64,${fileBuf.toString('base64')}`;
              }
            } catch (err) {
              console.warn('[katalog-pdf] Gagal membaca gambar lokal:', err);
            }

            // Jika file tidak ada di disk lokal, bentuk URL absolut
            if (!resolvedImg) {
              resolvedImg = `${baseUrl.replace(/\/$/, '')}${rawImg}`;
            }
          } else {
            resolvedImg = rawImg;
          }
        }

        return {
          ...p,
          images: resolvedImg ? [resolvedImg, ...(p.images?.slice(1) || [])] : [],
        };
      })
    );

    const pdfBuffer = await renderToBuffer(
      React.createElement(CatalogDocument, {
        products: resolvedProducts,
        settings,
        showPrice,
        buyerName: buyerName || undefined,
        buyerCompany: buyerCompany || undefined,
        refNumber,
        generatedAt,
      }) as React.ReactElement<any>
    );

    // ── 6. Return PDF binary ────────────────────────────────────────────
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const filename = `katalog-${settings.siteName.toLowerCase().replace(/\s+/g, '-')}-${today}.pdf`;

    // Konversi Buffer → Uint8Array agar kompatibel dengan NextResponse (Next.js 16)
    const uint8 = new Uint8Array(pdfBuffer);

    return new NextResponse(uint8, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(uint8.length),
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    console.error('[katalog-pdf] Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Gagal membuat PDF. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
