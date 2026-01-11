import type { NextConfig } from "next";
import { dirname } from "path";
import { fileURLToPath } from "url";
import webpack from "webpack";

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

      // face-api.js pulls node-fetch, which optionally requires 'encoding'.
      // In the browser build we don't need that dependency; ignoring it removes
      // the noisy "Can't resolve 'encoding'" warning during `next build`.
      config.plugins = config.plugins ?? [];
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^encoding$/,
          contextRegExp: /node-fetch/
        })
      );
    }

    return config;
  }
};

export default nextConfig;
