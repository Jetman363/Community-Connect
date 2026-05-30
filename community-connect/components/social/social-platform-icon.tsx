import type { SocialPlatform } from "@prisma/client";
import { cn } from "@/lib/utils";

const PLATFORM_COLORS: Record<SocialPlatform, string> = {
  FACEBOOK: "bg-[#1877F2]",
  INSTAGRAM: "bg-gradient-to-br from-[#f09433] via-[#e6683c] to-[#bc1888]",
  TIKTOK: "bg-black",
  TWITTER: "bg-black",
  LINKEDIN: "bg-[#0A66C2]",
  YOUTUBE: "bg-[#FF0000]",
};

const PLATFORM_LETTERS: Record<SocialPlatform, string> = {
  FACEBOOK: "f",
  INSTAGRAM: "◎",
  TIKTOK: "♪",
  TWITTER: "𝕏",
  LINKEDIN: "in",
  YOUTUBE: "▶",
};

export function SocialPlatformIcon({
  platform,
  className,
  size = "md",
}: {
  platform: SocialPlatform;
  className?: string;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl font-bold text-white",
        PLATFORM_COLORS[platform],
        dim,
        className
      )}
      aria-hidden
    >
      {PLATFORM_LETTERS[platform]}
    </span>
  );
}
