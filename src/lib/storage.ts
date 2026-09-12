/**
 * Storage Adapter Module — Multi-Provider (Local, S3/R2, Cloudinary)
 *
 * Sesi #17 (Temuan L):
 * - S3/R2: Menggunakan @aws-sdk/client-s3 resmi untuk signing SigV4 yang benar
 * - Cloudinary: Signed upload menggunakan apiKey+apiSecret (SHA-1 signature)
 * - deleteMedia: Menghapus objek remote sungguhan di S3 dan Cloudinary (bukan return true palsu)
 * - Fallback: Jika provider non-local dikonfigurasi tapi gagal, kembalikan error eksplisit
 *   (tidak silent fallback ke lokal) agar admin sadar konfigurasinya salah
 */

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
 * Penyimpanan S3 / Cloudflare R2 — dengan AWS SigV4 resmi via @aws-sdk/client-s3
 * Sesi #17 (Temuan L): Menggantikan HTTP PUT tanpa signature yang selalu gagal 401/403
 */
async function uploadToS3Compatible(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<UploadResult> {
  const endpoint = process.env.S3_ENDPOINT;
  const bucket = process.env.S3_BUCKET_NAME;
  const publicBaseUrl = process.env.S3_PUBLIC_URL;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const region = process.env.S3_REGION || 'auto'; // R2 uses 'auto'

  if (!bucket || !endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      '[Storage] Konfigurasi S3/R2 tidak lengkap (S3_ENDPOINT, S3_BUCKET_NAME, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY diperlukan). Upload tidak dapat dilanjutkan.'
    );
  }

  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');

  const s3Client = new S3Client({
    endpoint: endpoint.replace(/\/$/, ''),
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true, // Diperlukan untuk R2 / MinIO
  });

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: filename,
    Body: buffer,
    ContentType: mimeType,
  });

  await s3Client.send(command);

  const objectUrl = publicBaseUrl
    ? `${publicBaseUrl.replace(/\/$/, '')}/${filename}`
    : `${endpoint.replace(/\/$/, '')}/${bucket}/${filename}`;

  return {
    url: objectUrl,
    filename,
    provider: 's3',
  };
}

/**
 * Hapus objek dari S3/R2 — sungguhan, bukan no-op
 */
async function deleteFromS3(fileUrl: string): Promise<boolean> {
  const endpoint = process.env.S3_ENDPOINT;
  const bucket = process.env.S3_BUCKET_NAME;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const region = process.env.S3_REGION || 'auto';
  const publicBaseUrl = process.env.S3_PUBLIC_URL;

  if (!bucket || !endpoint || !accessKeyId || !secretAccessKey) return false;

  // Ekstrak key dari URL
  let key = '';
  if (publicBaseUrl && fileUrl.startsWith(publicBaseUrl)) {
    key = fileUrl.replace(publicBaseUrl.replace(/\/$/, '') + '/', '');
  } else {
    // Fallback: ambil segmen terakhir
    key = fileUrl.split('/').pop() || '';
  }
  if (!key) return false;

  try {
    const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    const s3Client = new S3Client({
      endpoint: endpoint.replace(/\/$/, ''),
      region,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });
    await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (err) {
    console.error('[Storage] S3 delete error:', err);
    return false;
  }
}

/**
 * Penyimpanan Cloudinary — dengan signed upload menggunakan apiKey+apiSecret
 * Sesi #17 (Temuan L): Menggunakan SHA-1 signature sesuai spesifikasi resmi Cloudinary,
 * tidak bergantung pada unsigned upload_preset yang bisa gagal diam-diam.
 */
async function uploadToCloudinary(
  buffer: Buffer,
  filename: string
): Promise<UploadResult> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      '[Storage] Konfigurasi Cloudinary tidak lengkap (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET diperlukan). Upload tidak dapat dilanjutkan.'
    );
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const publicId = filename.replace(/\.[^.]+$/, ''); // strip extension

  // Cloudinary signed upload: signature = SHA1("public_id=X&timestamp=T" + apiSecret)
  const signatureString = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

  const base64Data = `data:image/jpeg;base64,${buffer.toString('base64')}`;
  const formData = new URLSearchParams();
  formData.append('file', base64Data);
  formData.append('public_id', publicId);
  formData.append('timestamp', timestamp);
  formData.append('api_key', apiKey);
  formData.append('signature', signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      `[Storage] Cloudinary upload gagal: ${data.error?.message || JSON.stringify(data)}`
    );
  }

  return {
    url: data.secure_url || data.url,
    filename,
    provider: 'cloudinary',
  };
}

/**
 * Hapus aset dari Cloudinary — sungguhan via destroy API
 */
async function deleteFromCloudinary(fileUrl: string): Promise<boolean> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return false;

  // Ekstrak public_id dari URL Cloudinary
  // URL format: https://res.cloudinary.com/<cloud>/image/upload/v123/public_id.ext
  const match = fileUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
  const publicId = match?.[1];
  if (!publicId) return false;

  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const sigStr = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(sigStr).digest('hex');

    const formData = new URLSearchParams();
    formData.append('public_id', publicId);
    formData.append('timestamp', timestamp);
    formData.append('api_key', apiKey);
    formData.append('signature', signature);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    return data.result === 'ok';
  } catch (err) {
    console.error('[Storage] Cloudinary delete error:', err);
    return false;
  }
}

/**
 * Entry point utama upload media dengan pemilihan provider dinamis.
 * Sesi #17 (Temuan L): Provider non-local yang gagal sekarang throw error eksplisit
 * alih-alih silent fallback ke lokal.
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
 * Hapus media dari provider yang sesuai.
 * Sesi #17 (Temuan L): Sekarang menghapus objek remote sungguhan di S3 dan Cloudinary,
 * bukan return true palsu tanpa aksi apa pun.
 */
export async function deleteMedia(fileUrl: string): Promise<boolean> {
  // Lokal: path diawali /uploads/
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

  // Cloudinary: URL mengandung res.cloudinary.com
  if (fileUrl.includes('res.cloudinary.com')) {
    return deleteFromCloudinary(fileUrl);
  }

  // S3/R2: URL lainnya yang bukan lokal
  const provider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();
  if (provider === 's3' || provider === 'r2') {
    return deleteFromS3(fileUrl);
  }

  return false;
}
