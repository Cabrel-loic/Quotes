"use client";

import { motion, useReducedMotion } from "motion/react";

export function QuoteAuthor({ author, editorial = false }: { author: string; editorial?: boolean }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.footer
      className={`quote-byline ${editorial ? "quote-byline-editorial" : ""}`}
      initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: reduceMotion ? 0 : 0.42, duration: 0.5 }}
    >
      <span aria-hidden="true" />
      <cite>{author}</cite>
      {editorial ? <small>Today’s voice</small> : null}
    </motion.footer>
  );
}
