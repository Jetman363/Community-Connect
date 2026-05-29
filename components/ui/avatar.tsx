import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-xl",
};

export function Avatar({
  initials,
  src,
  size = "md",
  verified,
  className,
}: {
  initials: string;
  src?: string;
  size?: keyof typeof sizes;
  verified?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative inline-flex shrink-0", className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className={cn("rounded-full object-cover ring-2 ring-[var(--border)]", sizes[size])}
        />
      ) : (
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-[var(--muted)] font-medium text-[var(--foreground)] ring-2 ring-[var(--border)]",
            sizes[size]
          )}
        >
          {initials}
        </div>
      )}
      {verified && (
        <CheckCircle2 className="absolute -bottom-0.5 -right-0.5 h-4 w-4 fill-[var(--accent)] text-white" />
      )}
    </div>
  );
}
