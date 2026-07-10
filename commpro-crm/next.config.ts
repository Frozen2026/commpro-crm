import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["commpro.ai", "www.commpro.ai", "app.commpro.ai", "localhost:3000"],
    },
  },
};

export default nextConfig;
