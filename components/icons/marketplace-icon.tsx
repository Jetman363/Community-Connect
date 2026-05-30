import { cn } from "@/lib/utils";

const COLORS = {
  primary: "#2563EB",
  secondary: "#111827",
  accent: "#10B981",
} as const;

type Variant = "default" | "dark" | "light" | "mono";

interface MarketplaceIconProps {
  className?: string;
  variant?: Variant;
  size?: number;
}

function getColors(variant: Variant) {
  switch (variant) {
    case "dark":
      return { primary: "#60A5FA", secondary: "#F9FAFB", accent: "#34D399" };
    case "light":
      return COLORS;
    case "mono":
      return { primary: "currentColor", secondary: "currentColor", accent: "currentColor" };
    default:
      return COLORS;
  }
}

function MarketplaceSvg({ className, variant = "default", size = 24 }: MarketplaceIconProps) {
  const c = getColors(variant);
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      {/* Storefront awning */}
      <path
        d="M3 9.5L4.5 5.5C4.7 4.9 5.3 4.5 6 4.5H18C18.7 4.5 19.3 4.9 19.5 5.5L21 9.5"
        stroke={c.primary}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 9.5H21V11C21 11.6 20.6 12 20 12H4C3.4 12 3 11.6 3 11V9.5Z"
        stroke={c.primary}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Store body */}
      <rect
        x="5"
        y="12"
        width="14"
        height="8"
        rx="1.5"
        stroke={c.secondary}
        strokeWidth="1.5"
      />
      {/* Door */}
      <rect x="10" y="14.5" width="4" height="5.5" rx="0.5" stroke={c.secondary} strokeWidth="1.2" />
      {/* Location pin */}
      <path
        d="M12 2C10.3 2 9 3.3 9 5C9 7 12 10 12 10C12 10 15 7 15 5C15 3.3 13.7 2 12 2Z"
        stroke={c.accent}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="5" r="1" fill={c.accent} />
      {/* Shopping bag */}
      <path
        d="M16.5 14.5H19.5C19.8 14.5 20 14.7 20 15V19C20 19.6 19.6 20 19 20H17C16.4 20 16 19.6 16 19V15.5"
        stroke={c.accent}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 14.5V13.5C17 12.7 17.7 12 18.5 12C19.3 12 20 12.7 20 13.5V14.5"
        stroke={c.accent}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SidebarIcon(props: Omit<MarketplaceIconProps, "size">) {
  return <MarketplaceSvg {...props} size={16} />;
}

export function MobileNavIcon(props: Omit<MarketplaceIconProps, "size">) {
  return <MarketplaceSvg {...props} size={20} />;
}

export function BadgeIcon(props: Omit<MarketplaceIconProps, "size">) {
  return <MarketplaceSvg {...props} size={14} />;
}

export function AppAccentIcon(props: Omit<MarketplaceIconProps, "size">) {
  return <MarketplaceSvg {...props} size={32} variant="default" />;
}

export { MarketplaceSvg as MarketplaceIcon, COLORS as marketplaceIconColors };
