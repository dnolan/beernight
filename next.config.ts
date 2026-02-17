import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mongoose"],
  env: {
    NEXT_PUBLIC_BUILD_VERSION: process.env.npm_package_version || "0.0.0",
    NEXT_PUBLIC_BUILD_DATE: new Date().toISOString(),
  },
};

export default nextConfig;
