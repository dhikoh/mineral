import { NextRequest, NextResponse } from 'next/server';
import { uploadMedia } from '@/lib/storage';
import { getClientIp, checkUploadRateLimit } from '@/lib/rate-limit';
import { UPLOAD_ALLOWED_TYPES, detectFileTypeFromMagicBytes } from '@/lib/upload-validate';

// Sesi #19 (Fix #8): ALLOWED_TYPES dan detectFileTypeFromMagicBytes dipindah ke
// src/lib/upload-validate.ts (shared helper) untuk menghilangkan duplikasi identik
// antara route publik ini dan src/app/api/admin/upload/route.ts

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB


export async function POST(req: NextRequest) {
  try {
    // 1. Terapkan Rate Limiting berdasarkan IP klien
    const clientIp = getClientIp(req);
    const rateLimit = checkUploadRateLimit(clientIp);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Batas upload terlampaui. Alamat IP Anda ditangguhkan sementara. Silakan coba kembali dalam ${rateLimit.remainingMinutes} menit.`,
        },
        { status: 429 }
      );
    }

    const contentType = req.headers.get('content-type') || '';

    // Mode 1: Tempel Link URL gambar eksternal (JSON)
    if (contentType.includes('application/json')) {
      const body = await req.json();
      const { url } = body;

      if (!url || typeof url !== 'string') {
        return NextResponse.json(
          { error: 'Tautan URL gambar wajib diisi' },
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

    // Mode 2: Upload file langsung (multipart/form-data)
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'File tidak ditemukan dalam formulir upload' },
        { status: 400 }
      );
    }

    // Validasi tipe file yang dideklarasikan klien
    if (!UPLOAD_ALLOWED_TYPES.includes(file.type as any)) {
      return NextResponse.json(
        { error: 'Format file tidak didukung. Harap unggah format JPG, PNG, WEBP, atau PDF.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Ukuran file melebihi batas maksimal 5 MB' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // R-14: Validasi berkas fisik dengan inspeksi Magic Bytes
    const verifiedMimeType = detectFileTypeFromMagicBytes(buffer);
    if (!verifiedMimeType) {
      return NextResponse.json(
        { error: 'Isi berkas tidak valid atau rusak. Harap unggah berkas gambar JPG, PNG, WEBP, atau PDF yang valid.' },
        { status: 400 }
      );
    }

    const result = await uploadMedia(buffer, verifiedMimeType, 'proof');

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
    console.error('Upload handler error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat mengunggah file' },
      { status: 500 }
    );
  }
}
