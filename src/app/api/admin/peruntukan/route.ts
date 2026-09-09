import { NextRequest, NextResponse } from 'next/server';
import { getUsages, createUsage } from '@/lib/data-store';

export async function GET() {
  try {
    const usages = await getUsages();
    return NextResponse.json({ success: true, data: usages });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal memuat taksonomi peruntukan' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Nama peruntukan wajib diisi' },
        { status: 400 }
      );
    }

    const newUsage = await createUsage({ name: name.trim() });
    return NextResponse.json(
      { success: true, data: newUsage, message: 'Peruntukan berhasil ditambahkan' },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal menambahkan peruntukan' },
      { status: 500 }
    );
  }
}
