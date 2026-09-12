import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdminSession } from '@/lib/auth';
import { getAdminUsers, createAdminUser } from '@/lib/data-store';

export async function GET() {
  const session = await requireSuperAdminSession();
  if (!session) {
    return NextResponse.json(
      { error: 'Akses ditolak: Hanya SUPERADMIN yang dapat melihat daftar pengguna admin.' },
      { status: 403 }
    );
  }

  try {
    const users = await getAdminUsers();
    return NextResponse.json({ success: true, data: users });
  } catch (err: any) {
    console.error('Error fetching admin users:', err);
    return NextResponse.json(
      { error: err.message || 'Gagal memuat daftar pengguna admin.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await requireSuperAdminSession();
  if (!session) {
    return NextResponse.json(
      { error: 'Akses ditolak: Hanya SUPERADMIN yang dapat mendaftarkan akun staf/admin baru.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nama, email, dan kata sandi wajib diisi.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Kata sandi minimal 8 karakter.' },
        { status: 400 }
      );
    }

    if (role && role !== 'ADMIN' && role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Nilai role tidak valid. Pilihan yang sah: ADMIN atau SUPERADMIN.' },
        { status: 400 }
      );
    }

    const cleanRole = role === 'SUPERADMIN' ? 'SUPERADMIN' : 'ADMIN';

    const newUser = await createAdminUser({
      name,
      email,
      password,
      role: cleanRole,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Pengguna admin ${newUser.name} berhasil ditambahkan.`,
        data: newUser,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Error creating admin user:', err);
    return NextResponse.json(
      { error: err.message || 'Gagal menambahkan pengguna admin baru.' },
      { status: 400 }
    );
  }
}
