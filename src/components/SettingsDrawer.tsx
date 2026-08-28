"use client";

import { AnimatePresence, motion } from "motion/react";
import { ThemePicker } from "@/components/ThemePicker";
import type { AppearanceSettings, EntranceAnimation, FontPairing, ThemeName } from "@/types/quote";

interface SettingsDrawerProps {
  open: boolean;
  settings: AppearanceSettings;
  onClose: () => void;
  onChange: (settings: AppearanceSettings) => void;
  onReset: () => void;
}

const fontOptions: { value: FontPairing; label: string }[] = [
  { value: "inkpaper", label: "Literary + Inter" },
  { value: "broadsheet", label: "Broadsheet + Inter" },
  { value: "typewriter", label: "Typewriter + Inter" },
  { value: "readingroom", label: "Reading room + Inter" },
  { value: "editorial", label: "Editorial + Inter" },
  { value: "modernist", label: "Modernist + Inter" },
];

const animations: { value: EntranceAnimation; label: string }[] = [
  { value: "stamp", label: "Stamp press" },
  { value: "fade", label: "Soft fade" },
  { value: "slide", label: "Slide up" },
  { value: "typewriter", label: "Typewriter" },
];

export function SettingsDrawer({ open, settings, onClose, onChange, onReset }: SettingsDrawerProps) {
  const update = <K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) =>
    onChange({ ...settings, [key]: value });

  return (
    <AnimatePresence>
      {open ? <>
      <motion.button className="drawer-backdrop is-open" aria-label="Close appearance settings" tabIndex={0} onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <motion.aside className="settings-drawer is-open" aria-label="Appearance settings" aria-hidden={false} initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 260, damping: 30 }}>
        <header>
          <div><p>Make it yours</p><h2>Appearance</h2></div>
          <button className="btn btn-circle btn-ghost" aria-label="Close appearance settings" onClick={onClose}>×</button>
        </header>

        <motion.div className="settings-content" initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.045 } } }}>
          <motion.div variants={drawerItem}><ThemePicker value={settings.theme} onChange={(value: ThemeName) => update("theme", value)} /></motion.div>

          <motion.label variants={drawerItem} className="setting-field">
            <span className="setting-label">Accent color</span>
            <span className="color-control">
              <input type="color" value={settings.accent || "#b08d57"} onChange={(event) => update("accent", event.target.value)} />
              <output>{(settings.accent || "Theme default").toUpperCase()}</output>
            </span>
          </motion.label>

          <motion.label variants={drawerItem} className="setting-field">
            <span className="setting-label">Typeface pairing</span>
            <select className="select w-full" value={settings.fonts} onChange={(event) => update("fonts", event.target.value as FontPairing)}>
              {fontOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </motion.label>

          <motion.fieldset variants={drawerItem}>
            <legend className="setting-label">Entrance animation</legend>
            <div className="animation-grid">
              {animations.map((animation) => (
                <button key={animation.value} type="button" className="btn btn-sm" aria-pressed={settings.animation === animation.value} onClick={() => update("animation", animation.value)}>
                  {animation.label}
                </button>
              ))}
            </div>
          </motion.fieldset>

          <motion.div variants={drawerItem}><RangeField label="Quote text size" value={settings.quoteSize} min={18} max={34} suffix="px" onChange={(value) => update("quoteSize", value)} /></motion.div>
          <motion.div variants={drawerItem} className="atmosphere-group">
            <p className="setting-label">Background atmosphere</p>
            <RangeField label="Intensity" value={settings.atmosphere} min={30} max={140} onChange={(value) => update("atmosphere", value)} />
            <RangeField label="Motion" value={settings.motion} min={0} max={140} onChange={(value) => update("motion", value)} />
            <RangeField label="Grain" value={settings.grain} min={0} max={160} onChange={(value) => update("grain", value)} />
          </motion.div>

          <motion.button variants={drawerItem} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn reset-button" onClick={onReset}>Reset to default appearance</motion.button>
        </motion.div>
      </motion.aside>
      </> : null}
    </AnimatePresence>
  );
}

const drawerItem = { hidden: { opacity: 0, x: 18 }, visible: { opacity: 1, x: 0, transition: { duration: 0.28 } } };

function RangeField({ label, value, min, max, suffix = "", onChange }: { label: string; value: number; min: number; max: number; suffix?: string; onChange: (value: number) => void }) {
  return (
    <label className="range-field">
      <span>{label}<output>{value}{suffix}</output></span>
      <input className="range range-xs" type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}
