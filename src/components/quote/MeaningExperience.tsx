"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { QuoteMeaning } from "@/types/quote";

export function MeaningExperience({ meaning, open, loading, source }: { meaning: QuoteMeaning; open: boolean; loading: boolean; source: "groq" | "cache" | "local" }) {
  const reduceMotion = useReducedMotion();
  return (
    <AnimatePresence initial={false}>
      {open ? <motion.section
        id="meaning-section"
        aria-labelledby="meaning-title"
        aria-busy={loading}
        className="meaning-experience relative mx-auto w-full max-w-[72rem] px-5 py-20 sm:px-8 sm:py-28"
        initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
        onAnimationComplete={() => document.getElementById("meaning-section")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" })}
      >
        {loading ? <MeaningLoading /> : <div className="meaning-grid">
          <header className="meaning-heading">
            <p>Reflection / 01</p>
            <h2 id="meaning-title">{meaning.title}</h2>
            <small>{source === "local" ? "Offline interpretation" : source === "cache" ? "AI interpretation · saved here" : "AI interpretation by Groq"}</small>
          </header>
          <div className="meaning-body">
            <Reveal><span className="meaning-number">01</span><h3>In simple words</h3><p>{meaning.simple}</p></Reveal>
            <Reveal delay={.08}><span className="meaning-number">02</span><h3>Look a little deeper</h3><p>{meaning.deeper}</p></Reveal>
            <Reveal delay={.16} className="reflection-question"><span className="meaning-number">03</span><h3>Carry this with you</h3><p>{meaning.reflection}</p></Reveal>
          </div>
        </div>}
      </motion.section> : null}
    </AnimatePresence>
  );
}

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return <motion.article className={className} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: .55, delay }}>{children}</motion.article>;
}

function MeaningLoading() {
  return <div className="meaning-loading-new" role="status"><p>Reading between the lines</p><span/><span/><span/></div>;
}
