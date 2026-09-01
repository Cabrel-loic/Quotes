"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRef } from "react";
import { useDialog } from "@/hooks/useDialog";
import type { BackgroundAnimation, DaybookPreferences, EntranceAnimation, FontPairing, GraphicsQuality, QuoteLayout, ThemeName } from "@/types/quote";

type Props = { open: boolean; preferences: DaybookPreferences; onClose: () => void; onChange: (value: DaybookPreferences) => void; onReset: () => void; triggerRef: React.RefObject<HTMLButtonElement | null> };

const themes: Array<{ value: ThemeName; label: string; colors: string }> = [
  { value: "ink", label: "Ink", colors: "#14231c,#b08d57,#f6f1e4" }, { value: "daylight", label: "Daylight", colors: "#eadfc8,#8c4a32,#fffdf8" },
  { value: "midnight", label: "Midnight", colors: "#090d16,#7fa8c9,#1d2230" }, { value: "meadow", label: "Meadow", colors: "#b9c8ad,#c99a3c,#f5f3ec" },
  { value: "rosewood", label: "Rosewood", colors: "#28121d,#d88967,#fff4f0" }, { value: "harbor", label: "Harbor", colors: "#0e2934,#e0b94b,#f2f7f4" },
  { value: "graphite", label: "Graphite", colors: "#17181a,#c37a49,#f4f1ea" }, { value: "skyline", label: "Skyline", colors: "#b9cedc,#4f8e80,#fff" },
];
const scenes: Array<{ value: BackgroundAnimation; label: string; description: string }> = [
  { value: "harbor", label: "Harbor", description: "Tidal light" }, { value: "aurora", label: "Aurora", description: "Drifting veils" },
  { value: "topography", label: "Topography", description: "Living contours" }, { value: "constellation", label: "Constellation", description: "Quiet orbit" },
  { value: "embers", label: "Embers", description: "Warm ascent" },
];
const fonts: Array<{ value: FontPairing; label: string }> = [
  { value: "inkpaper", label: "Literary" }, { value: "broadsheet", label: "Broadsheet" }, { value: "typewriter", label: "Typewriter" },
  { value: "readingroom", label: "Reading room" }, { value: "editorial", label: "Editorial" }, { value: "modernist", label: "Modernist" },
];

