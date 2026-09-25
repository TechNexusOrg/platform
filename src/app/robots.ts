import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/join", "/issues", "/issues/*", "/people", "/people/*", "/projects", "/verify/*", "/founding-1000"],
        disallow: ["/api/*", "/dashboard", "/dashboard/*", "/onboarding"],
      },
    ],
    sitemap: "https://platform.technexus.org/sitemap.xml",
  };
}
