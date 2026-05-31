import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The web app consumes shared types from the workspace package, which ships
  // raw TypeScript — Next must transpile it.
  transpilePackages: ["@bespoke/shared"],
  output: "standalone",
};

export default nextConfig;
