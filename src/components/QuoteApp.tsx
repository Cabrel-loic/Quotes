"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MotionConfig, motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { ExportPanel } from "@/components/ExportPanel";
import { MeaningPanel } from "@/components/MeaningPanel";
import { MotionBackground, type MotionBackgroundHandle } from "@/components/MotionBackground";
import { QuoteActions } from "@/components/QuoteActions";
import { QuoteCard } from "@/components/QuoteCard";
import { SettingsDrawer } from "@/components/SettingsDrawer";
import { getDateChrome, todayKey } from "@/lib/date";
import { buildMeaning } from "@/lib/meaning";
import { fetchDailyQuote, fetchRandomQuote } from "@/lib/quotes";
import { readStorage, writeStorage } from "@/lib/storage";
import type { AppearanceSettings, Quote, QuoteMeaning } from "@/types/quote";

const APPEARANCE_STORAGE_KEY = "appearance-settings:v2";
const defaultSettings: AppearanceSettings = { theme: "harbor", accent: "", fonts: "inkpaper", animation: "stamp", backgroundAnimation: "harbor", quoteSize: 24, atmosphere: 115, motion: 100, grain: 100 };

export function QuoteApp() {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [dailyQuote, setDailyQuote] = useState<Quote | null>(null);
  const [settings, setSettings] = useState(defaultSettings);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [capturedBackground, setCapturedBackground] = useState<string | null>(null);
  const backgroundRef = useRef<MotionBackgroundHandle>(null);
  const [meaningOpen, setMeaningOpen] = useState(false);
  const [aiMeaning, setAiMeaning] = useState<QuoteMeaning | null>(null);
  const [meaningLoading, setMeaningLoading] = useState(false);
  const [meaningSource, setMeaningSource] = useState<"groq" | "cache" | "local">("local");
  const [isRandom, setIsRandom] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [animationKey, setAnimationKey] = useState(0);
  const dateChrome = useMemo(() => getDateChrome(), []);
  const localMeaning = useMemo(() => buildMeaning(quote ?? { text: "", author: "", source: "offline" }), [quote]);
  const meaning = aiMeaning ?? localMeaning;
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const smoothScroll = useSpring(scrollYProgress, { stiffness: 120, damping: 25 });
  const stageY = useTransform(smoothScroll, [0, 1], [0, -34]);
  const stageScale = useTransform(smoothScroll, [0, 1], [1, 0.975]);

  useEffect(() => {
    const saved = readStorage<Partial<AppearanceSettings>>(APPEARANCE_STORAGE_KEY);
    const key = `daily-quote:${todayKey()}`;
    const cached = readStorage<Quote>(key);
    if (saved || cached) queueMicrotask(() => {
      if (saved) setSettings({ ...defaultSettings, ...saved });
      if (cached) { setDailyQuote(cached); setQuote(cached); }
    });
    if (cached) return;
    void fetchDailyQuote().then((result) => {
      setDailyQuote(result); setQuote(result); writeStorage(key, result);
      if (result.source === "offline") setStatus("Showing an offline quote — network unavailable.");
    });
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = settings.theme; root.dataset.fonts = settings.fonts;
    root.style.setProperty("--quote-size", `${settings.quoteSize}px`);
    root.style.setProperty("--atmosphere", String(settings.atmosphere / 100));
    root.style.setProperty("--motion", String(settings.motion / 100)); root.style.setProperty("--grain", String(settings.grain / 100));
    if (settings.accent) root.style.setProperty("--accent", settings.accent);
    else root.style.removeProperty("--accent");
    writeStorage(APPEARANCE_STORAGE_KEY, settings);
  }, [settings]);

  useEffect(() => {
    if (!drawerOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [drawerOpen]);

  function showQuote(nextQuote: Quote) { setQuote(nextQuote); setMeaningOpen(false); setAiMeaning(null); setMeaningSource("local"); setAnimationKey((key) => key + 1); }
  async function handleAnother() {
    setIsLoading(true); setStatus("Fetching another quote…");
    const nextQuote = await fetchRandomQuote(); showQuote(nextQuote); setIsRandom(true); setIsLoading(false);
    setStatus(nextQuote.source === "offline" ? "Showing an offline quote — network unavailable." : "");
  }
  function handleToday() { if (dailyQuote) showQuote(dailyQuote); setIsRandom(false); setStatus(""); }
  async function handleCopy() {
    if (!quote) return;
    try { await navigator.clipboard.writeText(`“${quote.text}” — ${quote.author}`); setStatus("Copied to clipboard."); }
    catch { setStatus("Could not copy — select the text manually."); }
  }
  async function handleMeaning() {
    if (meaningOpen) { setMeaningOpen(false); setStatus(""); return; }
    if (!quote) return;
    setMeaningOpen(true);
    const cacheKey = meaningCacheKey(quote);
    const cached = readStorage<QuoteMeaning>(cacheKey);
    if (cached) {
      setAiMeaning(cached); setMeaningSource("cache"); setStatus("AI interpretation restored from this browser.");
      return;
    }

    setMeaningLoading(true); setStatus("Reflecting on this quote…");
    try {
      const response = await fetch("/api/meaning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quote: quote.text, author: quote.author }),
      });
      if (!response.ok) throw new Error("AI interpretation unavailable");
      const payload = (await response.json()) as { meaning?: QuoteMeaning };
      if (!isQuoteMeaning(payload.meaning)) throw new Error("Invalid AI interpretation");
      setAiMeaning(payload.meaning); setMeaningSource("groq"); writeStorage(cacheKey, payload.meaning);
      setStatus("AI interpretation generated by Groq.");
    } catch {
      setAiMeaning(null); setMeaningSource("local");
      setStatus("Using Daybook’s offline interpretation.");
    } finally {
      setMeaningLoading(false);
    }
  }
  function updateSettings(next: AppearanceSettings) { setSettings(next); if (next.animation !== settings.animation) setAnimationKey((key) => key + 1); }
  function openExport() {
    setCapturedBackground(backgroundRef.current?.capture() ?? null);
    setExportOpen(true);
  }

  return (
    <MotionConfig reducedMotion="user" transition={{ type: "spring", stiffness: 280, damping: 25 }}>
    <div className="daybook-shell" data-rendered="true">
      <div className="ambient-background" aria-hidden="true">
        <MotionBackground ref={backgroundRef} animation={settings.backgroundAnimation} />
        <span className="ambient-orb orb-one" /><span className="ambient-orb orb-two" /><span className="ambient-orb orb-three" />
        <span className="ambient-line line-one" /><span className="ambient-line line-two" /><span className="ambient-grain" />
      </div>
      <motion.button whileHover={{ rotate: 45, scale: 1.1 }} whileTap={{ scale: 0.9 }} className="settings-toggle btn btn-circle" aria-label="Open appearance settings" aria-expanded={drawerOpen} onClick={() => setDrawerOpen(true)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5v.2a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1A2 2 0 1 1 4.3 17l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3 1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 1 1 19.7 7l-.1.1a1.7 1.7 0 0 0-.3 1.8 1.7 1.7 0 0 0 1.5 1h.2a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1.1Z" /></svg>
      </motion.button>
      <motion.section className="quote-stage" style={reduceMotion ? undefined : { y: stageY, scale: stageScale }}>
        <header className="date-row"><span>{dateChrome.stamp}</span><span>{dateChrome.badge}</span></header>
        <QuoteCard quote={quote} animation={settings.animation} animationKey={animationKey} />
        <QuoteActions isLoading={isLoading} isRandom={isRandom} meaningOpen={meaningOpen} onAnother={handleAnother} onToday={handleToday} onCopy={handleCopy} onExport={openExport} onMeaning={handleMeaning} />
        <MeaningPanel meaning={meaning} open={meaningOpen} loading={meaningLoading} source={meaningSource} />
        <p className="status-message" role="status" aria-live="polite">{status}</p>
      </motion.section>
      <SettingsDrawer open={drawerOpen} settings={settings} onClose={() => setDrawerOpen(false)} onChange={updateSettings} onReset={() => { setSettings(defaultSettings); setStatus("Appearance reset to default."); }} />
      <ExportPanel open={exportOpen} quote={quote} settings={settings} capturedBackground={capturedBackground} onClose={() => setExportOpen(false)} />
    </div>
    </MotionConfig>
  );
}

function meaningCacheKey(quote: Quote) {
  const input = `${quote.author}\u0000${quote.text}`.toLowerCase();
  let hash = 2166136261;
  for (let index = 0; index < input.length; index++) hash = Math.imul(hash ^ input.charCodeAt(index), 16777619);
  return `ai-meaning:v1:${(hash >>> 0).toString(36)}`;
}

function isQuoteMeaning(value: unknown): value is QuoteMeaning {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return ["title", "simple", "deeper", "reflection"].every((field) => typeof candidate[field] === "string" && Boolean(candidate[field]));
}
