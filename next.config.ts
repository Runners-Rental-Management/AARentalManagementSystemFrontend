import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

function normalizeBackendProxyTarget(raw: string | undefined): string {
  const trimmed = raw?.trim().replace(/\/$/, "") ?? "";
  if (!trimmed) return "http://127.0.0.1:3001";
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new Error(
      `BACKEND_PROXY_TARGET must start with http:// or https:// (got: ${JSON.stringify(raw)})`,
    );
  }
  return trimmed;
}

const backendProxyTarget = normalizeBackendProxyTarget(
  process.env.BACKEND_PROXY_TARGET,
);

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  outputFileTracingRoot: projectRoot,
  async rewrites() {
    return [
      {
        source: "/api-proxy/:path*",
        destination: `${backendProxyTarget}/:path*`,
      },
    ];
  },
};

export default nextConfig;
