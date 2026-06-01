import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto max-w-lg px-4 py-10">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
            Radius
          </p>
          <h1 className="text-display mt-1">Welcome to your community</h1>
        </div>
        <OnboardingProgress />
        {children}
      </div>
    </div>
  );
}
