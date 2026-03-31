import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  devIndicators: false,
  transpilePackages: ['@artifigenz/shared'],
};

export default nextConfig;
