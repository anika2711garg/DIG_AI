"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#templates", label: "Templates", dropdown: true },
  { href: "#docs", label: "Docs" },
  { href: "#pricing", label: "Pricing" },
];

const TEMPLATES = [
  { href: "#templates", title: "Strict", body: "Reproduce or refuse." },
  { href: "#templates", title: "Permissive", body: "Graded confidence, default mode." },
  { href: "#templates", title: "Vibes", body: "Ablation baseline only." },
];

export function SiteHeader() {
  const reduce = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);

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
        scrolled ? "bg-[#05070B]/78 backdrop-blur-xl" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="relative z-10">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) =>
            link.dropdown ? (
              <div
                key={link.label}
                className="relative"
                onMouseEnter={() => setTemplatesOpen(true)}
                onMouseLeave={() => setTemplatesOpen(false)}
              >
                <a
                  href={link.href}
                  className="nav-link inline-flex items-center gap-1 text-[13px] text-[#94A3B8] hover:text-[#F8FAFC]"
                >
                  {link.label}
                  <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.7} />
                </a>
                <AnimatePresence>
                  {templatesOpen ? (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="absolute left-1/2 top-full z-20 mt-3 w-64 -translate-x-1/2 rounded-xl border border-[rgba(148,163,184,0.12)] bg-[#0D111A]/95 p-2 shadow-2xl backdrop-blur-xl"
                    >
                      {TEMPLATES.map((item) => (
                        <a
                          key={item.title}
                          href={item.href}
                          className="block rounded-lg px-3 py-2 hover:bg-[#151B26]"
                        >
                          <p className="text-sm text-[#F8FAFC]">{item.title}</p>
                          <p className="text-xs text-[#64748B]">{item.body}</p>
                        </a>
                      ))}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            ) : (
              <a
                key={link.label}
                href={link.href}
                className="nav-link text-[13px] text-[#94A3B8] hover:text-[#F8FAFC]"
              >
                {link.label}
              </a>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <Link href="/runs" className="nav-link text-[13px] text-[#94A3B8] hover:text-[#F8FAFC]">
            Sign in
          </Link>
          <Link href="/runs">
            <Button variant="white" className="h-9 px-4 text-[13px]">
              Get Started
            </Button>
          </Link>
        </div>

        <button
          type="button"
          className="md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-[rgba(148,163,184,0.12)] bg-[#05070B]/95 px-5 py-4 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col gap-3 text-sm text-[#94A3B8]">
              {LINKS.map((link) => (
                <a key={link.label} href={link.href} onClick={() => setOpen(false)}>
                  {link.label}
                </a>
              ))}
              <Link href="/runs" onClick={() => setOpen(false)}>
                Sign in
              </Link>
              <Link href="/runs" onClick={() => setOpen(false)}>
                <Button variant="white" className="w-full">
                  Get Started
                </Button>
              </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.header>
  );
}
