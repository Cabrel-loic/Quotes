"use client";

import { motion, useReducedMotion } from "motion/react";
import { QuoteAuthor } from "@/components/quote/QuoteAuthor";
import { QuoteContent } from "@/components/quote/QuoteContent";
import type { EntranceAnimation, Quote } from "@/types/quote";

export function ImmersiveLayout({ quote, animation, transitionKey }: { quote: Quote; animation: EntranceAnimation; transitionKey: number }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.blockquote
      key={transitionKey}
      className="immersive-quote mx-auto flex min-h-[44dvh] max-w-[70rem] flex-col items-center justify-center text-center"
      initial={{ opacity: 0, scale: reduceMotion ? 1 : animation === "stamp" ? 1.025 : 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: reduceMotion ? 0 : -12, filter: reduceMotion ? "none" : "blur(5px)" }}
      transition={{ duration: reduceMotion ? 0.01 : 0.42 }}
    >
      <span className="hero-quote-mark" aria-hidden="true">“</span>
      <QuoteContent quote={quote} animation={animation} />
      <QuoteAuthor author={quote.author} />
    </motion.blockquote>
  );
}
