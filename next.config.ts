import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow dev traffic from LAN address to silence cross-origin warning in dev overlay
  allowedDevOrigins: [
    'http://172.18.224.1:3000',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ],
  async rewrites() {
    return [
      // Use a dedicated path for backend to avoid conflicts with Next.js API routes
      {
        source: '/backend/:path*',
        destination: 'http://localhost:8080/:path*',
      },
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/:path*',
      },
    ];
  },
};

export default nextConfig;
