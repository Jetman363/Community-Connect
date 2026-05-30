import { communityPhotos } from "@/lib/images/community-photos";
import type { GroupDto } from "@/types/engagement";

export const mockGroups: GroupDto[] = [
  {
    id: "g1",
    name: "Oak Hills Runners",
    category: "Fitness",
    description: "Morning jogs, weekend 5Ks, and trail runs around the neighborhood.",
    coverPhoto: communityPhotos.events.youthSoccer,
    memberCount: 142,
    isPrivate: false,
    isMember: true,
    role: "MEMBER",
  },
  {
    id: "g2",
    name: "Neighborhood Garden Club",
    category: "Hobbies",
    description: "Seed swaps, compost tips, and front-yard garden tours.",
    coverPhoto: communityPhotos.events.farmersMarket,
    memberCount: 89,
    isPrivate: false,
    isMember: false,
  },
  {
    id: "g3",
    name: "Parents of Oak Hills",
    category: "Family",
    description: "Playdates, school updates, and kid-friendly event planning.",
    coverPhoto: communityPhotos.events.blockParty,
    memberCount: 312,
    isPrivate: false,
    isMember: true,
    role: "MODERATOR",
  },
  {
    id: "g4",
    name: "Local Foodies",
    category: "Food & Drink",
    description: "Restaurant reviews, pop-up alerts, and group dinners.",
    coverPhoto: communityPhotos.businesses.bakery,
    memberCount: 205,
    isPrivate: false,
    isMember: false,
  },
  {
    id: "g5",
    name: "Book & Coffee Club",
    category: "Social",
    description: "Monthly reads at Cedar Park café. Next: local author spotlight.",
    coverPhoto: communityPhotos.places.communityCenter,
    memberCount: 56,
    isPrivate: true,
    isMember: false,
  },
  {
    id: "g6",
    name: "Weekend Hikers",
    category: "Outdoors",
    description: "Easy-to-moderate hikes within 30 minutes of Oak Hills.",
    coverPhoto: communityPhotos.places.park,
    memberCount: 178,
    isPrivate: false,
    isMember: true,
    role: "MEMBER",
  },
];

export function getGroupById(id: string) {
  return mockGroups.find((g) => g.id === id);
}

export const mockGroupPosts = [
  {
    id: "gp1",
    groupId: "g1",
    author: "Sarah Martinez",
    content: "Who's in for a sunrise run Saturday? Meeting at Town Square 6:30 AM.",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "gp2",
    groupId: "g3",
    author: "Alex Resident",
    content: "Reminder: elementary school early dismissal Friday. Carpool thread below.",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "gp3",
    groupId: "g6",
    author: "James Kim",
    content: "Trail conditions at Redwood Loop are perfect this week. Photos attached!",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];
