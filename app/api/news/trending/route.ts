import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonOk } from "@/lib/api/response";
import { mockNewsArticles } from "@/lib/mock-data/news";

export async function GET(req: NextRequest) {
  requireAuth(req);
  const trending = [...mockNewsArticles]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 5);
  return jsonOk({ items: trending, source: "mock" });
}
