import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the file-tracing root so Vercel's build-config step always gets a
  // defined path (avoids ERR_INVALID_ARG_TYPE during modifyConfig).
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
