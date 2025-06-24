import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: '/CGApp',
  images: {
    unoptimized: true
  }
};

export default nextConfig;
