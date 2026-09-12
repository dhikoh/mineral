import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdminSession } from '@/lib/auth';
import { updateAdminUser, deleteAdminUser } from '@/lib/data-store';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSuperAdminSession();
  if (!session) {
    return NextResponse.json(
      { error: 'Akses ditolak: Hanya SUPERADMIN yang dapat memperbarui akun pengguna.' },
      { status: 403 }
    );
  }

  const { id } = await params;

  try {
    const body = await req.json();
    if (body.role && body.role !== 'ADMIN' && body.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Nilai role tidak valid. Pilihan yang sah: ADMIN atau SUPERADMIN.' },
        { status: 400 }
      );
    }
    const updated = await updateAdminUser(id, body, session.id);

    return NextResponse.json({
      success: true,
      message: `Akun ${updated.name} berhasil diperbarui.`,
      data: updated,
    });
  } catch (err: any) {
    console.error('Error updating admin user:', err);
    return NextResponse.json(
      { error: err.message || 'Gagal memperbarui pengguna admin.' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSuperAdminSession();
  if (!session) {
    return NextResponse.json(
      { error: 'Akses ditolak: Hanya SUPERADMIN yang dapat menghapus akun pengguna.' },
      { status: 403 }
    );
  }

  const { id } = await params;

  try {
    await deleteAdminUser(id, session.id);
    return NextResponse.json({
      success: true,
      message: 'Akun admin berhasil dihapus.',
    });
  } catch (err: any) {
    console.error('Error deleting admin user:', err);
    return NextResponse.json(
      { error: err.message || 'Gagal menghapus pengguna admin.' },
      { status: 400 }
    );
  }
}
