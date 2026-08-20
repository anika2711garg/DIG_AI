"use client";

import { motion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/cn";
import { cardReveal, fadeUpReduced } from "@/lib/motion";
import { useMotionPreference } from "@/lib/use-motion-preference";

export function AnimatedCard({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const reduce = useMotionPreference();

  return (
    <motion.div
      variants={reduce ? fadeUpReduced : cardReveal}
      style={style}
      className={cn(
        "card-interactive group rounded-xl border border-[var(--border)] bg-[var(--card)] p-5",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}
