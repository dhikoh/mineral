import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import path from 'path';

// Peta Content-Type standar berdasarkan ekstensi file
const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.ico': 'image/x-icon',
};

/**
 * Dynamic Route Handler untuk melayani berkas fisik yang diunggah ke /public/uploads/
 * Mengatasi limitasi container Docker / Next.js standalone yang tidak meng-index
 * berkas statis yang ditambahkan pada saat runtime.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const segments = resolvedParams?.path;

    if (!segments || segments.length === 0) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 404 });
    }

    // Normalisasi dan validasi keamanan path traversal
    const relativePath = path.join(...segments);
    const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
    const safeFilePath = path.resolve(uploadsDir, relativePath);

    // Keamanan ketat: Pastikan berkas berada di dalam direktori uploads yang sah
    if (!safeFilePath.startsWith(uploadsDir)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    // Cek keberadaan berkas fisik
    try {
      const fileStat = await stat(safeFilePath);
      if (!fileStat.isFile()) {
        return NextResponse.json({ error: 'Bukan berkas yang valid' }, { status: 404 });
      }
    } catch {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 404 });
    }

    // Baca buffer berkas fisik
    const fileBuffer = await readFile(safeFilePath);

    // Tentukan mime type dari ekstensi
    const ext = path.extname(safeFilePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err: any) {
    console.error('[Upload Static Route] Error serving upload file:', err);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat memuat berkas' },
      { status: 500 }
    );
  }
}
