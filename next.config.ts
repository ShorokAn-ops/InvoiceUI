import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow dev traffic from LAN address to silence cross-origin warning in dev overlay
  allowedDevOrigins: ['http://172.18.224.1:3000', 'http://localhost:3000'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/:path*',
      },
    ];
  },
};

export default nextConfig;
