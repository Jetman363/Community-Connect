import type { AchievementDto, LeaderboardEntry, PointsDto } from "@/types/engagement";

export const mockPoints: PointsDto = {
  balance: 1240,
  level: 5,
  streak: 7,
  nextLevelAt: 1500,
};

export const mockAchievements: AchievementDto[] = [
  {
    id: "a1",
    key: "first_post",
    title: "First Post",
    description: "Share your first community post",
    icon: "📝",
    points: 10,
    earned: true,
    earnedAt: "2024-03-20T00:00:00Z",
  },
  {
    id: "a2",
    key: "week_streak",
    title: "Week Warrior",
    description: "7-day check-in streak",
    icon: "🔥",
    points: 50,
    earned: true,
    earnedAt: "2025-05-28T00:00:00Z",
  },
  {
    id: "a3",
    key: "local_hero",
    title: "Local Hero",
    description: "Complete a community challenge",
    icon: "🏆",
    points: 100,
    earned: true,
    earnedAt: "2025-04-15T00:00:00Z",
  },
  {
    id: "a4",
    key: "deal_hunter",
    title: "Deal Hunter",
    description: "Redeem 5 local deals",
    icon: "🏷️",
    points: 75,
    earned: false,
  },
  {
    id: "a5",
    key: "group_leader",
    title: "Group Leader",
    description: "Moderate a community group",
    icon: "👥",
    points: 150,
    earned: false,
  },
  {
    id: "a6",
    key: "event_host",
    title: "Event Host",
    description: "Organize a community event",
    icon: "🎉",
    points: 200,
    earned: false,
  },
];

export const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, userId: "u2", displayName: "Sarah Martinez", avatar: "SM", balance: 3420, level: 8 },
  { rank: 2, userId: "u5", displayName: "Maria Lopez", avatar: "ML", balance: 2890, level: 7 },
  { rank: 3, userId: "demo-resident", displayName: "Alex Resident", avatar: "AR", balance: 1240, level: 5 },
  { rank: 4, userId: "u3", displayName: "James Kim", avatar: "JK", balance: 980, level: 4 },
  { rank: 5, userId: "u6", displayName: "Tom Nguyen", avatar: "TN", balance: 756, level: 4 },
  { rank: 6, userId: "u7", displayName: "Lisa Chen", avatar: "LC", balance: 620, level: 3 },
  { rank: 7, userId: "u8", displayName: "Mike Patel", avatar: "MP", balance: 445, level: 3 },
  { rank: 8, userId: "u9", displayName: "Emma Wilson", avatar: "EW", balance: 380, level: 2 },
];
