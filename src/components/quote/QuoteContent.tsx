"use client";

import { motion, useReducedMotion } from "motion/react";
import type { EntranceAnimation, Quote } from "@/types/quote";

export function quoteLength(text: string) {
  if (text.length < 70) return "short";
  if (text.length < 140) return "medium";
  if (text.length < 230) return "long";
  return "very-long";
}

export function QuoteContent({ quote, animation }: { quote: Quote; animation: EntranceAnimation }) {
  const reduceMotion = useReducedMotion();
  const words = quote.text.split(/(\s+)/);
  const stagger = animation === "typewriter" ? 0.035 : 0.018;
  return (
    <p className="quote-copy" data-length={quoteLength(quote.text)} aria-label={quote.text}>
      {words.map((word, index) => word.trim() ? (
        <motion.span
          aria-hidden="true"
          className="inline-block"
          key={`${word}-${index}`}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: animation === "slide" ? 22 : 12, filter: "blur(7px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: reduceMotion ? 0.01 : 0.5, delay: reduceMotion ? 0 : Math.min(index * stagger, 0.52), ease: [0.22, 1, 0.36, 1] }}
        >{word}</motion.span>
      ) : <span aria-hidden="true" key={`space-${index}`}>{word}</span>)}
    </p>
  );
}
