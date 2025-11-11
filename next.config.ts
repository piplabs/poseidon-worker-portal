import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'psdn.ai',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
