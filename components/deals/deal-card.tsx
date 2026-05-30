"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CommunityImage } from "@/components/ui/community-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Bookmark, Tag } from "lucide-react";
import type { DealDto } from "@/types/engagement";

function timeLeft(expiresAt: string) {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h left`;
  return `${hours}h left`;
}

export function DealCard({
  deal,
  onSave,
  onRedeem,
}: {
  deal: DealDto;
  onSave?: () => void;
  onRedeem?: () => void;
}) {
  const [countdown, setCountdown] = useState(timeLeft(deal.expiresAt));
  const urgent = new Date(deal.expiresAt).getTime() - Date.now() < 86400000 * 3;

  useEffect(() => {
    const t = setInterval(() => setCountdown(timeLeft(deal.expiresAt)), 60000);
    return () => clearInterval(t);
  }, [deal.expiresAt]);

  return (
    <motion.div whileHover={{ y: -2 }} className="min-w-[260px] shrink-0 snap-start">
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
        {deal.imageUrl && (
          <div className="relative h-36">
            <CommunityImage src={deal.imageUrl} alt={deal.title} fill sizes="260px" />
            <Badge
              className={`absolute left-3 top-3 ${urgent ? "bg-[var(--emergency)] text-white" : "bg-emerald-600 text-white"}`}
            >
              {deal.discount}
            </Badge>
          </div>
        )}
        <div className="p-4">
          <h3 className="font-semibold">{deal.title}</h3>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">{deal.businessName}</p>
          {deal.description && (
            <p className="mt-2 line-clamp-2 text-sm text-[var(--muted-foreground)]">
              {deal.description}
            </p>
          )}
          <div className="mt-3 flex items-center gap-2 text-xs">
            <Clock className={`h-3.5 w-3.5 ${urgent ? "text-[var(--emergency)]" : ""}`} />
            <span className={urgent ? "text-[var(--emergency)] font-medium" : "text-[var(--muted-foreground)]"}>
              {countdown}
            </span>
            <span className="text-[var(--muted-foreground)]">·</span>
            <Tag className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
            <span className="text-[var(--muted-foreground)]">{deal.redeemedCount} redeemed</span>
          </div>
          <div className="mt-3 flex gap-2">
            {onSave && (
              <Button
                size="sm"
                variant={deal.saved ? "secondary" : "outline"}
                onClick={onSave}
                className="flex-1"
              >
                <Bookmark className="mr-1 h-3.5 w-3.5" />
                {deal.saved ? "Saved" : "Save"}
              </Button>
            )}
            {onRedeem && (
              <Button size="sm" onClick={onRedeem} className="flex-1">
                Redeem
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
