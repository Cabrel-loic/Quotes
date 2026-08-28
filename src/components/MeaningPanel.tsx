"use client";

import { AnimatePresence, motion } from "motion/react";
import type { QuoteMeaning } from "@/types/quote";

export function MeaningPanel({ meaning, open }: { meaning: QuoteMeaning; open: boolean }) {
  return (
    <AnimatePresence initial={false}>
      {open ? (
        <motion.section id="meaning-panel" className="meaning-panel is-open" aria-hidden={false} initial={{ opacity: 0, height: 0, y: -16 }} animate={{ opacity: 1, height: "auto", y: 0 }} exit={{ opacity: 0, height: 0, y: -10 }} transition={{ type: "spring", stiffness: 190, damping: 25 }}>
          <motion.div className="meaning-inner" initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } } }}>
            <motion.p variants={itemVariants} className="meaning-kicker">Meaning</motion.p>
            <motion.h2 variants={itemVariants}>{meaning.title}</motion.h2>
            <motion.p variants={itemVariants}>{meaning.simple}</motion.p>
            <motion.p variants={itemVariants}>{meaning.deeper}</motion.p>
            <motion.div variants={itemVariants} className="reflection-box">
              <span>Ask yourself</span>
              <p>{meaning.reflection}</p>
            </motion.div>
          </motion.div>
        </motion.section>
      ) : null}
    </AnimatePresence>
  );
}

const itemVariants = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
