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
        fs: false,
        // Additional Node.js modules that shouldn't be bundled for browser
        stream: false,
        crypto: false,
        util: false,
        // Prevent node-fetch from being bundled (browsers have native fetch)
        'node-fetch': false
      };
      
      // face-api.js pulls node-fetch which optionally requires 'encoding'
      // Use alias to prevent webpack from resolving it
      config.resolve.alias = {
        ...(config.resolve.alias ?? {}),
        encoding: false
      };
    }

    return config;
  }
};

export default nextConfig;
