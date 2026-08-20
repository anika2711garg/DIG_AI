"use client";

import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";

import { HeroConsole } from "@/components/landing/HeroConsole";
import { HeroHorizon } from "@/components/landing/HeroHorizon";
import { InkUnderline } from "@/components/human/InkUnderline";
import { LiveIndicator } from "@/components/motion/LiveIndicator";
import { Button } from "@/components/ui/Button";
import { fadeUp } from "@/lib/motion";
import { useMotionPreference } from "@/lib/use-motion-preference";

export function Hero() {
  const reduce = useMotionPreference();

  return (
    <section className="relative flex min-h-screen flex-col overflow-hidden pt-28 sm:pt-32">
      <HeroHorizon />

      <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center px-5 text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="mb-6 inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--card)]/70 px-2.5 py-1 font-mono text-[11px] text-[var(--text-soft)]"
        >
          <span className="relative inline-flex h-1.5 w-1.5">
            <span className="absolute inset-0 rounded-full bg-[#60A5FA] status-pulse" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-[#93C5FD]" />
          </span>
          Early Access Beta
        </motion.div>

        <div className="space-y-1">
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ delay: reduce ? 0 : 0.06 }}
            className="text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--text)] sm:text-[4.25rem] lg:text-[5rem]"
          >
            Build faster with
          </motion.h1>
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ delay: reduce ? 0 : 0.12 }}
            className="text-[2.7rem] leading-[1.05] text-[var(--text)] sm:text-[4.4rem] lg:text-[5.15rem]"
          >
            <span className="font-serif italic font-normal tracking-normal text-[var(--text-soft)]">
              Lumine
            </span>{" "}
            <InkUnderline>
              <span className="font-semibold tracking-[-0.03em]">Insights.</span>
            </InkUnderline>
          </motion.h1>
        </div>

        <motion.p
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ delay: reduce ? 0 : 0.22 }}
          className="mt-6 max-w-[36rem] text-[15px] leading-7 text-[var(--text-secondary)] sm:text-base"
        >
          Issue in, draft PR out — but only after a failing test proves the bug exists.
          If we can&apos;t reproduce it, we stop. That&apos;s the product.
        </motion.p>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ delay: reduce ? 0 : 0.3 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Button href="/runs" variant="hero" className="group min-w-[148px]">
            Get Started
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.7} />
          </Button>
          <Button href="#pipeline" variant="secondary" className="min-w-[148px]">
            <Play className="h-3.5 w-3.5" strokeWidth={1.7} />
            Watch Demo
          </Button>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ delay: reduce ? 0 : 0.4 }}
          className="mt-6"
        >
          <LiveIndicator label="Issue → Reproduce → Patch → Verify → PR" />
        </motion.div>
      </div>

      <div className="relative mt-auto w-full">
        <HeroConsole />
      </div>
    </section>
  );
}
