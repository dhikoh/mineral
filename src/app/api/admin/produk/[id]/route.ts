import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/lib/auth';
import { getProductById, updateProduct, deleteProduct } from '@/lib/data-store';
import { recordAuditLog, AUDIT_ACTIONS } from '@/lib/audit-log';
import { deleteMedia } from '@/lib/storage';


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

    // Sesi #19 (Fix #7): Baca state lama sebelum update untuk deteksi perubahan harga/stok
    const existing = await getProductById(id);
    const oldPrice = existing?.price ?? null;
    const oldStock = existing?.stock ?? null;

    const numMinStock = minStock !== undefined ? Number(minStock) : 50;
    const numMinOrderQty = minOrderQty !== undefined ? Number(minOrderQty) : 1;
    const numIncrementQty = incrementQty !== undefined ? Number(incrementQty) : 1;

    const updated = await updateProduct(id, {
      name: name.trim(),
      description: description ? description.trim() : '',
      price: Number(price),
      stock: Number(stock),
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

    // Sesi #19 (Fix #7): Rekam audit log jika harga atau stok berubah
    const newPrice = Number(price);
    const newStock = Number(stock);
    const auditPromises: Promise<any>[] = [
      recordAuditLog({
        actorId: session.id,
        actorName: session.name,
        actorRole: session.role,
        action: AUDIT_ACTIONS.UPDATE_PRODUCT,
        targetType: 'Product',
        targetId: id,
        metadata: {
          productName: name.trim(),
          price: newPrice,
          stock: newStock,
        },
      }),
    ];

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

    revalidatePath('/');
    revalidatePath('/produk');
    revalidatePath('/produk/' + updated.slug);
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
    const existing = await getProductById(id).catch(() => null);
    await deleteProduct(id);

    // P2-E: Bersihkan berkas media gambar terkait di storage agar tidak menjadi media orphan
    if (existing?.images && Array.isArray(existing.images)) {
      for (const imgUrl of existing.images) {
        if (typeof imgUrl === 'string' && imgUrl) {
          deleteMedia(imgUrl).catch(() => {});
        }
      }
    }

    await recordAuditLog({
      actorId: session.id,
      actorName: session.name,
      actorRole: session.role,
      action: AUDIT_ACTIONS.DELETE_PRODUCT,
      targetType: 'Product',
      targetId: id,
      metadata: {
        productName: existing?.name || null,
      },
    });

    revalidatePath('/');
    revalidatePath('/produk');
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
