import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/account",
        destination: "/console",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
