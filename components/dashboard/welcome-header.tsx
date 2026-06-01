"use client";

import { motion } from "framer-motion";
import { Cloud, Sun, Droplets, Wind } from "lucide-react";
import { CommunityImage } from "@/components/ui/community-image";
import { communityPhotos } from "@/lib/images/community-photos";
import { currentUser } from "@/lib/mock-data";

export function WelcomeHeader({ bannerSrc }: { bannerSrc?: string }) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const banner = bannerSrc ?? communityPhotos.hero.dashboard;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className="relative mb-4 overflow-hidden rounded-2xl border border-[var(--border)]">
        <div className="relative h-28 md:h-32">
          <CommunityImage
            src={banner}
            alt="Scenic park path in Oak Hills community"
            fill
            sizes="(max-width: 768px) 100vw, 1200px"
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/40 to-transparent dark:from-black/75 dark:via-black/50" />
          <div className="absolute inset-0 flex flex-col justify-end p-5">
            <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
              {greeting}, {currentUser.displayName.split(" ")[0]}
            </h1>
            <p className="mt-1 text-sm text-white/80">
              Here&apos;s what&apos;s happening in {currentUser.location}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function WeatherWidget() {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--card)] to-[var(--muted)] p-4 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--muted-foreground)]">Oak Hills, CA</p>
          <p className="text-3xl font-light">72°F</p>
          <p className="text-sm text-[var(--muted-foreground)]">Partly cloudy</p>
        </div>
        <Sun className="h-12 w-12 text-amber-400" />
      </div>
      <div className="mt-4 flex gap-4 text-xs text-[var(--muted-foreground)]">
        <span className="flex items-center gap-1">
          <Droplets className="h-3.5 w-3.5" /> 45%
        </span>
        <span className="flex items-center gap-1">
          <Wind className="h-3.5 w-3.5" /> 8 mph
        </span>
        <span className="flex items-center gap-1">
          <Cloud className="h-3.5 w-3.5" /> H 78° L 62°
        </span>
      </div>
    </motion.div>
  );
}
