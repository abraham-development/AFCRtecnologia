import type { NextConfig } from 'next';

/**
 * Dos objetivos de compilación:
 *
 *  - `npm run build`        → servidor Node (Vercel, VPS). Incluye /api/contact.
 *  - `npm run build:static` → export estático para hosting compartido
 *                             (Hostinger hPanel). El formulario usa
 *                             `public/contact.php` en lugar del route handler.
 *
 * El route handler vive en `route.node.ts`: solo se registra como ruta cuando
 * `pageExtensions` incluye `node.ts`, es decir, fuera del modo estático
 * (Next no admite handlers dinámicos con `output: 'export'`).
 */
const isStatic = process.env.BUILD_TARGET === 'static';

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  pageExtensions: isStatic ? ['ts', 'tsx'] : ['ts', 'tsx', 'node.ts'],
  images: {
    formats: ['image/avif', 'image/webp'],
    unoptimized: isStatic,
  },
  ...(isStatic
    ? // En Apache las cabeceras las pone `public/.htaccess`.
      { output: 'export' as const, trailingSlash: true }
    : {
        async headers() {
          return [{ source: '/:path*', headers: securityHeaders }];
        },
      }),
};

export default nextConfig;
