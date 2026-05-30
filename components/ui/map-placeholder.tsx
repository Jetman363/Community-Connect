import { MapPin } from "lucide-react";
import { CommunityImage } from "@/components/ui/community-image";
import { communityPhotos } from "@/lib/images/community-photos";
import { cn } from "@/lib/utils";

export function MapPlaceholder({
  className,
  label = "Interactive map",
  height = "h-64",
  imageSrc,
}: {
  className?: string;
  label?: string;
  height?: string;
  imageSrc?: string;
}) {
  const bgImage = imageSrc ?? communityPhotos.places.aerialMap;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[var(--border)]",
        height,
        className
      )}
    >
      <CommunityImage
        src={bgImage}
        alt="Aerial view of a residential neighborhood"
        fill
        sizes="(max-width: 768px) 100vw, 600px"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-[var(--background)]/55 backdrop-blur-[1px] dark:bg-black/50" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--card)]/95 shadow-sm">
          <MapPin className="h-5 w-5 text-[var(--accent)]" />
        </div>
        <p className="text-sm font-medium text-[var(--foreground)]">{label}</p>
        <p className="text-xs text-[var(--muted-foreground)]">Map integration in Phase 3</p>
      </div>
      <div className="absolute left-[30%] top-[35%] h-3 w-3 rounded-full bg-[var(--accent)] shadow-md ring-2 ring-white" />
      <div className="absolute left-[55%] top-[50%] h-3 w-3 rounded-full bg-[var(--emergency)] shadow-md ring-2 ring-white" />
      <div className="absolute left-[70%] top-[30%] h-3 w-3 rounded-full bg-emerald-500 shadow-md ring-2 ring-white" />
    </div>
  );
}
