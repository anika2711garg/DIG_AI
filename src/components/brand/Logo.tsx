"use client";

import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/cn";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  const reduce = useReducedMotion();

  return (
    <span className={cn("inline-flex items-center gap-2 text-[#F8FAFC]", className)}>
      <span className="relative h-5 w-5 shrink-0">
        <motion.svg
          viewBox="0 0 24 24"
          className="absolute inset-0 h-5 w-5 text-[#60A5FA]"
          animate={reduce ? undefined : { opacity: [0.45, 0.9, 0.45], scale: [0.92, 1, 0.92] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        >
          <path
            d="M12 2.2 13.7 9.4 21 12 13.7 14.6 12 21.8 10.3 14.6 3 12 10.3 9.4Z"
            fill="currentColor"
          />
        </motion.svg>
        <svg viewBox="0 0 24 24" className="relative h-5 w-5" aria-hidden>
          <path
            d="M12 1.4 14.35 9.65 22.6 12 14.35 14.35 12 22.6 9.65 14.35 1.4 12 9.65 9.65Z"
            fill="currentColor"
          />
        </svg>
      </span>
      {compact ? null : <span className="text-[15px] font-semibold tracking-[0.18em]">NEONE</span>}
    </span>
  );
}
