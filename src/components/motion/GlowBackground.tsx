"use client";

import { useReducedMotion } from "framer-motion";

const PARTICLES = [
  { top: "18%", left: "12%", delay: "0s" },
  { top: "26%", left: "78%", delay: "2s" },
  { top: "42%", left: "22%", delay: "4s" },
  { top: "48%", left: "64%", delay: "1.2s" },
  { top: "62%", left: "18%", delay: "3.4s" },
  { top: "68%", left: "82%", delay: "5s" },
  { top: "74%", left: "46%", delay: "1.8s" },
  { top: "34%", left: "52%", delay: "6s" },
  { top: "56%", left: "36%", delay: "2.6s" },
  { top: "22%", left: "88%", delay: "3s" },
  { top: "80%", left: "28%", delay: "4.5s" },
  { top: "16%", left: "40%", delay: "7s" },
];

export function GlowBackground() {
  const reduce = useReducedMotion();

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[#05070B]" />
      <div className="bg-grid absolute inset-0 opacity-90" />
      <div className="ambient-glow ambient-glow-a -left-[8%] top-[-8%]" />
      <div className="ambient-glow ambient-glow-b right-[-6%] top-[28%]" />
      <div className="ambient-glow ambient-glow-a bottom-[-18%] left-[30%] opacity-40" />
      {!reduce &&
        PARTICLES.map((p, i) => (
          <span
            key={i}
            className="particle"
            style={{ top: p.top, left: p.left, animationDelay: p.delay }}
          />
        ))}
    </div>
  );
}
