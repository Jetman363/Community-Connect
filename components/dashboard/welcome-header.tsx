"use client";

import { motion } from "framer-motion";
import { Cloud, Sun, Droplets, Wind } from "lucide-react";
import { currentUser } from "@/lib/mock-data";

export function WelcomeHeader() {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
        {greeting}, {currentUser.displayName.split(" ")[0]}
      </h1>
      <p className="mt-1 text-[var(--muted-foreground)]">
        Here&apos;s what&apos;s happening in {currentUser.location}
      </p>
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
