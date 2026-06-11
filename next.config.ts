import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Allow local network access for development
  allowedDevOrigins: ["192.168.1.13"],
};

export default nextConfig;
