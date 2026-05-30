import Link from "next/link";
import { ArrowRight, Shield, Calendar, Store, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { CommunityImage } from "@/components/ui/community-image";
import { communityPhotos } from "@/lib/images/community-photos";
import { siteConfig } from "@/config/site";

const features = [
  {
    icon: Shield,
    title: "Safety alerts",
    description: "Real-time advisories from local agencies and neighbors.",
    image: communityPhotos.safety.banner,
    alt: "Emergency services vehicle with subtle lighting",
  },
  {
    icon: Calendar,
    title: "Local events",
    description: "Farmers markets, block parties, and community meetings.",
    image: communityPhotos.events.farmersMarket,
    alt: "Farmers market with fresh produce",
  },
  {
    icon: Store,
    title: "Neighborhood services",
    description: "Discover verified local businesses and marketplace listings.",
    image: communityPhotos.businesses.cornerStore,
    alt: "Corner grocery store storefront",
  },
  {
    icon: Users,
    title: "Neighbor feed",
    description: "Share updates, polls, and help each other stay informed.",
    image: communityPhotos.people.neighbors,
    alt: "Diverse group of neighbors socializing outdoors",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <span className="text-lg font-semibold">
            Community <span className="text-[var(--accent)]">Connect</span>
          </span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <CommunityImage
            src={communityPhotos.hero.landing}
            alt="Tree-lined neighborhood street at golden hour"
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-[var(--background)]" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-24 text-center md:py-32">
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-6xl">
            {siteConfig.description}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-white/85">
            Safety alerts, local services, events, and neighbors — one connected platform for your
            community.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register">
              <Button size="lg">
                Join your community <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-semibold">Everything your community needs</h2>
          <p className="mt-2 text-[var(--muted-foreground)]">
            One platform for staying safe, informed, and connected locally.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, description, image, alt }) => (
            <article
              key={title}
              className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm"
            >
              <div className="relative h-36">
                <CommunityImage
                  src={image}
                  alt={alt}
                  fill
                  sizes="(max-width: 640px) 100vw, 280px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 text-[var(--accent)] shadow-sm">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">{description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-[var(--border)] bg-[var(--muted)]/30">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 md:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
            <CommunityImage
              src={communityPhotos.hero.landingSide}
              alt="Community members gathered at a local park event"
              fill
              sizes="(max-width: 768px) 100vw, 560px"
              className="object-cover"
            />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Built for neighborhoods like yours</h2>
            <p className="mt-3 text-[var(--muted-foreground)]">
              From HOA announcements to emergency alerts, Community Connect brings residents,
              businesses, and local agencies together on a single trusted platform.
            </p>
            <Link href="/register" className="mt-6 inline-block">
              <Button>
                Create free account <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
