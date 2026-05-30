"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DailyCheckInButton } from "./daily-check-in-button";

export function QuickActionFab() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-20 right-4 z-40 md:bottom-6">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mb-3 flex flex-col items-end gap-2"
          >
            <Link
              href="/feed"
              className="rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm shadow-lg"
              onClick={() => setOpen(false)}
            >
              New Post
            </Link>
            <DailyCheckInButton />
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label="Quick actions"
      >
        <motion.div animate={{ rotate: open ? 45 : 0 }}>
          <Plus className="h-6 w-6" />
        </motion.div>
      </button>
    </div>
  );
}
