import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Monorepo : évite que Turbopack prenne le dossier parent (package-lock racine)
  // et casse les routes App Router /api/* (404 + page HTML).
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    qualities: [75, 95],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      /** Logos ou visuels hébergés sur le Storage Supabase (URL typique *.supabase.co). */
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/**",
      },
      /** Fallback : domaines directs du projet sans wildcard (facultatif). */
      {
        protocol: "https",
        hostname: "dbywsbujt.supabase.co",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
