import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  // Fix workspace root detection
  outputFileTracingRoot: path.join(__dirname),
  
  // Configure Turbopack (empty config to silence warning, webpack still used for build)
  turbopack: {},
  
  // Cache control headers for proper PWA updates
  async headers() {
    return [
      {
        // Service worker - never cache
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        // Manifest - short cache
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        // HTML pages - no cache for fresh content
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
        has: [
          {
            type: 'header',
            key: 'accept',
            value: '(.*text/html.*)',
          },
        ],
      },
    ];
  },
  
  // Performance optimizations
  experimental: {
    // Optimize imports for commonly used packages to reduce bundle size
    // This enables tree-shaking for these large packages
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'date-fns',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
    ],
  },
  
  // Image optimization for better loading performance
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24, // 24 hours
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: '**.blob.vercel-storage.com',
      },
    ],
  },
  
  // Logging configuration to reduce noise from async API warnings
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Handle pdfkit and its dependencies for server-side rendering
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
      };
      
      // Externalize pdfkit to use the Node.js version
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push('pdfkit', 'canvas');
      }
      
      // Handle @react-pdf/renderer for server-side
      config.externals.push({
        '@react-pdf/renderer': '@react-pdf/renderer'
      });
    }
    
    return config;
  },
};

export default nextConfig;
