import type { NextConfig } from "next";
import { dirname } from "path";
import { fileURLToPath } from "url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Ensure browser builds don't choke on Node-only deps pulled by some ML libs.
  outputFileTracingRoot: projectRoot,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = config.resolve ?? {};
      config.resolve.fallback = {
        ...(config.resolve.fallback ?? {}),
        fs: false
      };

      config.resolve.alias = {
        ...(config.resolve.alias ?? {}),
        // face-api.js pulls node-fetch which optionally requires 'encoding'
        encoding: false
      };
    }

    return config;
  }
};

export default nextConfig;
