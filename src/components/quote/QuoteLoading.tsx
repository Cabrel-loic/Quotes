"use client";

import { motion, useReducedMotion } from "motion/react";

export function QuoteLoading() {
  const reduceMotion = useReducedMotion();
  return (
    <div className="flex min-h-[46dvh] flex-col items-center justify-center gap-6 text-center" role="status" aria-label="Preparing today’s quote">
      <motion.div className="daybook-loader" aria-hidden="true" animate={reduceMotion ? undefined : { opacity: [0.35, 1, 0.35], scale: [0.98, 1.03, 0.98] }} transition={{ duration: 2.2, repeat: Infinity }}><span>D</span></motion.div>
      <div><p className="font-display text-xl text-[var(--on)]">Opening today’s page</p><p className="mt-2 text-xs tracking-[.12em] text-[var(--onsoft)] uppercase">A thought worth keeping</p></div>
    </div>
  );
}
