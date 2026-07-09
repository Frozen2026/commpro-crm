import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["app.commpro.ai", "localhost:3000"],
    },
  },
};

export default nextConfig;
