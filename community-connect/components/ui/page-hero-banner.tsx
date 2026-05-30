"use client";

import { CommunityImage } from "@/components/ui/community-image";
import { cn } from "@/lib/utils";

export function PageHeroBanner({
  src,
  alt,
  title,
  description,
  className,
  height = "h-36 md:h-44",
}: {
  src: string;
  alt: string;
  title?: string;
  description?: string;
  className?: string;
  height?: string;
}) {
  return (
    <div
      className={cn(
        "relative mb-6 overflow-hidden rounded-2xl border border-[var(--border)]",
        height,
        className
      )}
    >
      <CommunityImage
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 1200px"
        priority={false}
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/20 dark:from-black/80 dark:via-black/55" />
      {(title || description) && (
        <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-6">
          {title && <h2 className="text-xl font-semibold text-white md:text-2xl">{title}</h2>}
          {description && (
            <p className="mt-1 max-w-xl text-sm text-white/85">{description}</p>
          )}
        </div>
      )}
    </div>
  );
}
