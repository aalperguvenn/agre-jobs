import path from 'node:path';
import { fileURLToPath } from 'node:url';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');
const appDir = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Workspace packages ship TypeScript source; Next compiles them.
  transpilePackages: ['@agre/core', '@agre/taxonomy', '@agre/db'],
  // Node-only libraries stay out of the bundle.
  serverExternalPackages: ['pg', 'pg-boss'],
  poweredByHeader: false,
  // "@/..." imports resolve to this folder even if tsconfig paths cannot be read (e.g. an unexpected TypeScript version).
  webpack(config) {
    config.resolve.alias = { ...config.resolve.alias, '@': appDir };
    return config;
  },
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      ],
    }];
  },
};

export default withNextIntl(nextConfig);
