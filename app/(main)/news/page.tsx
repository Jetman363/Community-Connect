"use client";

import { useEffect, useState } from "react";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { NewsCard } from "@/components/news/news-card";
import { apiFetch } from "@/lib/api/client";
import { mockNewsArticles } from "@/lib/mock-data/news";
import type { NewsArticleDto } from "@/types/engagement";

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticleDto[]>(mockNewsArticles);
  const [trending, setTrending] = useState<NewsArticleDto[]>(mockNewsArticles.slice(0, 3));

  useEffect(() => {
    void Promise.all([
      apiFetch<{ items: NewsArticleDto[] }>("/api/news").then((d) => setArticles(d.items)),
      apiFetch<{ items: NewsArticleDto[] }>("/api/news/trending").then((d) => setTrending(d.items)),
    ]).catch(() => undefined);
  }, []);

  return (
    <PageTransition>
      <PageHeader title="Local News" description="Stay informed with AI-summarized community headlines" />

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">Trending</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {trending.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Latest</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {articles.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      </section>
    </PageTransition>
  );
}
