"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";

import { formatExact, formatRelative } from "@/lib/relative-time";
import type { RunEvent } from "@/lib/types";

export function EventStream({ events }: { events: RunEvent[] }) {
  const newest = events[events.length - 1]?.id;
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [events.length]);

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-mid)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">Event log</p>
        <span className="terminal-cursor" />
      </div>
      <div ref={scroller} className="max-h-80 space-y-1 overflow-y-auto font-mono text-[12px]">
        {events.length === 0 ? (
          <p className="text-[var(--text-muted)]">
            Waiting for events
            <span className="terminal-cursor" />
          </p>
        ) : (
          <AnimatePresence initial={false}>
            {events.map((event, index) => (
              <motion.div
                key={`${event.id}-${event.at}-${index}`}
                initial={event.id === newest ? { opacity: 0, x: -5 } : false}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="flex gap-3 rounded-md px-1 py-1 text-[var(--text-secondary)]"
              >
                <span className="shrink-0 text-[var(--text-muted)]" title={formatExact(event.at)}>
                  {event.at ? formatRelative(event.at) : "--"}
                </span>
                <span className="text-[var(--accent-text)]">{event.type}</span>
                {event.state ? <span className="text-[var(--text-soft)]">{event.state}</span> : null}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
