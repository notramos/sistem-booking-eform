import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },
  async headers() {
    const apiOrigin = process.env.NEXT_PUBLIC_API_URL ? new URL(process.env.NEXT_PUBLIC_API_URL).origin : '';
    // Dev mode React/webpack (fast refresh, source map) butuh eval() — CSP produksi
    // tak perlu izin ini sama sekali, jadi dilonggarkan cuma saat development.
    const scriptSrc = process.env.NODE_ENV === 'development'
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval';"
      : "script-src 'self' 'unsafe-inline';";

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            value: `default-src 'self'; ${scriptSrc} style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ${apiOrigin};`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
