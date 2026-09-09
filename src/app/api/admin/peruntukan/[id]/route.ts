import { NextRequest, NextResponse } from 'next/server';
import { updateUsage, deleteUsage } from '@/lib/data-store';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Nama peruntukan wajib diisi' },
        { status: 400 }
      );
    }

    const updated = await updateUsage(id, { name: name.trim() });
    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Peruntukan berhasil diperbarui',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal memperbarui peruntukan' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteUsage(id);
    return NextResponse.json({
      success: true,
      message: 'Peruntukan berhasil dihapus',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal menghapus peruntukan' },
      { status: 500 }
    );
  }
}
