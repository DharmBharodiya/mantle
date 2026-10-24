import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  devIndicators: false,
  // Isolate ingestion verification from an IDE's running next dev process.
  distDir: process.env.BORESIGHT_INGESTION_CHECK === "1" ? ".next-ingestion-check" : ".next",
};
export default nextConfig;
