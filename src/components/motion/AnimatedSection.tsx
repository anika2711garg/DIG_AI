"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

import { fadeUp, fadeUpReduced, viewportOnce } from "@/lib/motion";
import { useMotionPreference } from "@/lib/use-motion-preference";

export function AnimatedSection({
  children,
  className,
  delay = 0,
  id,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  id?: string;
}) {
  const reduce = useMotionPreference();

  return (
    <motion.section
      id={id}
      className={className ? `${className} scroll-mt-24` : "scroll-mt-24"}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={reduce ? fadeUpReduced : fadeUp}
      transition={reduce ? { duration: 0.15 } : { delay }}
    >
      {children}
    </motion.section>
  );
}
