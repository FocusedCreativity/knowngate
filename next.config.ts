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
  async rewrites() {
    return [
      /*
       * mcp.knowngate.com serves the MCP endpoint and nothing else, so a client
       * configured with the bare subdomain reaches the server without a path.
       * Host-scoped, so www is untouched. Inert until the domain is added to
       * this project in Vercel; DNS already points here.
       */
      {
        source: "/",
        has: [{ type: "host", value: "mcp.knowngate.com" }],
        destination: "/api/knowngate/v0/mcp",
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "mcp.knowngate.com" }],
        destination: "/api/knowngate/v0/mcp/:path*",
      },
    ];
  },
};

export default nextConfig;
