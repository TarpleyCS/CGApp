import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: process.env.NODE_ENV === 'production' ? '/CGApp' : '',
  images: {
    unoptimized: true
  }
};

export default nextConfig;