export function SettingsDrawer({ open, preferences, onClose, onChange, onReset, triggerRef }: Props) {
  const panelRef = useRef<HTMLElement>(null);
  useDialog(open, panelRef, onClose, triggerRef);
  const update = <K extends keyof DaybookPreferences>(key: K, value: DaybookPreferences[K]) => onChange({ ...preferences, [key]: value });
  return <AnimatePresence>{open ? <>
    <motion.button className="dialog-backdrop" aria-label="Close appearance settings" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
    <motion.aside ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="settings-title" className="settings-surface" initial={{ x: "100%", y: 0 }} animate={{ x: 0, y: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 280, damping: 31 }}>
      <div className="sheet-handle" aria-hidden="true" />
      <header className="settings-header"><div><p>Shape the atmosphere</p><h2 id="settings-title">Appearance</h2></div><button className="icon-button" aria-label="Close appearance settings" onClick={onClose}>×</button></header>
      <div className="settings-scroll">
        <SettingsSection number="01" title="Style">
          <ControlLabel>Layout</ControlLabel><div className="layout-selector">
            <PreviewButton active={preferences.layout === "immersive"} onClick={() => update("layout", "immersive" as QuoteLayout)} label="Immersive"><span className="layout-preview immersive-preview"><i/><i/><i/></span></PreviewButton>
            <PreviewButton active={preferences.layout === "editorial"} onClick={() => update("layout", "editorial" as QuoteLayout)} label="Editorial"><span className="layout-preview editorial-preview"><i/><i/><i/></span></PreviewButton>
          </div>
          <ControlLabel>Palette</ControlLabel><div className="palette-grid">{themes.map((theme) => <button key={theme.value} className="palette-option" aria-label={`${theme.label} theme`} aria-pressed={preferences.theme === theme.value} onClick={() => update("theme", theme.value)}><span>{theme.colors.split(",").map((color) => <i key={color} style={{ background: color }} />)}</span><small>{theme.label}</small></button>)}</div>
          <div className="control-grid"><label><ControlLabel>Accent</ControlLabel><span className="color-input"><input type="color" value={preferences.accent || "#e0b94b"} onChange={(event) => update("accent", event.target.value)} /><output>{preferences.accent || "Theme default"}</output></span></label>
          <label><ControlLabel>Typography</ControlLabel><select value={preferences.fonts} onChange={(event) => update("fonts", event.target.value as FontPairing)}>{fonts.map((font) => <option value={font.value} key={font.value}>{font.label}</option>)}</select></label></div>
          <Range label="Quote scale" value={preferences.quoteSize} min={18} max={34} suffix="px" onChange={(value) => update("quoteSize", value)} />
        </SettingsSection>
        <SettingsSection number="02" title="Atmosphere">
          <ControlLabel>Environment</ControlLabel><div className="scene-grid">{scenes.map((scene) => <PreviewButton key={scene.value} active={preferences.backgroundAnimation === scene.value} onClick={() => update("backgroundAnimation", scene.value)} label={scene.label} description={scene.description}><span className={`scene-preview scene-${scene.value}`}><i/><i/><i/></span></PreviewButton>)}</div>
          <Range label="Intensity" value={preferences.atmosphere} min={30} max={120} onChange={(value) => update("atmosphere", value)} />
          <Range label="Motion" value={preferences.motion} min={0} max={100} onChange={(value) => update("motion", value)} />
          <Range label="Texture" value={preferences.grain} min={0} max={120} onChange={(value) => update("grain", value)} />
          <Toggle label="Background interaction" description="Let the atmosphere respond gently to pointer and touch." checked={preferences.backgroundInteraction} onChange={(value) => update("backgroundInteraction", value)} />
          <label><ControlLabel>Graphics quality</ControlLabel><select value={preferences.graphicsQuality} onChange={(event) => update("graphicsQuality", event.target.value as GraphicsQuality)}><option value="auto">Auto</option><option value="balanced">Balanced</option><option value="battery">Battery saver</option></select></label>
        </SettingsSection>
        <SettingsSection number="03" title="Behaviour">
          <ControlLabel>Quote reveal</ControlLabel><div className="segmented-control">{(["stamp", "fade", "slide", "typewriter"] as EntranceAnimation[]).map((value) => <button key={value} aria-pressed={preferences.animation === value} onClick={() => update("animation", value)}>{value === "typewriter" ? "Word flow" : value}</button>)}</div>
          <button className="reset-control" onClick={onReset}>Reset Daybook appearance</button>
        </SettingsSection>
      </div>
    </motion.aside>
  </> : null}</AnimatePresence>;
}

function SettingsSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) { return <section className="settings-section"><header><span>{number}</span><h3>{title}</h3></header><div className="settings-section-body">{children}</div></section>; }
function ControlLabel({ children }: { children: React.ReactNode }) { return <span className="control-label">{children}</span>; }
function PreviewButton({ active, onClick, label, description, children }: { active: boolean; onClick: () => void; label: string; description?: string; children: React.ReactNode }) { return <button className="preview-option" aria-pressed={active} onClick={onClick}>{children}<span><strong>{label}</strong>{description ? <small>{description}</small> : null}</span></button>; }
function Range({ label, value, min, max, suffix = "%", onChange }: { label: string; value: number; min: number; max: number; suffix?: string; onChange: (value: number) => void }) { return <label className="range-control"><span>{label}<output>{value}{suffix}</output></span><input className="range range-xs" type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>; }
function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className="toggle-control"><span><strong>{label}</strong><small>{description}</small></span><input type="checkbox" className="toggle toggle-sm" checked={checked} onChange={(event) => onChange(event.target.checked)} /></label>; }
