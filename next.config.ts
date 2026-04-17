import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable Turbopack for both dev and prod builds.
  turbopack: {},

  // Server-only Node packages that should not be bundled.
  // These are dynamically required by lib/services/* PDF/HTML services.
  serverExternalPackages: [
    'pdfkit',
    'canvas',
    'pagedjs',
    'puppeteer',
    'puppeteer-core',
    '@react-pdf/renderer',
  ],

  // PWA & manifest cache headers. The previous global no-store header on every
  // HTML page made every navigation hit the origin; per-route cache control
  // will be added in Phase 3D instead.
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
    ];
  },

  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'date-fns',
      'lodash',
      'idb',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
    ],
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24,
    remotePatterns: [
      { protocol: 'https', hostname: '**.vercel-storage.com' },
      { protocol: 'https', hostname: '**.blob.vercel-storage.com' },
      { protocol: 'https', hostname: '**.public.blob.vercel-storage.com' },
    ],
  },

  logging: {
    fetches: { fullUrl: false },
  },
};

export default nextConfig;
