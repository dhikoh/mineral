import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { uploadMedia } from '@/lib/storage';
import { UPLOAD_ALLOWED_TYPES, detectFileTypeFromMagicBytes } from '@/lib/upload-validate';

// Sesi #19 (Fix #8): ALLOWED_TYPES dan detectFileTypeFromMagicBytes dipindah ke
// src/lib/upload-validate.ts — lihat route publik /api/upload untuk detail alasan.

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB untuk admin


export async function POST(req: NextRequest) {
  // 1. Guard Autentikasi Admin Wajib (R-1)
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const contentType = req.headers.get('content-type') || '';

    // Mode 1: Tempel Link URL gambar eksternal (JSON)
    if (contentType.includes('application/json')) {
      const body = await req.json();
      const { url } = body;

      if (!url || typeof url !== 'string') {
        return NextResponse.json(
          { error: 'Tautan URL gambar wajib diisi.' },
          { status: 400 }
        );
      }

      const trimmedUrl = url.trim();
      if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
        return NextResponse.json(
          { error: 'Tautan URL harus diawali dengan http:// atau https://' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        url: trimmedUrl,
        mode: 'url',
      });
    }

    // Mode 2: Upload file fisik
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'File tidak ditemukan dalam formulir upload.' },
        { status: 400 }
      );
    }

    if (!UPLOAD_ALLOWED_TYPES.includes(file.type as any)) {
      return NextResponse.json(
        { error: 'Format file tidak didukung. Harap unggah JPG, PNG, WEBP, atau PDF.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Ukuran file melebihi batas maksimal 10 MB.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const verifiedMimeType = detectFileTypeFromMagicBytes(buffer);
    if (!verifiedMimeType) {
      return NextResponse.json(
        { error: 'Isi berkas tidak valid atau rusak.' },
        { status: 400 }
      );
    }

    const result = await uploadMedia(buffer, verifiedMimeType, 'admin');

    return NextResponse.json({
      success: true,
      url: result.url,
      filename: result.filename,
      size: file.size,
      mimeType: verifiedMimeType,
      provider: result.provider,
      mode: 'upload',
    });
  } catch (error: any) {
    console.error('Admin upload error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat mengunggah file.' },
      { status: 500 }
    );
  }
}
