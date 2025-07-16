import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Basic optimizations only
  compress: true,
  poweredByHeader: false,
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  
  // Server externals
  serverExternalPackages: ['prisma'],
};

export default nextConfig;
