"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState, type ReactNode } from "react";

type Props = {
  isLoading: boolean; isRandom: boolean; meaningOpen: boolean;
  onAnother: () => void; onToday: () => void; onCopy: () => Promise<boolean>;
  onMeaning: () => void; onExport: () => void; onSettings: () => void;
};

export function QuoteActions(props: Props) {
  const [copied, setCopied] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const copy = async () => {
    if (!await props.onCopy()) return;
    setCopied(true); window.setTimeout(() => setCopied(false), 1800);
  };
  return (
    <motion.nav className="quote-action-bar" aria-label="Quote actions" initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.045, delayChildren: 0.2 } } }}>
      <ActionButton primary icon={<ShuffleIcon spinning={props.isLoading} />} disabled={props.isLoading} onClick={props.onAnother}>{props.isLoading ? "Finding…" : "Another quote"}</ActionButton>
      <ActionButton icon={<SparkIcon />} active={props.meaningOpen} expanded={props.meaningOpen} controls="meaning-section" onClick={props.onMeaning}>{props.meaningOpen ? "Close meaning" : "Meaning"}</ActionButton>
      {props.isRandom ? <ActionButton className="hidden sm:inline-flex" icon={<ReturnIcon />} onClick={props.onToday}>Today</ActionButton> : null}
      <ActionButton icon={copied ? <CheckIcon /> : <CopyIcon />} active={copied} onClick={copy}>{copied ? "Copied" : "Copy"}</ActionButton>
      <ActionButton className="hidden sm:inline-flex" icon={<DownloadIcon />} onClick={props.onExport}>Export</ActionButton>
      <div className="relative sm:hidden">
        <ActionButton icon={<MoreIcon />} expanded={moreOpen} controls="mobile-more-menu" label="More actions" onClick={() => setMoreOpen((value) => !value)}>More</ActionButton>
        <AnimatePresence>{moreOpen ? <motion.div id="mobile-more-menu" className="mobile-more-menu" initial={{ opacity: 0, y: 8, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 5 }}>
          {props.isRandom ? <button onClick={() => { props.onToday(); setMoreOpen(false); }}><ReturnIcon /> Today’s quote</button> : null}
          <button onClick={() => { props.onExport(); setMoreOpen(false); }}><DownloadIcon /> Download HD</button>
          <button onClick={() => { props.onSettings(); setMoreOpen(false); }}><SettingsIcon /> Appearance</button>
        </motion.div> : null}</AnimatePresence>
      </div>
    </motion.nav>
  );
}

function ActionButton({ children, icon, primary, active, className = "", label, ...props }: { children: ReactNode; icon: ReactNode; primary?: boolean; active?: boolean; className?: string; label?: string; disabled?: boolean; expanded?: boolean; controls?: string; onClick: () => void }) {
  const reduceMotion = useReducedMotion();
  return <motion.button
    className={`daybook-action ${primary ? "daybook-action-primary" : ""} ${active ? "is-active" : ""} ${className}`}
    aria-label={label} aria-expanded={props.expanded} aria-controls={props.controls} disabled={props.disabled} onClick={props.onClick}
    variants={{ hidden: { opacity: 0, y: 9 }, visible: { opacity: 1, y: 0 } }}
    whileHover={reduceMotion ? undefined : { y: -2, scale: 1.02 }} whileTap={{ scale: .98 }}
  ><span aria-hidden="true" className="action-svg">{icon}</span><span>{children}</span></motion.button>;
}

const Icon = ({ children, className = "" }: { children: ReactNode; className?: string }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</svg>;
function ShuffleIcon({ spinning }: { spinning: boolean }) { return <Icon className={spinning ? "is-spinning" : ""}><path d="M16 3h5v5"/><path d="m21 3-6.5 6.5a4 4 0 0 1-5.7 0L3 3.7"/><path d="M16 21h5v-5"/><path d="m21 21-6.5-6.5a4 4 0 0 0-5.7 0L3 20.3"/></Icon>; }
function SparkIcon() { return <Icon><path d="m12 3 1.3 4.1a5.6 5.6 0 0 0 3.6 3.6L21 12l-4.1 1.3a5.6 5.6 0 0 0-3.6 3.6L12 21l-1.3-4.1a5.6 5.6 0 0 0-3.6-3.6L3 12l4.1-1.3a5.6 5.6 0 0 0 3.6-3.6L12 3Z"/></Icon>; }
function ReturnIcon() { return <Icon><path d="m9 14-4-4 4-4"/><path d="M5 10h9a5 5 0 0 1 5 5v2"/></Icon>; }
function CopyIcon() { return <Icon><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></Icon>; }
function CheckIcon() { return <Icon><path d="m5 12 4 4L19 6"/></Icon>; }
function DownloadIcon() { return <Icon><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></Icon>; }
function MoreIcon() { return <Icon><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></Icon>; }
function SettingsIcon() { return <Icon><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1A7 7 0 0 0 15 6l-.4-2.6h-4L10 6a7 7 0 0 0-1.5 1.1l-2.4-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1A7 7 0 0 0 10 18l.5 2.6h4L15 18a7 7 0 0 0 1.5-1.1l2.4 1 2-3.4-2-1.5a7 7 0 0 0 .1-1Z"/></Icon>; }
