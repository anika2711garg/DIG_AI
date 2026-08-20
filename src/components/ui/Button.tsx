"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { springTap } from "@/lib/motion";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "warning" | "white" | "hero";

const VARIANTS: Record<Variant, string> = {
  hero: "border border-white/20 bg-gradient-to-r from-[#38BDF8] via-[#7DD3FC] to-[#F8FAFC] text-[#05070B] shadow-[0_0_28px_rgba(56,189,248,0.22)] hover:shadow-[0_0_36px_rgba(56,189,248,0.34)]",
  primary:
    "border border-[rgba(96,165,250,0.35)] bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-white shadow-[0_0_24px_rgba(59,130,246,0.18)] hover:shadow-[0_0_32px_rgba(59,130,246,0.32)]",
  secondary:
    "border border-[rgba(148,163,184,0.18)] bg-[#0D111A]/70 text-[#E2E8F0] hover:border-[rgba(148,163,184,0.4)] hover:bg-[#151B26]",
  ghost: "border border-transparent bg-transparent text-[#94A3B8] hover:text-[#F8FAFC]",
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
  onClick,
}: {
  children: ReactNode;
  className?: string;
  variant?: Variant;
  disabled?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
}) {
  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={springTap}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </motion.button>
  );
}
