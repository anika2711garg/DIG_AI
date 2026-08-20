"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { LaptopFrame } from "@/components/chrome/LaptopFrame";
import { SiteHeader } from "@/components/layout/SiteHeader";

export function AppShell({
  children,
  title,
  crumbs,
  aside,
  path,
  status,
}: {
  children: ReactNode;
  title: string;
  crumbs?: string;
  aside?: ReactNode;
  path?: string;
  status?: string;
}) {
  const pathname = usePathname();
  const consolePath = path ?? `~/itp${pathname}`;

  return (
    <div className="min-h-screen">
      <SiteHeader variant="app" />
      <div className="mx-auto w-full max-w-[1500px] px-3 pb-10 pt-24 sm:px-6 lg:px-10">
        <LaptopFrame path={consolePath} status={status ?? "Agent ready"}>
          <div className="flex items-end justify-between gap-4 border-b border-[var(--border)] px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <p className="font-mono text-[11px] text-[var(--text-muted)]">{crumbs ?? "Dashboards"}</p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-[var(--text)] sm:text-2xl">
                {title}
              </h1>
            </div>
          </div>
          {aside ? (
            <div className="border-b border-[var(--border-subtle)] px-5 py-3 sm:px-6">{aside}</div>
          ) : null}
          <div className="min-h-[28rem] p-5 sm:p-6">{children}</div>
        </LaptopFrame>
      </div>
    </div>
  );
}
