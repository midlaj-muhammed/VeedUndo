import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "img.staticmb.com" },
      { protocol: "https", hostname: "**.magicbricks.com" },
      { protocol: "https", hostname: "img.99acres.com" },
      { protocol: "https", hostname: "**.housing.com" },
    ],
  },
};

export default nextConfig;
