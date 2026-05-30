"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function SearchLinkInput({ className }: { className?: string }) {
  return (
    <Link href="/search" className={cn("relative block flex-1", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)] pointer-events-none" />
      <Input
        readOnly
        placeholder="What do you need today?"
        className="pl-10 bg-[var(--muted)] border-transparent focus:border-[var(--border)] cursor-pointer"
      />
    </Link>
  );
}
