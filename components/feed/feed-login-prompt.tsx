import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

export function FeedLoginPrompt({ redirect = "/feed" }: { redirect?: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-[var(--border)] bg-[var(--card)] px-6 py-12 text-center">
      <LogIn className="mb-4 h-10 w-10 text-[var(--accent)]" />
      <h3 className="text-lg font-semibold">Sign in to view the community feed</h3>
      <p className="mt-2 max-w-sm text-sm text-[var(--muted-foreground)]">
        Like, comment, save, and share posts from neighbors in your community.
      </p>
      <Link href={`/login?redirect=${encodeURIComponent(redirect)}`} className="mt-6">
        <Button>Sign in</Button>
      </Link>
    </div>
  );
}
