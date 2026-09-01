"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useDialog } from "@/hooks/useDialog";
import { getDateChrome } from "@/lib/date";
import type { AppearanceSettings, Quote, ThemeName } from "@/types/quote";

const presets = {
  portrait: { label: "Portrait · 2160 × 2700", width: 2160, height: 2700 },
  square: { label: "Square · 2160 × 2160", width: 2160, height: 2160 },
  story: { label: "Story · 2160 × 3840", width: 2160, height: 3840 },
  desktop: { label: "4K desktop · 3840 × 2160", width: 3840, height: 2160 },
};

const fileFormats = {
  png: { label: "PNG · lossless", mime: "image/png", extension: "png", quality: 1 },
  jpeg: { label: "JPEG · smaller file", mime: "image/jpeg", extension: "jpg", quality: 0.94 },
  webp: { label: "WebP · best compression", mime: "image/webp", extension: "webp", quality: 0.94 },
} as const;

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

export function ExportPanel({ open, quote, settings, capturedBackground, onClose, triggerRef }: { open: boolean; quote: Quote | null; settings: AppearanceSettings; capturedBackground: string | null; onClose: () => void; triggerRef?: React.RefObject<HTMLElement | null> }) {
  const panelRef = useRef<HTMLElement>(null);
  useDialog(open, panelRef, onClose, triggerRef);
  const [preset, setPreset] = useState<keyof typeof presets>("portrait");
  const [fileFormat, setFileFormat] = useState<keyof typeof fileFormats>("png");
  const [includeDate, setIncludeDate] = useState(true);
  const [includeMark, setIncludeMark] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState("");

  useEffect(() => {
    if (!open || !quote) return;
    let cancelled = false;
    const selected = presets[preset];
    const scale = 760 / Math.max(selected.width, selected.height);
    void renderExport(Math.round(selected.width * scale), Math.round(selected.height * scale), quote, settings, includeDate, includeMark, capturedBackground).then((canvas) => {
      if (cancelled) return;
      const nextUrl = canvas.toDataURL("image/png");
      setPreviewUrl(nextUrl);
    });
    return () => { cancelled = true; };
  }, [open, quote, settings, preset, includeDate, includeMark, capturedBackground]);

  async function download() {
    if (!quote) return;
    setExporting(true);
    setExportStatus("");
    await document.fonts.ready;
    const { width, height } = presets[preset];
    const canvas = await renderExport(width, height, quote, settings, includeDate, includeMark, capturedBackground);
    const format = fileFormats[fileFormat];
    canvas.toBlob((blob) => {
      if (blob) {
        const actualFormat = Object.values(fileFormats).find((item) => item.mime === blob.type) ?? fileFormats.png;
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url; anchor.download = `daybook-${preset}-${Date.now()}.${actualFormat.extension}`; anchor.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        setExportStatus(actualFormat.mime === format.mime ? `${format.label.split(" ·")[0]} downloaded.` : "This browser exported PNG because the selected format is unsupported.");
      }
      setExporting(false);
    }, format.mime, format.quality);
  }

  return <AnimatePresence>{open ? <>
    <motion.button className="drawer-backdrop is-open export-backdrop" aria-label="Close export panel" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
    <motion.aside ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="export-title" className="export-panel" initial={{ opacity: 0, y: 35, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 25, scale: 0.97 }} transition={{ type: "spring", stiffness: 250, damping: 27 }}>
      <header><div><p>Create a keepsake</p><h2 id="export-title">Download in HD</h2></div><button className="btn btn-circle btn-ghost" aria-label="Close export panel" onClick={onClose}>×</button></header>
      <div className="export-content">
        <label><span className="setting-label">Canvas size</span><select className="select w-full" value={preset} onChange={(event) => setPreset(event.target.value as keyof typeof presets)}>{Object.entries(presets).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}</select></label>
        <label><span className="setting-label">File format</span><select className="select w-full" value={fileFormat} onChange={(event) => setFileFormat(event.target.value as keyof typeof fileFormats)}>{Object.entries(fileFormats).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}</select></label>
        <label className="export-check"><input className="checkbox checkbox-sm" type="checkbox" checked={includeDate} onChange={(event) => setIncludeDate(event.target.checked)} /> Include date</label>
        <label className="export-check"><input className="checkbox checkbox-sm" type="checkbox" checked={includeMark} onChange={(event) => setIncludeMark(event.target.checked)} /> Include quotation mark</label>
        <div className="export-preview" style={{ aspectRatio: `${presets[preset].width}/${presets[preset].height}` }}>{previewUrl ? <img /* eslint-disable-line @next/next/no-img-element */ src={previewUrl} alt="Preview of the captured quote image" /> : <span className="loading loading-spinner" />}</div>
        <motion.button whileHover={{ y: -3, scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn export-button" disabled={!quote || exporting} onClick={download}>{exporting ? "Rendering HD image…" : `Download ${fileFormats[fileFormat].label.split(" ·")[0]}`}</motion.button>
        <small className="export-note">{exportStatus || "Live background captured at the instant you opened this preview. Nothing is uploaded."}</small>
      </div>
    </motion.aside>
  </> : null}</AnimatePresence>;
}

async function renderExport(width: number, height: number, quote: Quote, settings: AppearanceSettings, includeDate: boolean, includeMark: boolean, capturedBackground: string | null) {
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas rendering is unavailable");
  const background = capturedBackground ? await loadImage(capturedBackground).catch(() => null) : null;
  drawExport(context, width, height, quote, settings, includeDate, includeMark, background);
  return canvas;
}

function drawExport(ctx: CanvasRenderingContext2D, width: number, height: number, quote: Quote, settings: AppearanceSettings, includeDate: boolean, includeMark: boolean, background: HTMLImageElement | null) {
  const palette = { ...palettes[settings.theme], accent: settings.accent || palettes[settings.theme].accent };
  ctx.fillStyle = palette.bg; ctx.fillRect(0, 0, width, height);
  if (background) drawImageCover(ctx, background, width, height);
  else { const gradient = ctx.createLinearGradient(0, 0, width, height); gradient.addColorStop(0, palette.bg); gradient.addColorStop(1, palette.bg2); ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height); }
  const shade = ctx.createRadialGradient(width / 2, height * .48, 0, width / 2, height * .48, Math.max(width, height) * .68);
  shade.addColorStop(0, "#00000005"); shade.addColorStop(1, "#00000042"); ctx.fillStyle = shade; ctx.fillRect(0, 0, width, height);
  const unit = Math.min(width, height) / 100;
  ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.shadowColor = "#00000066"; ctx.shadowBlur = unit * 1.6;
  if (includeDate) { const date = getDateChrome(); ctx.font = `600 ${unit * 1.35}px Inter, sans-serif`; ctx.fillStyle = palette.soft; ctx.fillText(`${date.stamp}   ·   ${date.badge}`, width/2, height*.09); }
  if (includeMark) { ctx.font = `600 ${unit * 9}px Georgia, serif`; ctx.fillStyle = palette.accent; ctx.fillText("“", width/2, height*.27); }
  const fontSize = Math.min(unit * 5.3, width / Math.max(12, quote.text.length * .3));
  ctx.font = `500 ${fontSize}px Georgia, serif`; ctx.fillStyle = palette.text;
  const maxTextWidth = settings.layout === "editorial" ? width * .68 : width * .76;
  const lines = wrapText(ctx, quote.text, maxTextWidth);
  const lineHeight = fontSize * 1.18; const startY = height*.49 - ((lines.length-1)*lineHeight)/2;
  if (settings.layout === "editorial") {
    ctx.textAlign = "left";
    const left = width * .16;
    ctx.fillStyle = palette.accent; ctx.fillRect(width * .1, height * .28, unit * .25, height * .42);
    ctx.font = `700 ${unit * 1.05}px Inter, sans-serif`; ctx.fillText("DAYBOOK / DAILY THOUGHT", left, height * .18);
    ctx.font = `500 ${fontSize}px Georgia, serif`; ctx.fillStyle = palette.text;
    lines.forEach((line,index) => ctx.fillText(line, left, startY+index*lineHeight));
    ctx.shadowBlur = unit*.8; ctx.font = `600 ${unit * 1.5}px Inter, sans-serif`; ctx.fillStyle = palette.soft; ctx.fillText(quote.author.toUpperCase(), left, startY+lines.length*lineHeight+unit*4.5);
  } else {
    lines.forEach((line,index) => ctx.fillText(line,width/2,startY+index*lineHeight));
    ctx.shadowBlur = unit*.8; ctx.font = `600 ${unit * 1.5}px Inter, sans-serif`; ctx.fillStyle = palette.soft; ctx.fillText(`—  ${quote.author}`,width/2,startY+lines.length*lineHeight+unit*4.5);
  }
  ctx.textAlign = "center";
  ctx.font = `600 ${unit}px Inter, sans-serif`; ctx.fillStyle = `${palette.soft}aa`; ctx.fillText("DAYBOOK",width/2,height*.93);
}

function drawImageCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sourceWidth = width / scale; const sourceHeight = height / scale;
  const sourceX = (image.naturalWidth - sourceWidth) / 2; const sourceY = (image.naturalHeight - sourceHeight) / 2;
  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = source;
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(" "); const lines: string[] = []; let line = "";
  words.forEach((word) => { const test = line ? `${line} ${word}` : word; if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; } else line = test; });
  if (line) lines.push(line); return lines;
}
