"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Activity, ChevronDown, Menu, PlayCircle, Settings, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/lib/theme";
import { cn } from "@/lib/cn";
import { useMotionPreference } from "@/lib/use-motion-preference";

const MARKETING_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#templates", label: "Modes", dropdown: true },
  { href: "#docs", label: "Docs" },
  { href: "#pricing", label: "Pricing" },
];

const APP_LINKS = [
  { href: "/runs", label: "Runs", icon: PlayCircle },
  { href: "/eval", label: "Eval", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings },
];

const MODES = [
  { href: "#templates", title: "Strict", body: "Reproduce or refuse." },
  { href: "#templates", title: "Permissive", body: "Graded confidence, default mode." },
  { href: "#templates", title: "Vibes", body: "Ablation baseline only." },
];

function isActive(pathname: string, href: string) {
  if (href === "/runs") return pathname.startsWith("/runs");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({ variant = "marketing" }: { variant?: "marketing" | "app" }) {
  const reduce = useMotionPreference();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [modesOpen, setModesOpen] = useState(false);
  const links = variant === "app" ? APP_LINKS : MARKETING_LINKS;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={reduce ? { opacity: 1 } : { opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0.15 : 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled || variant === "app" ? "backdrop-blur-xl" : "bg-transparent",
      )}
      style={scrolled || variant === "app" ? { background: "var(--header-bg)" } : undefined}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1500px] items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link href="/" className="relative z-10">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          {links.map((link) =>
            "dropdown" in link && link.dropdown ? (
              <div
                key={link.label}
                className="relative"
                onMouseEnter={() => setModesOpen(true)}
                onMouseLeave={() => setModesOpen(false)}
              >
                <a
                  href={link.href}
                  className="nav-link inline-flex items-center gap-1 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text)]"
                >
                  {link.label}
                  <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.7} />
                </a>
                <AnimatePresence>
                  {modesOpen ? (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="absolute left-1/2 top-full z-20 mt-3 w-64 -translate-x-1/2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-2 shadow-2xl backdrop-blur-xl"
                    >
                      {MODES.map((item) => (
                        <a key={item.title} href={item.href} className="block rounded-lg px-3 py-2 hover:bg-[var(--card-hover)]">
                          <p className="text-sm text-[var(--text)]">{item.title}</p>
                          <p className="text-xs text-[var(--text-muted)]">{item.body}</p>
                        </a>
                      ))}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  "nav-link inline-flex items-center gap-1.5 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text)]",
                  variant === "app" && isActive(pathname, link.href) && "text-[var(--text)]",
                )}
                data-active={variant === "app" && isActive(pathname, link.href) ? "true" : undefined}
                aria-current={variant === "app" && isActive(pathname, link.href) ? "page" : undefined}
              >
                {"icon" in link && link.icon ? <link.icon className="h-3.5 w-3.5" strokeWidth={1.7} /> : null}
                {link.label}
              </Link>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          {variant === "app" ? (
            <Link href="/" className="nav-link text-[13px] text-[var(--text-secondary)] hover:text-[var(--text)]">
              Landing
            </Link>
          ) : (
            <Link href="/runs" className="nav-link text-[13px] text-[var(--text-secondary)] hover:text-[var(--text)]">
              Sign in
            </Link>
          )}
          <Button href="/runs" variant="white" className="h-9 px-4 text-[13px]">
            Get Started
          </Button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-[var(--border)] px-5 py-4 backdrop-blur-xl md:hidden"
            style={{ background: "var(--header-bg)" }}
          >
            <div className="flex flex-col gap-3 text-sm text-[var(--text-secondary)]">
              {links.map((link) => (
                <Link key={link.label} href={link.href} onClick={() => setOpen(false)}>
                  {link.label}
                </Link>
              ))}
              <Link href={variant === "app" ? "/" : "/runs"} onClick={() => setOpen(false)}>
                {variant === "app" ? "Landing" : "Sign in"}
              </Link>
              <Button href="/runs" variant="white" className="w-full">
                Get Started
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.header>
  );
}
