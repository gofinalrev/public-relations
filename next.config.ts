import type { NextConfig } from "next";
import { getBonjourHostname, getLanIpAddress } from "./src/lib/network-url";

const lanIp = getLanIpAddress();
const bonjour = getBonjourHostname();

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    ...(bonjour ? [bonjour] : []),
    ...(lanIp ? [lanIp] : []),
  ],
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "@napi-rs/canvas", "ffmpeg-static", "ffprobe-static"],
  outputFileTracingIncludes: {
    "/api/metricool/pdf": [
      "./node_modules/@napi-rs/canvas/**/*",
      "./node_modules/pdf-parse/**/*",
      "./node_modules/pdfjs-dist/**/*",
    ],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.tooltrace.ai", pathname: "/images/**" },
      { protocol: "https", hostname: "tooltrace.ai", pathname: "/images/**" },
      { protocol: "https", hostname: "www.finalrev.com", pathname: "/images/**" },
      { protocol: "https", hostname: "finalrev.com", pathname: "/images/**" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
