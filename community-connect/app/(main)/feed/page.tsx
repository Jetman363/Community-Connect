"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { formatRelative } from "@/lib/utils";

interface Post {
  id: string;
  content: string;
  category: string;
  createdAt: string;
  author: { profile?: { displayName: string }; email: string };
  _count?: { likes: number; comments: number };
}

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadPosts() {
    const res = await fetch("/api/posts");
    const data = await res.json();
    setPosts(data.items ?? data.posts ?? []);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch("/api/posts");
      const data = await res.json();
      if (!cancelled) {
        setPosts(data.items ?? data.posts ?? []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function createPost() {
    if (!content.trim()) return;
    await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, category: "GENERAL" }),
    });
    setContent("");
    loadPosts();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Community Feed</h1>

      <Card>
        <CardContent className="space-y-3 pt-5">
          <Textarea placeholder="Share with your community…" value={content} onChange={(e) => setContent(e.target.value)} />
          <Button onClick={createPost}>Post</Button>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-[var(--muted-foreground)]">Loading…</p>
      ) : (
        posts.map((post, i) => (
          <motion.div key={post.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
            <Card>
              <CardContent className="pt-5">
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-medium">
                    {post.author?.profile?.displayName ?? post.author?.email?.split("@")[0]}
                  </span>
                  <Badge variant="accent">{post.category}</Badge>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {formatRelative(post.createdAt)}
                  </span>
                </div>
                <p className="text-sm">{post.content}</p>
                <div className="mt-4 flex gap-4 text-[var(--muted-foreground)]">
                  <button type="button" className="flex items-center gap-1 text-sm hover:text-[var(--accent)]">
                    <Heart className="h-4 w-4" /> {post._count?.likes ?? 0}
                  </button>
                  <button type="button" className="flex items-center gap-1 text-sm hover:text-[var(--accent)]">
                    <MessageCircle className="h-4 w-4" /> {post._count?.comments ?? 0}
                  </button>
                  <button type="button" className="flex items-center gap-1 text-sm hover:text-[var(--accent)]">
                    <Share2 className="h-4 w-4" /> Share
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))
      )}
    </div>
  );
}
