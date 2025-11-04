import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  // Fix workspace root detection
  outputFileTracingRoot: path.join(__dirname),
  
  // Configure Turbopack (empty config to silence warning, webpack still used for build)
  turbopack: {},
  
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
