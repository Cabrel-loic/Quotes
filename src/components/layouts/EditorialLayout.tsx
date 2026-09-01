"use client";

import { motion } from "motion/react";
import { QuoteAuthor } from "@/components/quote/QuoteAuthor";
import { QuoteContent } from "@/components/quote/QuoteContent";
import { getDateChrome } from "@/lib/date";
import type { EntranceAnimation, Quote } from "@/types/quote";

export function EditorialLayout({ quote, animation, transitionKey }: { quote: Quote; animation: EntranceAnimation; transitionKey: number }) {
  const date = getDateChrome();
  return (
    <motion.blockquote key={transitionKey} className="editorial-quote relative mx-auto min-h-[50dvh] max-w-[72rem]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -8 }}>
      <div className="editorial-issue" aria-hidden="true">{String(new Date().getDate()).padStart(2, "0")}</div>
      <div className="editorial-grid relative">
        <div className="editorial-rail" aria-hidden="true"><span>DAILY THOUGHT</span><i /></div>
        <div className="editorial-copy">
          <p className="editorial-running">DAYBOOK <span>/</span> {date.stamp}</p>
          <span className="editorial-mark" aria-hidden="true">“</span>
          <QuoteContent quote={quote} animation={animation} />
          <QuoteAuthor author={quote.author} editorial />
        </div>
      </div>
    </motion.blockquote>
  );
}
