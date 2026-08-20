"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useRef, useState } from "react";

const HERO_IMAGE_SRC = "/images/hero-preview.png";

export function FloatingImage() {
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);

  const onMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (reduce) return;
      if (window.matchMedia("(pointer: coarse)").matches) return;
      const rect = wrapRef.current?.getBoundingClientRect();
      if (!rect) return;
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      setTilt({ x: py * -3, y: px * 4 });
      setHovering(true);
    },
    [reduce],
  );

  const onLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
    setHovering(false);
  }, []);

  return (
    <motion.div
      ref={wrapRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      initial={reduce ? { opacity: 1 } : { opacity: 0, y: 30, scale: 0.97 }}
      animate={
        reduce
          ? { opacity: 1 }
          : {
              opacity: 1,
              y: hovering ? [null, null] : [0, -6, 0],
              scale: 1,
              rotateX: tilt.x,
              rotateY: tilt.y,
            }
      }
      transition={
        hovering || reduce
          ? { duration: 0.45, ease: "easeOut" }
          : { y: { duration: 7, repeat: Infinity, ease: "easeInOut" }, duration: 0.95 }
      }
      style={{ perspective: 1200, transformStyle: "preserve-3d" }}
      className="relative mx-auto mt-16 w-full max-w-5xl px-4 sm:mt-20 sm:px-6"
    >
      <div className="pointer-events-none absolute left-1/2 top-[30%] h-[280px] w-[80%] -translate-x-1/2 rounded-full bg-[rgba(59,130,246,0.16)] blur-[110px]" />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-8 h-64 w-[70%] -translate-x-1/2 rounded-full bg-[rgba(56,189,248,0.12)] blur-[90px]"
        animate={reduce ? undefined : { opacity: [0.12, 0.2, 0.12], scale: [1, 1.06, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="image-border relative overflow-hidden rounded-2xl bg-[#0D111A] shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HERO_IMAGE_SRC}
          alt="NEONE product preview"
          className="relative z-10 block h-auto w-full"
        />
      </div>
    </motion.div>
  );
}

export const HERO_IMAGE_PATH = HERO_IMAGE_SRC;
