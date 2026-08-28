"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";

interface QuoteActionsProps {
  isLoading: boolean; isRandom: boolean; meaningOpen: boolean;
  onAnother: () => void; onToday: () => void; onCopy: () => void; onMeaning: () => void; onExport: () => void;
}

export function QuoteActions(props: QuoteActionsProps) {
  const [copied, setCopied] = useState(false);
  return (
    <motion.div className="quote-actions" initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: .055, delayChildren: .12 } } }}>
      <MagneticButton tone="primary" icon={<ShuffleIcon spinning={props.isLoading} />} disabled={props.isLoading} onClick={props.onAnother}>{props.isLoading ? "Finding one…" : "Another quote"}</MagneticButton>
      <MagneticButton tone="glass" icon={<SparkIcon />} active={props.meaningOpen} ariaExpanded={props.meaningOpen} controls="meaning-panel" onClick={props.onMeaning}>{props.meaningOpen ? "Hide meaning" : "Understand"}</MagneticButton>
      <AnimatePresence>{props.isRandom ? <MagneticButton tone="glass" icon={<ReturnIcon />} onClick={props.onToday}>Today’s quote</MagneticButton> : null}</AnimatePresence>
      <MagneticButton tone="quiet" icon={copied ? <CheckIcon /> : <CopyIcon />} active={copied} onClick={() => { props.onCopy(); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }}>{copied ? "Copied" : "Copy"}</MagneticButton>
      <MagneticButton tone="quiet" icon={<DownloadIcon />} onClick={props.onExport}>Download HD</MagneticButton>
    </motion.div>
  );
}

function MagneticButton({ children, icon, tone, disabled, active, ariaExpanded, controls, onClick }: { children: ReactNode; icon: ReactNode; tone: "primary" | "glass" | "quiet"; disabled?: boolean; active?: boolean; ariaExpanded?: boolean; controls?: string; onClick: () => void }) {
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0); const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 520, damping: 32, mass: .35 });
  const springY = useSpring(y, { stiffness: 520, damping: 32, mass: .35 });
  return (
    <motion.button
      className={`action-button action-${tone}${active ? " is-active" : ""}`}
      style={reduceMotion ? undefined : { x: springX, y: springY }}
      variants={{ hidden: { opacity: 0, y: 15, scale: .9 }, visible: { opacity: 1, y: 0, scale: 1 } }}
      initial={false}
      exit={{ opacity: 0, scale: .82, width: 0, paddingLeft: 0, paddingRight: 0 }}
      whileHover={reduceMotion ? undefined : { scale: 1.065, y: -5 }}
      whileTap={{ scale: .92, y: 1 }}
      transition={{ type: "spring", stiffness: 440, damping: 24 }}
      disabled={disabled} aria-expanded={ariaExpanded} aria-controls={controls} onClick={onClick}
      onPointerMove={(event) => {
        if (reduceMotion || event.pointerType === "touch") return;
        const rect = event.currentTarget.getBoundingClientRect();
        x.set((event.clientX - rect.left - rect.width / 2) * .12); y.set((event.clientY - rect.top - rect.height / 2) * .16);
        event.currentTarget.style.setProperty("--spot-x", `${event.clientX - rect.left}px`); event.currentTarget.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
      }}
      onPointerLeave={() => { x.set(0); y.set(0); }}
    >
      <span className="action-glow" />
      <span className="action-icon" aria-hidden="true">{icon}</span>
      <span className="action-label">{children}</span>
      {tone === "primary" ? <motion.span className="action-arrow" aria-hidden="true" animate={{ x: [0, 3, 0] }} transition={{ duration: 1.8, repeat: Infinity }}>↗</motion.span> : null}
    </motion.button>
  );
}

const Icon = ({ children, className = "" }: { children: ReactNode; className?: string }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</svg>;
function ShuffleIcon({ spinning }: { spinning: boolean }) { return <Icon className={spinning ? "is-spinning" : ""}><path d="M16 3h5v5"/><path d="m21 3-6.5 6.5a4 4 0 0 1-5.7 0L3 3.7"/><path d="M16 21h5v-5"/><path d="m21 21-6.5-6.5a4 4 0 0 0-5.7 0L3 20.3"/></Icon>; }
function SparkIcon() { return <Icon><path d="m12 3 1.3 4.1a5.6 5.6 0 0 0 3.6 3.6L21 12l-4.1 1.3a5.6 5.6 0 0 0-3.6 3.6L12 21l-1.3-4.1a5.6 5.6 0 0 0-3.6-3.6L3 12l4.1-1.3a5.6 5.6 0 0 0 3.6-3.6L12 3Z"/></Icon>; }
function ReturnIcon() { return <Icon><path d="m9 14-4-4 4-4"/><path d="M5 10h9a5 5 0 0 1 5 5v2"/></Icon>; }
function CopyIcon() { return <Icon><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></Icon>; }
function CheckIcon() { return <Icon><path d="m5 12 4 4L19 6"/></Icon>; }
function DownloadIcon() { return <Icon><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></Icon>; }
