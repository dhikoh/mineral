import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export interface UploadResult {
  url: string;
  filename: string;
  provider: 'local' | 's3' | 'cloudinary';
}

/**
 * Deteksi ekstensi file berdasarkan MIME type
 */
function getExtensionFromMime(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'application/pdf': '.pdf',
  };
  return mimeMap[mimeType] || '.jpg';
}

/**
 * Penyimpanan Lokal (Local Disk)
 */
async function uploadToLocal(
  buffer: Buffer,
  filename: string
): Promise<UploadResult> {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadsDir, { recursive: true });

  const filePath = path.join(uploadsDir, filename);
  await writeFile(filePath, buffer);

  return {
    url: `/uploads/${filename}`,
    filename,
    provider: 'local',
  };
}

/**
 * Penyimpanan S3 / Cloudflare R2
 * Mendukung AWS S3 atau S3-compatible API (Cloudflare R2, MinIO)
 */
async function uploadToS3Compatible(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<UploadResult> {
  const endpoint = process.env.S3_ENDPOINT; // e.g. https://<accountid>.r2.cloudflarestorage.com
  const bucket = process.env.S3_BUCKET_NAME;
  const publicBaseUrl = process.env.S3_PUBLIC_URL; // e.g. https://cdn.adably.id
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

  if (!bucket || !endpoint || !accessKeyId || !secretAccessKey) {
    console.warn(
      '[Storage] Konfigurasi S3/R2 tidak lengkap. Mengalihkan penyimpanan ke disk lokal.'
    );
    return uploadToLocal(buffer, filename);
  }

  // Jika publicBaseUrl dikonfigurasi, bangun URL publik
  const objectUrl = publicBaseUrl
    ? `${publicBaseUrl.replace(/\/$/, '')}/${filename}`
    : `${endpoint.replace(/\/$/, '')}/${bucket}/${filename}`;

  try {
    // Sederhana: HTTP PUT langsung ke S3 endpoint jika didukung atau signed URL
    const uploadUrl = `${endpoint.replace(/\/$/, '')}/${bucket}/${filename}`;
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': mimeType,
      },
      body: buffer as unknown as BodyInit,
    });

    if (!res.ok) {
      throw new Error(`S3 upload error: ${res.status} ${res.statusText}`);
    }

    return {
      url: objectUrl,
      filename,
      provider: 's3',
    };
  } catch (err) {
    console.error('[Storage S3 Error] Fallback to local:', err);
    return uploadToLocal(buffer, filename);
  }
}

/**
 * Penyimpanan Cloudinary
 */
async function uploadToCloudinary(
  buffer: Buffer,
  filename: string
): Promise<UploadResult> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName) {
    console.warn('[Storage] Konfigurasi Cloudinary tidak lengkap. Fallback ke disk lokal.');
    return uploadToLocal(buffer, filename);
  }

  try {
    const base64Data = `data:image/jpeg;base64,${buffer.toString('base64')}`;
    const formData = new URLSearchParams();
    formData.append('file', base64Data);
    if (uploadPreset) {
      formData.append('upload_preset', uploadPreset);
    }

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || 'Cloudinary upload error');
    }

    return {
      url: data.secure_url || data.url,
      filename,
      provider: 'cloudinary',
    };
  } catch (err) {
    console.error('[Storage Cloudinary Error] Fallback to local:', err);
    return uploadToLocal(buffer, filename);
  }
}

/**
 * Entry point utama upload media dengan pemilihan provider dinamis
 */
export async function uploadMedia(
  buffer: Buffer,
  mimeType: string,
  prefix: string = 'media'
): Promise<UploadResult> {
  const ext = getExtensionFromMime(mimeType);
  const randomHash = crypto.randomBytes(8).toString('hex');
  const timestamp = Date.now();
  const filename = `${prefix}_${timestamp}_${randomHash}${ext}`;

  const provider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();

  switch (provider) {
    case 's3':
    case 'r2':
      return uploadToS3Compatible(buffer, filename, mimeType);
    case 'cloudinary':
      return uploadToCloudinary(buffer, filename);
    case 'local':
    default:
      return uploadToLocal(buffer, filename);
  }
}

/**
 * Hapus media (jika didukung)
 */
export async function deleteMedia(fileUrl: string): Promise<boolean> {
  if (fileUrl.startsWith('/uploads/')) {
    const filename = fileUrl.replace('/uploads/', '');
    const localPath = path.join(process.cwd(), 'public', 'uploads', filename);
    try {
      await unlink(localPath);
      return true;
    } catch {
      return false;
    }
  }
  return true;
}
