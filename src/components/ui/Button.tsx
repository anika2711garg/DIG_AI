"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { springTap } from "@/lib/motion";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "warning" | "white" | "hero";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50";

const VARIANTS: Record<Variant, string> = {
  hero: "border border-white/20 bg-gradient-to-r from-[#38BDF8] via-[#7DD3FC] to-[#F8FAFC] text-[#05070B] shadow-[0_0_28px_rgba(56,189,248,0.22)] hover:shadow-[0_0_36px_rgba(56,189,248,0.34)]",
  primary:
    "border border-[rgba(96,165,250,0.35)] bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-white shadow-[0_0_24px_rgba(59,130,246,0.18)] hover:shadow-[0_0_32px_rgba(59,130,246,0.32)]",
  secondary:
    "border border-[var(--border-strong)] bg-[var(--card)] text-[var(--text-soft)] hover:border-[var(--border-strong)] hover:bg-[var(--card-strong)]",
  ghost: "border border-transparent bg-transparent text-[var(--text-secondary)] hover:text-[var(--text)]",
  danger:
    "border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.1)] text-[#FCA5A5] hover:border-[rgba(239,68,68,0.5)]",
  warning:
    "border border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.1)] text-[#FCD34D] hover:border-[rgba(245,158,11,0.5)]",
  white: "border border-white/10 bg-white text-[#05070B] hover:bg-[#F8FAFC]",
};

export function Button({
  children,
  className,
  variant = "primary",
  disabled,
  type = "button",
  href,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  variant?: Variant;
  disabled?: boolean;
  type?: "button" | "submit";
  href?: string;
  onClick?: () => void;
}) {
  const classes = cn(BASE, VARIANTS[variant], className);

  if (href && !disabled) {
    return (
      <motion.div
        className="inline-flex"
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        transition={springTap}
      >
        <Link href={href} className={classes}>
          {children}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={springTap}
      className={classes}
    >
      {children}
    </motion.button>
  );
}
