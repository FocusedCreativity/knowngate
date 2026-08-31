import type { MetadataRoute } from "next";

const BASE = "https://www.knowngate.com";

/** Public, linkable routes. Workspace states and walkthrough fixtures are not. */
const ROUTES: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/check", priority: 0.9, changeFrequency: "weekly" },
  { path: "/standard", priority: 0.8, changeFrequency: "monthly" },
  { path: "/questions", priority: 0.8, changeFrequency: "weekly" },
  { path: "/refusals", priority: 0.8, changeFrequency: "daily" },
  { path: "/agents", priority: 0.8, changeFrequency: "monthly" },
  { path: "/developers", priority: 0.8, changeFrequency: "monthly" },
  { path: "/signup", priority: 0.5, changeFrequency: "monthly" },
  { path: "/login", priority: 0.4, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.3, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((r) => ({
    url: `${BASE}${r.path}`,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
