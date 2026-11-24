
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://pickshort-nextjs-y3hl.vercel.app",
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
