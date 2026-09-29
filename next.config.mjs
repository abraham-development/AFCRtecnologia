/**
 * Configuración de Next.js.
 *
 * ⚠ Este archivo es `.mjs`, NO `.ts`, a propósito: el contenedor de build de
 * Hostinger tiene una glibc antigua, así que `@next/swc-linux-x64-gnu` no carga
 * y Next cae al fallback WASM. Ese fallback no sabe transpilar un
 * `next.config.ts` y el build muere con «Failed to load next.config.ts».
 * Con configuración en JavaScript no hace falta transpilar nada.
 *
 * Dos objetivos de compilación:
 *
 *  - `npm run build` / `build:hostinger` → servidor Node. Incluye /api/contact.
 *  - `npm run build:static`              → export estático para hosting sin Node,
 *                                          con `public/contact.php` como endpoint.
 *
 * Lo que solo existe con servidor lleva extensión `.node.ts(x)` (hoy, el route
 * handler `/api/contact`). Solo se registra cuando `pageExtensions` la incluye,
 * es decir, fuera del modo estático. A la inversa, `.static.ts(x)` solo existe
 * en el export.
 */

const isStatic = process.env.BUILD_TARGET === 'static';

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  pageExtensions: isStatic ? ['ts', 'tsx', 'static.ts', 'static.tsx'] : ['ts', 'tsx', 'node.ts', 'node.tsx'],
  images: {
    formats: ['image/avif', 'image/webp'],
    unoptimized: isStatic,
  },
  ...(isStatic
    ? // En Apache las cabeceras las pone `public/.htaccess`.
      { output: 'export', trailingSlash: true }
    : {
        async headers() {
          return [{ source: '/:path*', headers: securityHeaders }];
        },
      }),
};

export default nextConfig;
