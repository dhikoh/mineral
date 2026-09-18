import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/lib/auth';
import { getProducts, createProduct } from '@/lib/data-store';
import { recordAuditLog, AUDIT_ACTIONS } from '@/lib/audit-log';

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || undefined;
    const kategori = searchParams.get('kategori') || undefined;
    // Sesi #19 (Fix #2): Pagination — admin listing saja, storefront tidak pakai ini
    const pageRaw = searchParams.get('page');
    const limitRaw = searchParams.get('limit');
    const page = pageRaw ? parseInt(pageRaw, 10) : undefined;
    const limit = limitRaw ? parseInt(limitRaw, 10) : undefined;

    const products = await getProducts({ q, kategori, page, limit });
    return NextResponse.json({ success: true, data: Array.isArray(products) ? products : (products as any).data, ...(Array.isArray(products) ? {} : { total: (products as any).total, page: (products as any).page, limit: (products as any).limit, totalPages: (products as any).totalPages }) });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal memuat produk' },
      { status: 500 }
    );
  }
}


export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await req.json();
    const {
      name,
      description,
      price,
      stock,
      unit,
      minStock,
      minOrderQty,
      incrementQty,
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
    if (isNaN(numPrice) || numPrice <= 0) {
      return NextResponse.json({ error: 'Harga produk harus lebih besar dari Rp 0' }, { status: 400 });
    }

    const numStock = Number(stock);
    if (isNaN(numStock) || numStock < 0) {
      return NextResponse.json({ error: 'Jumlah stok tidak valid' }, { status: 400 });
    }

    const numMinStock = minStock !== undefined ? Number(minStock) : 50;
    const numMinOrderQty = minOrderQty !== undefined ? Number(minOrderQty) : 1;
    const numIncrementQty = incrementQty !== undefined ? Number(incrementQty) : 1;

    const newProduct = await createProduct({
      name: name.trim(),
      description: description ? description.trim() : '',
      price: numPrice,
      stock: numStock,
      unit: unit ? String(unit).trim() : 'kg',
      minStock: isNaN(numMinStock) ? 50 : numMinStock,
      minOrderQty: isNaN(numMinOrderQty) || numMinOrderQty < 1 ? 1 : Math.floor(numMinOrderQty),
      incrementQty: isNaN(numIncrementQty) || numIncrementQty < 1 ? 1 : Math.floor(numIncrementQty),
      images: Array.isArray(images) ? images : [],
      tags: Array.isArray(tags) ? tags : [],
      categoryId,
      usageIds: Array.isArray(usageIds) ? usageIds : [],
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    await recordAuditLog({
      actorId: session.id,
      actorName: session.name,
      actorRole: session.role,
      action: AUDIT_ACTIONS.CREATE_PRODUCT,
      targetType: 'Product',
      targetId: newProduct.id,
      metadata: {
        productName: newProduct.name,
        price: newProduct.price,
        stock: newProduct.stock,
      },
    });

    revalidatePath('/');
    revalidatePath('/produk');
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
