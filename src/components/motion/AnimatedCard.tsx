"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { cardReveal, fadeUpReduced } from "@/lib/motion";

export function AnimatedCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      variants={reduce ? fadeUpReduced : cardReveal}
      className={cn(
        "card-interactive group rounded-2xl border border-[rgba(148,163,184,0.12)] bg-[#0D111A] p-5",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}
