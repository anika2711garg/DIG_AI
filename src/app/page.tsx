import { Hero } from "@/components/landing/Hero";
import { LandingSections } from "@/components/landing/LandingSections";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <LandingSections />
      </main>
      <footer className="mx-auto flex w-full max-w-[1500px] flex-col items-center justify-between gap-2 border-t border-[var(--border)] px-5 py-8 text-xs text-[var(--text-muted)] sm:flex-row sm:px-8 lg:px-10">
        <span className="font-mono">NEONE · Lumine Insights</span>
        <span>Issue → Reproduce → Patch → Verify → PR</span>
        <span>Self-hosted · human-gated</span>
      </footer>
    </>
  );
}
