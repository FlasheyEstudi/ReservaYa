import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://192.168.0.102:3000/api/:path*', // Proxy to Backend (use IP for mobile access)
      },
      {
        source: '/socket.io/:path*',
        destination: 'http://192.168.0.102:3000/socket.io/:path*', // Proxy to Socket.IO
      }
    ];
  },
};

export default nextConfig;
