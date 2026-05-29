import { cn } from "@/lib/utils";

const variants = {
  default: "bg-[var(--muted)] text-[var(--foreground)]",
  accent: "bg-[var(--accent)]/15 text-[var(--accent)]",
  emergency: "bg-[var(--emergency)]/15 text-[var(--emergency)]",
  success: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof variants }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
