"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import Link from "next/link";

import { FloatingImage } from "@/components/motion/FloatingImage";
import { LiveIndicator } from "@/components/motion/LiveIndicator";
import { Button } from "@/components/ui/Button";
import { fadeUp, fadeUpReduced } from "@/lib/motion";

export function Hero() {
  const reduce = useReducedMotion();
  const variants = reduce ? fadeUpReduced : fadeUp;

  return (
    <section className="relative overflow-hidden pt-28 sm:pt-32">
      <div className="hero-crescent" aria-hidden>
        <div className="hero-crescent-arc" />
        <span className="hero-ray left-[28%]" />
        <span className="hero-ray left-[50%] h-[320px] opacity-70" />
        <span className="hero-ray left-[71%] opacity-50" />
      </div>

      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-5 text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={variants}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(96,165,250,0.28)] bg-[#0D111A]/70 px-3 py-1 text-xs text-[#E2E8F0] shadow-[0_0_24px_rgba(59,130,246,0.12)]"
        >
          <span className="text-[#93C5FD]">✦</span>
          Early Access Beta
        </motion.div>

        <div className="space-y-2">
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={variants}
            transition={{ delay: reduce ? 0 : 0.06 }}
            className="text-[2.4rem] font-semibold leading-[1.05] tracking-tight text-[#F8FAFC] sm:text-6xl"
          >
            Build Faster With
          </motion.h1>
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={variants}
            transition={{ delay: reduce ? 0 : 0.12 }}
            className="bg-gradient-to-b from-white to-[#93C5FD] bg-clip-text text-[2.4rem] font-semibold leading-[1.05] tracking-tight text-transparent sm:text-6xl"
          >
            Lumine Insights.
          </motion.h1>
        </div>

        <motion.p
          initial="hidden"
          animate="visible"
          variants={variants}
          transition={{ delay: reduce ? 0 : 0.22 }}
          className="mt-6 max-w-xl text-[15px] leading-7 text-[#94A3B8]"
        >
          A minimal AI-powered system that transforms complex workflows into clear, glowing,
          effortless structures — helping you ship ideas faster.
        </motion.p>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={variants}
          transition={{ delay: reduce ? 0 : 0.3 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Link href="/runs">
            <Button variant="hero" className="group min-w-[148px]">
              Get Started
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.7} />
            </Button>
          </Link>
          <a href="#pipeline">
            <Button variant="secondary" className="min-w-[148px]">
              <Play className="h-3.5 w-3.5" strokeWidth={1.7} />
              Watch Demo
            </Button>
          </a>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={variants}
          transition={{ delay: reduce ? 0 : 0.4 }}
          className="mt-6"
        >
          <LiveIndicator label="Issue → Reproduce → Patch → Verify → PR" />
        </motion.div>
      </div>

      <FloatingImage />
    </section>
  );
}
