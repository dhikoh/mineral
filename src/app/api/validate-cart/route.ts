/**
 * POST /api/validate-cart
 * P2-05: Tambah rate limit VALIDATE_CART, batasi maks 50 item, ganti N query → findMany
 * P2-08: Perbaiki N+1 query — satu findMany menggantikan loop
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getClientIp, checkValidateCartRateLimit } from '@/lib/rate-limit';

const MAX_CART_ITEMS = 50;

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);
  const rateLimit = checkValidateCartRateLimit(`validate_cart:${clientIp}`);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan. Coba lagi sebentar.' },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ valid: true, items: [] });
    }

    // P2-05: Batasi maks item per request
    if (items.length > MAX_CART_ITEMS) {
      return NextResponse.json(
        { error: `Keranjang belanja melebihi batas maksimum ${MAX_CART_ITEMS} item.` },
        { status: 400 }
      );
    }

    const productIds = [
      ...new Set(
        items
          .map((i: { productId?: string; id?: string }) => i.productId || i.id)
          .filter((id): id is string => Boolean(id))
      ),
    ];

    // P2-08: Satu query findMany menggantikan N query individual
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      select: { id: true, name: true, price: true, stock: true, unit: true, isActive: true, minOrderQty: true, incrementQty: true },
    });

    const productMap = new Map(products.map(p => [p.id, p]));

    const validatedItems = items.map((item: { productId?: string; id?: string; qty: number }) => {
      const pid = item.productId || item.id || '';
      const product = productMap.get(pid);

      if (!product) {
        return {
          productId: pid,
          valid: false,
          reason: 'Produk tidak tersedia atau telah dihapus.',
          qty: item.qty,
        };
      }

      if (item.qty > product.stock) {
        return {
          productId: item.productId,
          valid: false,
          reason: `Stok tidak mencukupi. Stok tersedia: ${product.stock} ${product.unit}.`,
          availableStock: product.stock,
          qty: item.qty,
          product: { name: product.name, price: product.price, unit: product.unit },
        };
      }

      if (item.qty < product.minOrderQty) {
        return {
          productId: item.productId,
          valid: false,
          reason: `Minimum order ${product.minOrderQty} ${product.unit}.`,
          qty: item.qty,
          product: { name: product.name, price: product.price, unit: product.unit, minOrderQty: product.minOrderQty },
        };
      }

      return {
        productId: item.productId,
        valid: true,
        qty: item.qty,
        availableStock: product.stock,
        product: {
          name: product.name,
          price: product.price,
          unit: product.unit,
          minOrderQty: product.minOrderQty,
          incrementQty: product.incrementQty,
        },
      };
    });

    const allValid = validatedItems.every(i => i.valid);
    const errors = validatedItems.filter(i => !i.valid).map(i => i.reason).filter(Boolean);

    return NextResponse.json({ valid: allValid, items: validatedItems, errors });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error validating cart:', err);
    return NextResponse.json({ error: 'Gagal memvalidasi keranjang belanja.' }, { status: 500 });
  }
}
