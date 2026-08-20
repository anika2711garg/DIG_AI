"use client";

import { AnimatePresence, motion } from "framer-motion";

import type { RunEvent } from "@/lib/types";

export function EventStream({ events }: { events: RunEvent[] }) {
  const newest = events[events.length - 1]?.id;

  return (
    <div className="rounded-2xl border border-[rgba(148,163,184,0.12)] bg-[#080B12] p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#64748B]">Event log</p>
        <span className="terminal-cursor" />
      </div>
      <div className="max-h-80 space-y-1 overflow-y-auto font-mono text-[12px]">
        {events.length === 0 ? (
          <p className="text-[#64748B]">Waiting for events<span className="terminal-cursor" /></p>
        ) : (
          <AnimatePresence initial={false}>
            {events.map((event) => (
              <motion.div
                key={event.id}
                initial={event.id === newest ? { opacity: 0, x: -5 } : false}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="flex gap-3 rounded-md px-1 py-1 text-[#94A3B8]"
              >
                <span className="shrink-0 text-[#64748B]">
                  {event.at ? new Date(event.at).toLocaleTimeString() : "--"}
                </span>
                <span className="text-[#93C5FD]">{event.type}</span>
                {event.state ? <span className="text-[#E2E8F0]">{event.state}</span> : null}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
