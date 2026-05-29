"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { BusinessCard } from "@/components/cards/business-card";
import { mockBusinesses } from "@/lib/mock-data";

export function NearbyServices() {
  const businesses = mockBusinesses.slice(0, 3);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Nearby Services</h2>
        <Link
          href="/services"
          className="flex items-center gap-1 text-sm text-[var(--accent)] hover:underline"
        >
          Directory <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {businesses.map((b, i) => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <BusinessCard business={b} compact />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
