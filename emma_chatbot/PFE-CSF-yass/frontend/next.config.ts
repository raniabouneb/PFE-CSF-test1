import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
