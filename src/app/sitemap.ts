import type { MetadataRoute } from "next";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://platform.technexus.org";

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/join`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/issues`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${baseUrl}/projects`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/people`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/founding-1000`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
  ];

  try {
    const db = await getDb();
    const openIssues = await db
      .select({ id: schema.issues.id, updatedAt: schema.issues.updatedAt })
      .from(schema.issues)
      .where(eq(schema.issues.state, "open"))
      .limit(50);

    const issuePages: MetadataRoute.Sitemap = openIssues.map((i: { id: string; updatedAt: Date }) => ({
      url: `${baseUrl}/issues/${i.id}`,
      lastModified: i.updatedAt,
      changeFrequency: "daily",
      priority: 0.8,
    }));

    return [...staticPages, ...issuePages];
  } catch {
    return staticPages;
  }
}
