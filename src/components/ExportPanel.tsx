"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { getDateChrome } from "@/lib/date";
import type { AppearanceSettings, Quote, ThemeName } from "@/types/quote";

const presets = {
  portrait: { label: "Portrait · 2160 × 2700", width: 2160, height: 2700 },
  square: { label: "Square · 2160 × 2160", width: 2160, height: 2160 },
  story: { label: "Story · 2160 × 3840", width: 2160, height: 3840 },
  desktop: { label: "4K desktop · 3840 × 2160", width: 3840, height: 2160 },
};

const palettes: Record<ThemeName, { bg: string; bg2: string; text: string; soft: string; glow: string; accent: string }> = {
  ink: { bg: "#14231c", bg2: "#293a2e", text: "#e9e4d6", soft: "#b9c2b6", glow: "#54725b", accent: "#b08d57" },
  daylight: { bg: "#eadfc8", bg2: "#f6f1e4", text: "#3a362c", soft: "#7a7264", glow: "#fff7e8", accent: "#8c4a32" },
  midnight: { bg: "#090d16", bg2: "#202a3c", text: "#dadce3", soft: "#8e96a7", glow: "#375272", accent: "#7fa8c9" },
  meadow: { bg: "#b9c8ad", bg2: "#e4e9de", text: "#354436", soft: "#667866", glow: "#eaf2df", accent: "#c99a3c" },
  rosewood: { bg: "#28121d", bg2: "#573244", text: "#f6e7e4", soft: "#d8bfc1", glow: "#8b4d5e", accent: "#d88967" },
  harbor: { bg: "#0e2934", bg2: "#285666", text: "#e5f0ef", soft: "#afc7c6", glow: "#47848a", accent: "#e0b94b" },
  graphite: { bg: "#17181a", bg2: "#414247", text: "#ece9e2", soft: "#c0bdb5", glow: "#71685f", accent: "#c37a49" },
  skyline: { bg: "#b9cedc", bg2: "#e9f2f8", text: "#263640", soft: "#62737d", glow: "#f8fcff", accent: "#4f8e80" },
};

export function ExportPanel({ open, quote, settings, onClose }: { open: boolean; quote: Quote | null; settings: AppearanceSettings; onClose: () => void }) {
  const [preset, setPreset] = useState<keyof typeof presets>("portrait");
  const [includeDate, setIncludeDate] = useState(true);
  const [includeMark, setIncludeMark] = useState(true);
  const [exporting, setExporting] = useState(false);

  async function download() {
    if (!quote) return;
    setExporting(true);
    await document.fonts.ready;
    const { width, height } = presets[preset];
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return setExporting(false);
    drawExport(context, width, height, quote, settings, includeDate, includeMark);
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url; anchor.download = `daybook-${preset}-${Date.now()}.png`; anchor.click();
        URL.revokeObjectURL(url);
      }
      setExporting(false);
    }, "image/png");
  }

  return <AnimatePresence>{open ? <>
    <motion.button className="drawer-backdrop is-open export-backdrop" aria-label="Close export panel" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
    <motion.aside className="export-panel" initial={{ opacity: 0, y: 35, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 25, scale: 0.97 }} transition={{ type: "spring", stiffness: 250, damping: 27 }}>
      <header><div><p>Create a keepsake</p><h2>Download in HD</h2></div><button className="btn btn-circle btn-ghost" onClick={onClose}>×</button></header>
      <div className="export-content">
        <label><span className="setting-label">Format</span><select className="select w-full" value={preset} onChange={(event) => setPreset(event.target.value as keyof typeof presets)}>{Object.entries(presets).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}</select></label>
        <label className="export-check"><input className="checkbox checkbox-sm" type="checkbox" checked={includeDate} onChange={(event) => setIncludeDate(event.target.checked)} /> Include date</label>
        <label className="export-check"><input className="checkbox checkbox-sm" type="checkbox" checked={includeMark} onChange={(event) => setIncludeMark(event.target.checked)} /> Include quotation mark</label>
        <div className="export-preview" style={{ background: `linear-gradient(145deg, ${palettes[settings.theme].bg}, ${palettes[settings.theme].bg2})`, color: palettes[settings.theme].text }}><span>“</span><p>{quote?.text}</p><small>— {quote?.author}</small></div>
        <motion.button whileHover={{ y: -3, scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn export-button" disabled={!quote || exporting} onClick={download}>{exporting ? "Rendering HD image…" : "Download PNG"}</motion.button>
        <small className="export-note">Generated privately in your browser. Nothing is uploaded.</small>
      </div>
    </motion.aside>
  </> : null}</AnimatePresence>;
}

function drawExport(ctx: CanvasRenderingContext2D, width: number, height: number, quote: Quote, settings: AppearanceSettings, includeDate: boolean, includeMark: boolean) {
  const palette = { ...palettes[settings.theme], accent: settings.accent || palettes[settings.theme].accent };
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, palette.bg); gradient.addColorStop(1, palette.bg2);
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);
  [[.18,.2,.48,palette.glow],[.82,.74,.55,palette.accent],[.5,.46,.42,palette.glow]].forEach(([x,y,r,color]) => {
    const glow = ctx.createRadialGradient(Number(x)*width,Number(y)*height,0,Number(x)*width,Number(y)*height,Number(r)*Math.max(width,height));
    glow.addColorStop(0, `${String(color)}88`); glow.addColorStop(1, `${String(color)}00`); ctx.fillStyle = glow; ctx.fillRect(0,0,width,height);
  });
  const unit = Math.min(width, height) / 100;
  ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.shadowColor = "#00000066"; ctx.shadowBlur = unit * 1.6;
  if (includeDate) { const date = getDateChrome(); ctx.font = `600 ${unit * 1.35}px Inter, sans-serif`; ctx.fillStyle = palette.soft; ctx.fillText(`${date.stamp}   ·   ${date.badge}`, width/2, height*.09); }
  if (includeMark) { ctx.font = `600 ${unit * 9}px Georgia, serif`; ctx.fillStyle = palette.accent; ctx.fillText("“", width/2, height*.27); }
  const fontSize = Math.min(unit * 5.3, width / Math.max(12, quote.text.length * .3));
  ctx.font = `500 ${fontSize}px Georgia, serif`; ctx.fillStyle = palette.text;
  const lines = wrapText(ctx, quote.text, width * .76);
  const lineHeight = fontSize * 1.18; const startY = height*.49 - ((lines.length-1)*lineHeight)/2;
  lines.forEach((line,index) => ctx.fillText(line,width/2,startY+index*lineHeight));
  ctx.shadowBlur = unit*.8; ctx.font = `600 ${unit * 1.5}px Inter, sans-serif`; ctx.fillStyle = palette.soft; ctx.fillText(`—  ${quote.author}`,width/2,startY+lines.length*lineHeight+unit*4.5);
  ctx.font = `600 ${unit}px Inter, sans-serif`; ctx.fillStyle = `${palette.soft}aa`; ctx.fillText("DAYBOOK",width/2,height*.93);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(" "); const lines: string[] = []; let line = "";
  words.forEach((word) => { const test = line ? `${line} ${word}` : word; if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; } else line = test; });
  if (line) lines.push(line); return lines;
}
