import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@whatsapp-automation/shared'],
  experimental: {
    instrumentationHook: true,
  },
  async rewrites() {
    return [
      {
        source: '/webhook/whatsapp',
        destination: '/api/webhook/whatsapp',
      },
    ];
  },
};

export default nextConfig;
