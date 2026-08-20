"use client";

import {
  Activity,
  CheckSquare,
  LayoutDashboard,
  PlayCircle,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { Logo } from "@/components/brand/Logo";
import { LiveIndicator } from "@/components/motion/LiveIndicator";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/runs", label: "Overview", icon: LayoutDashboard },
  { href: "/runs", label: "Runs", icon: PlayCircle, match: /^\/runs/ },
  { href: "/eval", label: "Eval", icon: Activity, match: /^\/eval/ },
];

export function AppShell({
  children,
  title,
  crumbs,
  aside,
}: {
  children: ReactNode;
  title: string;
  crumbs?: string;
  aside?: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen px-3 py-3 sm:px-5 sm:py-5">
      <div className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-[1440px] grid-cols-1 overflow-hidden rounded-2xl border border-[rgba(148,163,184,0.12)] bg-[#0D111A]/80 shadow-[0_0_80px_rgba(59,130,246,0.08)] lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_280px]">
        <aside className="hidden border-r border-[rgba(148,163,184,0.1)] lg:block">
          <div className="flex h-14 items-center gap-2 border-b border-[rgba(148,163,184,0.1)] px-4">
            <Link href="/">
              <Logo />
            </Link>
          </div>
          <div className="px-3 py-4">
            <p className="mb-2 px-2 text-[10px] uppercase tracking-[0.18em] text-[#64748B]">Favorites</p>
            <nav className="space-y-1">
              {NAV.map((item) => {
                const active = item.match ? item.match.test(pathname) : pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-[#94A3B8] transition-colors hover:bg-[#151B26] hover:text-[#F8FAFC]",
                      active && "bg-[#151B26] text-[#F8FAFC] shadow-[inset_0_0_0_1px_rgba(59,130,246,0.28)]",
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.7} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <p className="mb-2 mt-6 px-2 text-[10px] uppercase tracking-[0.18em] text-[#64748B]">Projects</p>
            <Link
              href="/runs"
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-[#94A3B8] hover:bg-[#151B26] hover:text-[#F8FAFC]"
            >
              <Sparkles className="h-4 w-4" strokeWidth={1.7} />
              Issue → PR
            </Link>
            <p className="mb-2 mt-6 px-2 text-[10px] uppercase tracking-[0.18em] text-[#64748B]">Dashboards</p>
            <Link
              href="/eval"
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-[#94A3B8] hover:bg-[#151B26] hover:text-[#F8FAFC]"
            >
              <CheckSquare className="h-4 w-4" strokeWidth={1.7} />
              Evaluation
            </Link>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="flex h-14 items-center justify-between gap-3 border-b border-[rgba(148,163,184,0.1)] px-4">
            <div className="min-w-0">
              <p className="truncate font-mono text-[11px] text-[#64748B]">{crumbs ?? "Dashboards / Default"}</p>
              <h1 className="truncate text-sm font-medium text-[#F8FAFC]">{title}</h1>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <div className="h-8 w-44 rounded-lg border border-[rgba(148,163,184,0.12)] bg-[#080B12] px-3 text-xs leading-8 text-[#64748B]">
                Search runs…
              </div>
              <LiveIndicator label="Agent ready" pulse={false} tone="slate" />
            </div>
          </header>
          <div className="flex gap-3 overflow-x-auto border-b border-[rgba(148,163,184,0.08)] px-4 py-2 lg:hidden">
            {NAV.map((item) => (
              <Link key={item.label} href={item.href} className="text-xs text-[#94A3B8]">
                {item.label}
              </Link>
            ))}
          </div>
          <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
        </div>

        <aside className="hidden border-l border-[rgba(148,163,184,0.1)] xl:block">
          <div className="h-14 border-b border-[rgba(148,163,184,0.1)] px-4 text-sm leading-[56px] text-[#E2E8F0]">
            Activity
          </div>
          <div className="p-4">{aside ?? <DefaultActivity />}</div>
        </aside>
      </div>
    </div>
  );
}

function DefaultActivity() {
  return (
    <div className="space-y-4 text-sm">
      <div className="flex gap-2">
        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#3B82F6]" />
        <div>
          <p className="text-[#E2E8F0]">Event log connected</p>
          <p className="text-xs text-[#64748B]">SSE replay from persisted events</p>
        </div>
      </div>
      <div className="flex gap-2">
        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#F59E0B]" />
        <div>
          <p className="text-[#E2E8F0]">Human gate armed</p>
          <p className="text-xs text-[#64748B]">PRs stay draft until approval</p>
        </div>
      </div>
      <div className="flex gap-2">
        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#94A3B8]" />
        <div>
          <p className="text-[#E2E8F0]">Sandbox isolated</p>
          <p className="text-xs text-[#64748B]">Network-off · no secrets</p>
        </div>
      </div>
    </div>
  );
}
