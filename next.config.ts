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
    // beforeFiles, not the default array form: the default is afterFiles, which
    // only runs once filesystem routes have missed, and "/" is a page, so the
    // landing would always win and the subdomain would serve the site.
    return {
      beforeFiles: [
      /*
       * mcp.knowngate.com serves the MCP endpoint and nothing else, so a client
       * configured with the bare subdomain reaches the server without a path.
       * Root only: a catch-all here re-matches its own destination and rewrites
       * it a second time, which 404s. Host-scoped, so www is untouched. Inert
       * until the domain is added to this project in Vercel; DNS already
       * points here.
       */
        {
          source: "/",
          has: [{ type: "host", value: "mcp.knowngate.com" }],
          destination: "/api/knowngate/v0/mcp",
        },
      ],
    };
  },
};

export default nextConfig;
