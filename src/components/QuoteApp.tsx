"use client";

import { AnimatePresence, MotionConfig, motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SceneCanvas } from "@/components/backgrounds/SceneCanvas";
import { ExportPanel } from "@/components/ExportPanel";
import { EditorialLayout } from "@/components/layouts/EditorialLayout";
import { ImmersiveLayout } from "@/components/layouts/ImmersiveLayout";
import type { MotionBackgroundHandle } from "@/components/MotionBackground";
import { MeaningExperience } from "@/components/quote/MeaningExperience";
import { QuoteActions } from "@/components/quote/QuoteActions";
import { QuoteLoading } from "@/components/quote/QuoteLoading";
import { SettingsDrawer } from "@/components/settings/SettingsDrawer";
import { usePreferences } from "@/hooks/usePreferences";
import { getDateChrome, todayKey } from "@/lib/date";
import { buildMeaning } from "@/lib/meaning";
import { fetchDailyQuote, fetchRandomQuote } from "@/lib/quotes";
import { readStorage, writeStorage } from "@/lib/storage";
import type { Quote, QuoteMeaning } from "@/types/quote";

export function QuoteApp() {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [dailyQuote, setDailyQuote] = useState<Quote | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [capturedBackground, setCapturedBackground] = useState<string | null>(null);
  const [meaningOpen, setMeaningOpen] = useState(false);
  const [aiMeaning, setAiMeaning] = useState<QuoteMeaning | null>(null);
  const [meaningLoading, setMeaningLoading] = useState(false);
  const [meaningSource, setMeaningSource] = useState<"groq" | "cache" | "local">("local");
  const [isRandom, setIsRandom] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [transitionKey, setTransitionKey] = useState(0);
  const backgroundRef = useRef<MotionBackgroundHandle>(null);
  const settingsTriggerRef = useRef<HTMLButtonElement>(null);
  const { preferences, setPreferences, resetPreferences } = usePreferences();
  const date = useMemo(() => getDateChrome(), []);
  const localMeaning = useMemo(() => buildMeaning(quote ?? { text: "", author: "", source: "offline" }), [quote]);
  const meaning = aiMeaning ?? localMeaning;
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const smoothScroll = useSpring(scrollYProgress, { stiffness: 90, damping: 28 });
  const heroY = useTransform(smoothScroll, [0, .65], [0, -42]);
  const heroOpacity = useTransform(smoothScroll, [0, .55], [1, .42]);
  const dateY = useTransform(smoothScroll, [0, .7], [0, -90]);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);
  const closeExport = useCallback(() => setExportOpen(false), []);

  useEffect(() => {
    const key = `daily-quote:${todayKey()}`;
    const cached = readStorage<Quote>(key);
    if (cached) { queueMicrotask(() => { setDailyQuote(cached); setQuote(cached); }); return; }
    void fetchDailyQuote().then((result) => {
      setDailyQuote(result); setQuote(result); writeStorage(key, result);
      if (result.source === "offline") setStatus("Offline edition · showing a saved Daybook quote");
    });
  }, []);

  function showQuote(nextQuote: Quote) { setQuote(nextQuote); setMeaningOpen(false); setAiMeaning(null); setMeaningSource("local"); setTransitionKey((key) => key + 1); }
  async function handleAnother() {
    if (isLoading) return;
    setIsLoading(true); setStatus("Finding a thought for this moment…");
    const nextQuote = await fetchRandomQuote(); showQuote(nextQuote); setIsRandom(true); setIsLoading(false);
    setStatus(nextQuote.source === "offline" ? "Offline edition · showing a saved Daybook quote" : "");
  }
  function handleToday() { if (dailyQuote) showQuote(dailyQuote); setIsRandom(false); setStatus(""); }
  async function handleCopy() {
    if (!quote) return false;
    try { await navigator.clipboard.writeText(`“${quote.text}” — ${quote.author}`); setStatus("Quote copied to clipboard."); return true; }
    catch { setStatus("Copy was blocked. You can select the quote manually."); return false; }
  }
  async function handleMeaning() {
    if (meaningOpen) { setMeaningOpen(false); setStatus(""); window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }); return; }
    if (!quote) return;
    setMeaningOpen(true);
    const cacheKey = meaningCacheKey(quote);
    const cached = readStorage<QuoteMeaning>(cacheKey);
    if (cached) { setAiMeaning(cached); setMeaningSource("cache"); setStatus("A saved interpretation from this browser."); return; }
    setMeaningLoading(true); setStatus("Reading between the lines…");
    try {
      const response = await fetch("/api/meaning", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quote: quote.text, author: quote.author }) });
      if (!response.ok) throw new Error("Interpretation unavailable");
      const payload = (await response.json()) as { meaning?: QuoteMeaning };
      if (!isQuoteMeaning(payload.meaning)) throw new Error("Invalid interpretation");
      setAiMeaning(payload.meaning); setMeaningSource("groq"); writeStorage(cacheKey, payload.meaning); setStatus("A fresh Daybook interpretation.");
    } catch { setAiMeaning(null); setMeaningSource("local"); setStatus("A quiet offline interpretation."); }
    finally { setMeaningLoading(false); }
  }
  function openExport() { setCapturedBackground(backgroundRef.current?.capture() ?? null); setExportOpen(true); }

  return <MotionConfig reducedMotion="user" transition={{ duration: .42, ease: [0.22, 1, 0.36, 1] }}>
    <main className="daybook-experience min-h-dvh overflow-x-clip">
      <SceneCanvas ref={backgroundRef} preferences={preferences} />
      <motion.div className="decorative-date" aria-hidden="true" style={reduceMotion ? undefined : { y: dateY }}>{String(new Date().getDate()).padStart(2, "0")}</motion.div>
      <header className="daybook-header">
        <a className="wordmark" href="#quote-hero" aria-label="Daybook home"><span>D</span><strong>DAYBOOK</strong></a>
        <p className="day-meta"><span>{date.stamp}</span><i />{date.badge}</p>
        <button ref={settingsTriggerRef} className="icon-button settings-trigger" aria-label="Open appearance settings" aria-expanded={settingsOpen} onClick={() => setSettingsOpen(true)}><SettingsIcon /></button>
      </header>
      <motion.section id="quote-hero" className="quote-hero relative z-10 flex min-h-dvh flex-col px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-28 sm:px-8 lg:pt-32" style={reduceMotion ? undefined : { y: heroY, opacity: heroOpacity }}>
        <div className="m-auto flex w-full max-w-[76rem] flex-col">
          <AnimatePresence mode="wait">{quote ? preferences.layout === "editorial" ? <EditorialLayout quote={quote} animation={preferences.animation} transitionKey={transitionKey} /> : <ImmersiveLayout quote={quote} animation={preferences.animation} transitionKey={transitionKey} /> : <QuoteLoading />}</AnimatePresence>
          <div className="flex flex-col items-center">
            <QuoteActions isLoading={isLoading} isRandom={isRandom} meaningOpen={meaningOpen} onAnother={handleAnother} onToday={handleToday} onCopy={handleCopy} onMeaning={handleMeaning} onExport={openExport} onSettings={() => setSettingsOpen(true)} />
            <p className="status-line" role="status" aria-live="polite">{status}</p>
          </div>
        </div>
        <button className="scroll-cue" onClick={() => document.getElementById("meaning-section")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" })} aria-label={meaningOpen ? "Scroll to interpretation" : "Open the meaning to continue"} disabled={!meaningOpen}><span>Reflect</span><i /></button>
      </motion.section>
      <MeaningExperience meaning={meaning} open={meaningOpen} loading={meaningLoading} source={meaningSource} />
      <SettingsDrawer open={settingsOpen} preferences={preferences} onClose={closeSettings} onChange={setPreferences} onReset={() => { resetPreferences(); setStatus("Daybook appearance reset."); }} triggerRef={settingsTriggerRef} />
      <ExportPanel open={exportOpen} quote={quote} settings={preferences} capturedBackground={capturedBackground} onClose={closeExport} />
    </main>
  </MotionConfig>;
}

function SettingsIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1A7 7 0 0 0 15 6l-.4-2.6h-4L10 6a7 7 0 0 0-1.5 1.1l-2.4-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1A7 7 0 0 0 10 18l.5 2.6h4L15 18a7 7 0 0 0 1.5-1.1l2.4 1 2-3.4-2-1.5a7 7 0 0 0 .1-1Z"/></svg>; }
function meaningCacheKey(quote: Quote) { const input = `${quote.author}\u0000${quote.text}`.toLowerCase(); let hash = 2166136261; for (let index = 0; index < input.length; index++) hash = Math.imul(hash ^ input.charCodeAt(index), 16777619); return `ai-meaning:v1:${(hash >>> 0).toString(36)}`; }
function isQuoteMeaning(value: unknown): value is QuoteMeaning { if (!value || typeof value !== "object") return false; const candidate = value as Record<string, unknown>; return ["title", "simple", "deeper", "reflection"].every((field) => typeof candidate[field] === "string" && Boolean(candidate[field])); }
