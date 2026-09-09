import { NextRequest, NextResponse } from 'next/server';
import { getProducts, createProduct } from '@/lib/data-store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || undefined;
    const kategori = searchParams.get('kategori') || undefined;

    const products = await getProducts({ q, kategori });
    return NextResponse.json({ success: true, data: products });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal memuat produk' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      description,
      price,
      stock,
      images,
      tags,
      categoryId,
      usageIds,
      isActive,
    } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Nama produk wajib diisi' }, { status: 400 });
    }

    if (!categoryId) {
      return NextResponse.json({ error: 'Kategori wajib dipilih' }, { status: 400 });
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return NextResponse.json({ error: 'Harga produk tidak valid' }, { status: 400 });
    }

    const numStock = Number(stock);
    if (isNaN(numStock) || numStock < 0) {
      return NextResponse.json({ error: 'Jumlah stok tidak valid' }, { status: 400 });
    }

    const newProduct = await createProduct({
      name: name.trim(),
      description: description ? description.trim() : '',
      price: numPrice,
      stock: numStock,
      images: Array.isArray(images) ? images : [],
      tags: Array.isArray(tags) ? tags : [],
      categoryId,
      usageIds: Array.isArray(usageIds) ? usageIds : [],
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    return NextResponse.json(
      { success: true, data: newProduct, message: 'Produk berhasil ditambahkan' },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal menambahkan produk' },
      { status: 500 }
    );
  }
}
