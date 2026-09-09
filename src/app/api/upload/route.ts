import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'application/pdf', // untuk bukti transfer
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  try {
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
        { error: 'File gambar tidak ditemukan dalam formulir upload' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Format file tidak didukung. Harap unggah format JPG, PNG, WEBP, atau SVG.' },
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

    // Ambil ekstensi asli yang aman
    const rawExt = path.extname(file.name).toLowerCase() || '.jpg';
    const ext = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.pdf'].includes(rawExt)
      ? rawExt
      : '.jpg';

    // Buat nama file unik dan terenkripsi untuk mencegah tabrakan file & tebakan path
    const randomHash = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();
    const filename = `media_${timestamp}_${randomHash}${ext}`;

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, filename);
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
      size: file.size,
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
