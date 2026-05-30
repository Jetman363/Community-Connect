"use client";

import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

type CommunityImageProps = Omit<ImageProps, "alt"> & {
  alt: string;
  rounded?: "none" | "lg" | "xl" | "2xl" | "full";
};

const roundedClass = {
  none: "",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  full: "rounded-full",
} as const;

export function CommunityImage({
  alt,
  className,
  rounded = "none",
  ...props
}: CommunityImageProps) {
  return (
    <Image
      alt={alt}
      className={cn("object-cover", roundedClass[rounded], className)}
      {...props}
    />
  );
}
