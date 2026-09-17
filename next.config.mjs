/** @type {import('next').NextConfig} */

// Kumpulkan hostname yang diizinkan dari env vars (inlined agar tidak bergantung pada loader TS)
function getAllowedImageHostnames() {
  const hosts = [];

  if (process.env.S3_PUBLIC_URL) {
    try {
      hosts.push(new URL(process.env.S3_PUBLIC_URL).hostname);
    } catch { /* abaikan URL tidak valid */ }
  }

  if (process.env.CLOUDINARY_CLOUD_NAME) {
    hosts.push('res.cloudinary.com');
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      hosts.push(new URL(process.env.NEXT_PUBLIC_APP_URL).hostname);
    } catch { /* abaikan */ }
  }

  // Domain aplikasi produksi dan asset eksternal
  hosts.push('adably.id', 'cdn.adably.id', 'images.unsplash.com', 'localhost');

  return [...new Set(hosts.filter(Boolean))];
}

const allowedHostnames = getAllowedImageHostnames();

const nextConfig = {
  // P0-06: output standalone untuk Docker (dibutuhkan Dockerfile multi-stage)
  output: 'standalone',

  reactStrictMode: true,

  // P0-06: Sembunyikan header X-Powered-By (fingerprinting prevention)
  poweredByHeader: false,

  // P0-06: Next.js Image Optimizer — whitelist eksplisit, hapus wildcard SSRF
  images: {
    // Hanya izinkan HTTPS, hapus http wildcard
    remotePatterns: allowedHostnames.map(hostname => ({
      protocol: 'https',
      hostname,
    })),
    // Keamanan tambahan
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // P1-10: Security headers untuk semua rute
  async headers() {
    const isProduction = process.env.NODE_ENV === 'production';

    const securityHeaders = [
      // Cegah clickjacking
      { key: 'X-Frame-Options', value: 'DENY' },
      // Cegah MIME sniffing
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      // Referrer policy
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      // Permissions policy — matikan fitur browser berbahaya
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), payment=()',
      },
      // Content Security Policy
      // Catatan: style-src membutuhkan 'unsafe-inline' karena Tailwind CSS runtime
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js membutuhkan unsafe-eval untuk HMR dev
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          `img-src 'self' data: blob: ${allowedHostnames.map(h => `https://${h}`).join(' ')} https://images.unsplash.com`,
          "connect-src 'self'",
          "frame-ancestors 'none'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join('; '),
      },
      // HSTS — hanya di produksi
      ...(isProduction ? [{
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      }] : []),
    ];

    return [
      // Headers untuk semua rute publik
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      // Header tambahan untuk panel admin — cegah caching browser
      {
        source: '/admin/(.*)',
        headers: [
          ...securityHeaders,
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
    ];
  },
};

export default nextConfig;
