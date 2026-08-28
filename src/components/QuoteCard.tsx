"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import type { EntranceAnimation, Quote } from "@/types/quote";

interface QuoteCardProps {
  quote: Quote | null;
  animation: EntranceAnimation;
  animationKey: number;
}

export function QuoteCard({ quote, animation, animationKey }: QuoteCardProps) {
  const reduceMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 330, damping: 32, mass: 0.38 });
  const smoothY = useSpring(pointerY, { stiffness: 330, damping: 32, mass: 0.38 });
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-2.2, 2.2]);
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [2, -2]);
  const textX = useTransform(smoothX, [-0.5, 0.5], [-6, 6]);
  const textY = useTransform(smoothY, [-0.5, 0.5], [-4, 4]);
  const markX = useTransform(smoothX, [-0.5, 0.5], [-12, 12]);
  const authorX = useTransform(smoothX, [-0.5, 0.5], [-3, 3]);

  return (
    <motion.blockquote
      key={animationKey}
      className={`quote-card animation-${animation}`}
      style={reduceMotion ? undefined : { rotateX, rotateY, transformPerspective: 1100 }}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: animation === "slide" ? 28 : -12, scale: animation === "stamp" ? 1.055 : 0.985, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      transition={{ type: "spring", stiffness: 190, damping: 20, mass: 0.75 }}
      onPointerMove={(event) => {
        if (reduceMotion || event.pointerType === "touch") return;
        const rect = event.currentTarget.getBoundingClientRect();
        pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
        pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
      }}
      onPointerLeave={() => { pointerX.set(0); pointerY.set(0); }}
    >
      <motion.span className="quote-mark" aria-hidden="true" style={reduceMotion ? undefined : { x: markX }}>“</motion.span>
      <motion.p className="quote-text" style={reduceMotion ? undefined : { x: textX, y: textY }}>{quote?.text ?? "Fetching today’s quote…"}</motion.p>
      <motion.footer className="quote-author" style={reduceMotion ? undefined : { x: authorX }}>
        <span aria-hidden="true" />
        <cite>{quote?.author ?? ""}</cite>
      </motion.footer>
    </motion.blockquote>
  );
}
