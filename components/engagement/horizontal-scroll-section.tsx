"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function HorizontalScrollSection({
  title,
  href,
  children,
}: {
  title: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        {href && (
          <Link
            href={href}
            className="flex items-center gap-0.5 text-sm text-[var(--accent)] hover:underline"
          >
            See all <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 snap-x snap-mandatory scrollbar-hide">
        {children}
      </div>
    </section>
  );
}
