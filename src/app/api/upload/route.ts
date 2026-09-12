import { NextRequest, NextResponse } from 'next/server';
import { uploadMedia } from '@/lib/storage';
import { getClientIp, checkUploadRateLimit } from '@/lib/rate-limit';

// R-14: Hapus image/svg+xml demi keamanan stored XSS pada upload publik
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf', // untuk foto bukti transfer / dokumen PDF
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// R-14: Deteksi tipe berkas fisik sesungguhnya dari magic bytes header
function detectFileTypeFromMagicBytes(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // WebP: RIFF....WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  // PDF: %PDF- (25 50 44 46)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return 'application/pdf';
  }

  return null;
}

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
    if (!ALLOWED_TYPES.includes(file.type)) {
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
