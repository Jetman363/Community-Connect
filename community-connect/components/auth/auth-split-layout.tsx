import Link from "next/link";
import { CommunityImage } from "@/components/ui/community-image";
import { communityPhotos } from "@/lib/images/community-photos";

export function AuthSplitLayout({
  children,
  headline = "Stay connected with your neighborhood",
  subline = "Safety alerts, local events, and neighbors — all in one place.",
}: {
  children: React.ReactNode;
  headline?: string;
  subline?: string;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 lg:block">
        <CommunityImage
          src={communityPhotos.hero.auth}
          alt="Neighbors chatting in a friendly community setting"
          fill
          sizes="50vw"
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/20" />
        <div className="absolute inset-0 flex flex-col justify-between p-10">
          <Link href="/" className="text-lg font-semibold text-white">
            Community <span className="text-sky-300">Connect</span>
          </Link>
          <div>
            <h2 className="max-w-md text-3xl font-semibold leading-tight text-white">
              {headline}
            </h2>
            <p className="mt-3 max-w-sm text-sm text-white/80">{subline}</p>
          </div>
          <p className="text-xs text-white/50">Photos from Unsplash</p>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center bg-[var(--background)] px-4 py-10">
        {children}
      </div>
    </div>
  );
}
