import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  // Static export for GitHub Pages
  output: 'export',

  // Base path for GitHub Pages (repo name)
  basePath: isProd ? '/CGApp' : '',

  // Asset prefix for CSS/JS to load correctly on GitHub Pages
  assetPrefix: isProd ? '/CGApp/' : '',

  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },

  // Ensure trailing slashes for GitHub Pages compatibility
  trailingSlash: true,
};

export default nextConfig;
