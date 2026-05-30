import { communityPhotos } from "@/lib/images/community-photos";
import type { DiscoverFeedItem, ActivityFeedItem } from "@/types/engagement";
import { mockDeals } from "./deals";
import { mockGroups } from "./groups";
import { mockEvents } from "./events";
import { mockNewsArticles } from "./news";
import { mockChallenges } from "./challenges";

export const mockDiscoverFeed: DiscoverFeedItem[] = [
  {
    id: "df1",
    type: "post",
    title: "Block party planning is in full swing!",
    subtitle: "Sarah Martinez · 2h ago · 42 reactions",
    imageUrl: communityPhotos.events.blockParty,
    score: 98,
    href: "/feed",
  },
  {
    id: "df2",
    type: "deal",
    title: mockDeals[0].title,
    subtitle: `${mockDeals[0].businessName} · ${mockDeals[0].discount}`,
    imageUrl: mockDeals[0].imageUrl ?? undefined,
    score: 92,
    href: "/deals",
  },
  {
    id: "df3",
    type: "event",
    title: mockEvents[0].title,
    subtitle: `${mockEvents[0].location} · ${new Date(mockEvents[0].startsAt).toLocaleDateString()}`,
    imageUrl: mockEvents[0].imageUrl ?? undefined,
    score: 88,
    href: "/events",
  },
  {
    id: "df4",
    type: "group",
    title: mockGroups[2].name,
    subtitle: `${mockGroups[2].memberCount} members · ${mockGroups[2].category}`,
    imageUrl: mockGroups[2].coverPhoto ?? undefined,
    score: 85,
    href: "/groups/g3",
  },
  {
    id: "df5",
    type: "news",
    title: mockNewsArticles[0].title,
    subtitle: mockNewsArticles[0].source,
    imageUrl: mockNewsArticles[0].imageUrl ?? undefined,
    score: 80,
    href: "/news",
  },
  {
    id: "df6",
    type: "challenge",
    title: mockChallenges[0].title,
    subtitle: `${mockChallenges[0].participantCount} participating`,
    imageUrl: mockChallenges[0].imageUrl ?? undefined,
    score: 76,
    href: "/challenges",
  },
  {
    id: "df7",
    type: "post",
    title: "Lost cat update — Mango was found!",
    subtitle: "James Kim · 5h ago",
    imageUrl: communityPhotos.feed.lostPet,
    score: 94,
    href: "/feed",
  },
  {
    id: "df8",
    type: "deal",
    title: mockDeals[3].title,
    subtitle: "Expires soon!",
    imageUrl: mockDeals[3].imageUrl ?? undefined,
    score: 91,
    href: "/deals",
  },
];

export const mockActivityFeed: ActivityFeedItem[] = [
  {
    id: "af1",
    userId: "u2",
    displayName: "Sarah Martinez",
    avatar: "SM",
    action: "joined",
    target: "Oak Hills Runners",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: "af2",
    userId: "u3",
    displayName: "James Kim",
    action: "redeemed",
    target: "20% Off Pastries",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "af3",
    userId: "demo-resident",
    displayName: "Alex Resident",
    action: "completed check-in",
    target: "7-day streak 🔥",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "af4",
    userId: "u2",
    displayName: "Sarah Martinez",
    action: "RSVP'd to",
    target: "Farmers Market",
    timestamp: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: "af5",
    userId: "u3",
    displayName: "James Kim",
    action: "earned badge",
    target: "Trail Blazer",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const mockTrendingItems = mockDiscoverFeed.slice(0, 5).map((item, i) => ({
  id: `t${i + 1}`,
  entityType: item.type.toUpperCase(),
  entityId: item.id,
  score: item.score ?? 0,
  period: "DAY",
  title: item.title,
  imageUrl: item.imageUrl,
}));
