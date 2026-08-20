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
      <footer className="border-t border-[rgba(148,163,184,0.1)] px-5 py-8 text-center text-xs text-[#64748B]">
        NEONE · Lumine Insights · Issue → PR
      </footer>
    </>
  );
}
