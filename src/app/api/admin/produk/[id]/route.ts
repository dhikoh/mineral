import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { getProductById, updateProduct, deleteProduct } from '@/lib/data-store';
import { recordAuditLog, AUDIT_ACTIONS } from '@/lib/audit-log';


export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const product = await getProductById(id);
    if (!product) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: product });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal memuat produk' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const {
      name,
      description,
      price,
      stock,
      unit,
      minStock,
      images,
      tags,
      categoryId,
      usageIds,
      isActive,
    } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Nama produk wajib diisi' }, { status: 400 });
    }

    // Sesi #19 (Fix #7): Baca state lama sebelum update untuk deteksi perubahan harga/stok
    const existing = await getProductById(id);
    const oldPrice = existing?.price ?? null;
    const oldStock = existing?.stock ?? null;

    const numMinStock = minStock !== undefined ? Number(minStock) : 50;

    const updated = await updateProduct(id, {
      name: name.trim(),
      description: description ? description.trim() : '',
      price: Number(price),
      stock: Number(stock),
      unit: unit ? String(unit).trim() : 'kg',
      minStock: isNaN(numMinStock) ? 50 : numMinStock,
      images: Array.isArray(images) ? images : [],
      tags: Array.isArray(tags) ? tags : [],
      categoryId,
      usageIds: Array.isArray(usageIds) ? usageIds : [],
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    // Sesi #19 (Fix #7): Rekam audit log jika harga atau stok berubah
    const newPrice = Number(price);
    const newStock = Number(stock);
    const auditPromises: Promise<any>[] = [];

    if (oldPrice !== null && oldPrice !== newPrice) {
      auditPromises.push(
        recordAuditLog({
          actorId: session.id,
          actorName: session.name,
          actorRole: session.role,
          action: AUDIT_ACTIONS.UPDATE_PRODUCT_PRICE,
          targetType: 'Product',
          targetId: id,
          metadata: {
            productName: name.trim(),
            oldPrice,
            newPrice,
            delta: newPrice - oldPrice,
          },
        })
      );
    }

    if (oldStock !== null && oldStock !== newStock) {
      auditPromises.push(
        recordAuditLog({
          actorId: session.id,
          actorName: session.name,
          actorRole: session.role,
          action: AUDIT_ACTIONS.UPDATE_PRODUCT_STOCK,
          targetType: 'Product',
          targetId: id,
          metadata: {
            productName: name.trim(),
            oldStock,
            newStock,
            delta: newStock - oldStock,
          },
        })
      );
    }

    if (auditPromises.length > 0) {
      await Promise.allSettled(auditPromises);
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Produk berhasil diperbarui',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal memperbarui produk' },
      { status: 500 }
    );
  }
}


export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = await params;
    await deleteProduct(id);
    return NextResponse.json({
      success: true,
      message: 'Produk berhasil dihapus',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal menghapus produk' },
      { status: 500 }
    );
  }
}
