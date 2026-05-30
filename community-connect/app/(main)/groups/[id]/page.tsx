"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageTransition } from "@/components/ui/page-header";
import { GroupHeader } from "@/components/groups/group-header";
import { apiFetch } from "@/lib/api/client";
import { getGroupById, mockGroupPosts } from "@/lib/mock-data/groups";
import type { GroupDto } from "@/types/engagement";
import { RelativeTime } from "@/components/ui/relative-time";
import { useToast } from "@/components/ui/toast";

export default function GroupDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const [group, setGroup] = useState<GroupDto | null>(getGroupById(id) ?? null);
  const [posts, setPosts] = useState(mockGroupPosts.filter((p) => p.groupId === id));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void apiFetch<{ group: GroupDto; posts: { id: string; content: string; createdAt: string; author?: string }[] }>(
      `/api/groups/${id}`
    )
      .then((d) => {
        setGroup(d.group);
        setPosts(
          d.posts.map((p) => ({
            ...p,
            groupId: id,
            author: (p as { author?: string }).author ?? "Member",
          }))
        );
      })
      .catch(() => undefined);
  }, [id]);

  async function handleJoin() {
    setLoading(true);
    try {
      await apiFetch(`/api/groups/${id}/join`, { method: "POST" });
      setGroup((g) => (g ? { ...g, isMember: true, memberCount: g.memberCount + 1 } : g));
      toast("Joined group!", "success");
    } catch {
      setGroup((g) => (g ? { ...g, isMember: true } : g));
      toast("Joined group (demo)", "success");
    } finally {
      setLoading(false);
    }
  }

  async function handleLeave() {
    setLoading(true);
    try {
      await apiFetch(`/api/groups/${id}/leave`, { method: "POST" });
      setGroup((g) => (g ? { ...g, isMember: false, memberCount: Math.max(0, g.memberCount - 1) } : g));
      toast("Left group", "info");
    } catch {
      setGroup((g) => (g ? { ...g, isMember: false } : g));
    } finally {
      setLoading(false);
    }
  }

  if (!group) {
    return (
      <PageTransition>
        <p className="text-[var(--muted-foreground)]">Group not found.</p>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <GroupHeader group={group} onJoin={handleJoin} onLeave={handleLeave} loading={loading} />
      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">Recent Posts</h2>
        <div className="space-y-4">
          {posts.map((post) => (
            <article
              key={post.id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"
            >
              <p className="text-sm font-medium">{post.author}</p>
              <p className="mt-2">{post.content}</p>
              <RelativeTime
                date={post.createdAt}
                className="mt-2 block text-xs text-[var(--muted-foreground)]"
              />
            </article>
          ))}
          {posts.length === 0 && (
            <p className="text-sm text-[var(--muted-foreground)]">No posts yet. Be the first!</p>
          )}
        </div>
      </section>
    </PageTransition>
  );
}
