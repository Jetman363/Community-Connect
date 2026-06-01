"use client";

import { useEffect, useState } from "react";
import { PageTransition } from "@/components/ui/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FeedPostCard } from "@/components/cards/feed-post";
import { currentUser } from "@/lib/mock-data";
import { getMockFeedPosts } from "@/lib/api/fallback";
import { Settings, MapPin, Calendar, Award, Flame, Star } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CommunityImage } from "@/components/ui/community-image";
import { communityPhotos } from "@/lib/images/community-photos";
import { useRewardsSummary } from "@/hooks/use-personalization";
import { PublicSocialLinks } from "@/components/social/public-social-links";
import { apiFetch } from "@/lib/api/client";

export default function ProfilePage() {
  const user = currentUser;
  const [profileUserId, setProfileUserId] = useState(user.id);

  useEffect(() => {
    void apiFetch<{ id: string }>("/api/auth/me")
      .then((me) => setProfileUserId(me.id))
      .catch(() => undefined);
  }, []);
  const points = useRewardsSummary();
  const feedPosts = getMockFeedPosts();
  const userPosts = feedPosts.filter((p) => p.authorId === user.id);
  const savedPosts = feedPosts.filter((p) => p.saved);

  return (
    <PageTransition>
      <div className="relative mb-8 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <div className="relative h-32">
          <CommunityImage
            src={communityPhotos.hero.profile}
            alt="Oak Hills neighborhood skyline"
            fill
            sizes="(max-width: 768px) 100vw, 1200px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--card)] via-transparent to-black/20" />
        </div>
        <div className="px-6 pb-6">
          <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <Avatar initials={user.avatar} verified={user.verified} size="xl" />
              <div>
                <h1 className="text-2xl font-semibold">{user.displayName}</h1>
                <p className="text-[var(--muted-foreground)]">@{user.username}</p>
              </div>
            </div>
            <Link href="/settings">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
                Edit Profile
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm">{user.bio}</p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-[var(--muted-foreground)]">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {user.location}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" /> Joined{" "}
              {new Date(user.joinedAt).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="mt-4 flex gap-6 text-sm">
            <span>
              <strong>{user.followers}</strong>{" "}
              <span className="text-[var(--muted-foreground)]">followers</span>
            </span>
            <span>
              <strong>{user.following}</strong>{" "}
              <span className="text-[var(--muted-foreground)]">following</span>
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {user.badges.map((badge) => (
              <Badge key={badge} variant="accent">
                <Award className="mr-1 h-3 w-3" />
                {badge}
              </Badge>
            ))}
          </div>
          <PublicSocialLinks userId={profileUserId} />
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Link
              href="/rewards"
              className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--muted)]"
            >
              <Star className="h-4 w-4 text-[var(--accent)]" />
              <span>
                Level {points.level} · {points.balance.toLocaleString()} pts
              </span>
            </Link>
            <span className="flex items-center gap-2 rounded-xl border border-orange-500/20 bg-orange-500/5 px-3 py-2 text-sm">
              <Flame className="h-4 w-4 text-orange-500" />
              {points.streak}-day streak
            </span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="activity">
        <TabsList>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="saved">Saved</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          <div className="space-y-4 max-w-2xl">
            {userPosts.length > 0 ? (
              userPosts.map((post) => <FeedPostCard key={post.id} post={post} />)
            ) : (
              <p className="py-8 text-center text-[var(--muted-foreground)]">No posts yet</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="saved">
          <div className="space-y-4 max-w-2xl">
            {savedPosts.map((post) => (
              <FeedPostCard key={post.id} post={post} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reviews">
          <div className="space-y-4">
            {[
              { business: "Oak Street Bakery", rating: 5, text: "Best croissants in town!" },
              { business: "Green Thumb Landscaping", rating: 4, text: "Great work on our yard." },
            ].map((review, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{review.business}</span>
                  <span className="text-amber-400">{"★".repeat(review.rating)}</span>
                </div>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">{review.text}</p>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </PageTransition>
  );
}
