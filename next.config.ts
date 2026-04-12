import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dio-cdn.b-cdn.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.b-cdn.net",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;