/**
 * @type import("next").NextConfig
 */
const nextConfig = {
  eslint: {
    dirs: ["pages", "scripts", "shared"],
  },

  pageExtensions: ["page.tsx", "handler.ts"],
  reactStrictMode: true,
};

export default nextConfig;
