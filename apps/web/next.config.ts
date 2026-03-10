import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
