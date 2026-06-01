import type { SocialPlatform } from "@prisma/client";

export interface SocialLinkDto {
  id: string;
  platform: SocialPlatform;
  profileUrl: string;
  username: string | null;
  connectedAt: string;
  isPublic: boolean;
}

export const SOCIAL_PLATFORMS: {
  id: SocialPlatform;
  label: string;
  optional?: boolean;
}[] = [
  { id: "FACEBOOK", label: "Facebook" },
  { id: "INSTAGRAM", label: "Instagram" },
  { id: "TIKTOK", label: "TikTok" },
  { id: "TWITTER", label: "X (Twitter)" },
  { id: "LINKEDIN", label: "LinkedIn" },
  { id: "YOUTUBE", label: "YouTube", optional: true },
];
