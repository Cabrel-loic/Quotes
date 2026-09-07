"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useDialog } from "@/hooks/useDialog";
import { getDateChrome } from "@/lib/date";
import type { AppearanceSettings, FontPairing, Quote, ThemeName } from "@/types/quote";

const presets = {
  portrait: { label: "Portrait", dimensions: "2160 × 2700", width: 2160, height: 2700 },
  square: { label: "Square", dimensions: "2160 × 2160", width: 2160, height: 2160 },
  story: { label: "Story", dimensions: "2160 × 3840", width: 2160, height: 3840 },
  desktop: { label: "Desktop", dimensions: "3840 × 2160", width: 3840, height: 2160 },
} as const;

const fileFormats = {
  png: { label: "PNG", description: "Lossless", mime: "image/png", extension: "png", quality: 1 },
  jpeg: { label: "JPEG", description: "Smaller file", mime: "image/jpeg", extension: "jpg", quality: 0.94 },
  webp: { label: "WebP", description: "Best compression", mime: "image/webp", extension: "webp", quality: 0.94 },
} as const;

const palettes: Record<ThemeName, { bg: string; bg2: string; text: string; soft: string; accent: string }> = {
  ink: { bg: "#14231c", bg2: "#293a2e", text: "#e9e4d6", soft: "#b9c2b6", accent: "#b08d57" },
  daylight: { bg: "#eadfc8", bg2: "#f6f1e4", text: "#3a362c", soft: "#7a7264", accent: "#8c4a32" },
  midnight: { bg: "#090d16", bg2: "#202a3c", text: "#dadce3", soft: "#aab2c3", accent: "#7fa8c9" },
  meadow: { bg: "#b9c8ad", bg2: "#e4e9de", text: "#354436", soft: "#667866", accent: "#c99a3c" },
  rosewood: { bg: "#28121d", bg2: "#573244", text: "#f6e7e4", soft: "#d8bfc1", accent: "#d88967" },
  harbor: { bg: "#0e2934", bg2: "#285666", text: "#e5f0ef", soft: "#b8cecd", accent: "#e0b94b" },
  graphite: { bg: "#17181a", bg2: "#414247", text: "#ece9e2", soft: "#c8c4bb", accent: "#c37a49" },
  skyline: { bg: "#b9cedc", bg2: "#e9f2f8", text: "#263640", soft: "#526671", accent: "#4f8e80" },
};

type PresetName = keyof typeof presets;
type FormatName = keyof typeof fileFormats;
type Props = { open: boolean; quote: Quote | null; settings: AppearanceSettings; capturedBackground: string | null; onClose: () => void; triggerRef?: React.RefObject<HTMLElement | null> };

export function ExportPanel({ open, quote, settings, capturedBackground, onClose, triggerRef }: Props) {
  const panelRef = useRef<HTMLElement>(null);
  useDialog(open, panelRef, onClose, triggerRef);
  const [preset, setPreset] = useState<PresetName>("portrait");
  const [fileFormat, setFileFormat] = useState<FormatName>("png");
  const [includeDate, setIncludeDate] = useState(true);
  const [includeMark, setIncludeMark] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState("");
  const selected = presets[preset];
  const format = fileFormats[fileFormat];
  const previewStyle = {
    "--preview-width": `${66 * selected.width / selected.height}dvh`,
    "--preview-mobile-width": `${44 * selected.width / selected.height}dvh`,
    "--preview-short-width": `${62 * selected.width / selected.height}dvh`,
    aspectRatio: `${selected.width}/${selected.height}`,
  } as CSSProperties;

  useEffect(() => {
    if (!open || !quote) return;
    let cancelled = false;
    const scale = Math.min(1, 960 / Math.max(selected.width, selected.height));
    void Promise.resolve().then(() => { if (!cancelled) setPreviewLoading(true); return document.fonts.ready; }).then(() => renderExport(
      Math.round(selected.width * scale), Math.round(selected.height * scale), quote, settings, includeDate, includeMark, capturedBackground,
    )).then((canvas) => {
      if (cancelled) return;
      setPreviewUrl(canvas.toDataURL(format.mime, format.quality));
      setPreviewLoading(false);
    }).catch(() => { if (!cancelled) { setPreviewLoading(false); setExportStatus("Preview could not be rendered in this browser."); } });
    return () => { cancelled = true; };
  }, [open, quote, settings, preset, selected.width, selected.height, includeDate, includeMark, capturedBackground, format.mime, format.quality]);

  async function download() {
    if (!quote) return;
    setExporting(true); setExportStatus("");
    try {
      await document.fonts.ready;
      const canvas = await renderExport(selected.width, selected.height, quote, settings, includeDate, includeMark, capturedBackground);
      canvas.toBlob((blob) => {
        if (!blob) { setExportStatus("This browser could not create the image."); setExporting(false); return; }
        const actualFormat = Object.values(fileFormats).find((item) => item.mime === blob.type) ?? fileFormats.png;
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url; anchor.download = `daybook-${preset}-${Date.now()}.${actualFormat.extension}`; anchor.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        setExportStatus(actualFormat.mime === format.mime ? `${format.label} downloaded.` : "This browser used PNG because the selected format is unsupported.");
        setExporting(false);
      }, format.mime, format.quality);
    } catch { setExportStatus("The image could not be rendered."); setExporting(false); }
  }

  return <AnimatePresence>{open ? <>
    <motion.button className="drawer-backdrop export-backdrop" aria-label="Close export panel" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
    <motion.aside ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="export-title" className="export-panel" initial={{ opacity: 0, y: 24, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: .98 }}>
      <header><div><p>Create a keepsake</p><h2 id="export-title">Export your quote</h2></div><button className="export-close" aria-label="Close export panel" onClick={onClose}>×</button></header>
      <div className="export-workspace">
        <div className="export-controls">
          <fieldset><legend>Canvas</legend><div className="export-preset-grid">{Object.entries(presets).map(([value, item]) => <button key={value} aria-pressed={preset === value} onClick={() => setPreset(value as PresetName)}><strong>{item.label}</strong><small>{item.dimensions}</small></button>)}</div></fieldset>
          <fieldset><legend>File format</legend><div className="export-format-row">{Object.entries(fileFormats).map(([value, item]) => <button key={value} aria-pressed={fileFormat === value} onClick={() => setFileFormat(value as FormatName)}><strong>{item.label}</strong><small>{item.description}</small></button>)}</div></fieldset>
          <fieldset><legend>Details</legend><label className="export-check"><input className="checkbox checkbox-sm" type="checkbox" checked={includeDate} onChange={(event) => setIncludeDate(event.target.checked)} /> Include date</label><label className="export-check"><input className="checkbox checkbox-sm" type="checkbox" checked={includeMark} onChange={(event) => setIncludeMark(event.target.checked)} /> Include quotation mark</label></fieldset>
          <div className="export-summary"><span>{settings.layout}</span><i /> <span>{settings.fonts}</span><i /> <span>{settings.quoteSize}px</span></div>
        </div>
        <div className="export-preview-column">
          <div className="export-preview-stage">
            <motion.div layout className="export-preview-frame" style={previewStyle} transition={{ type: "spring", stiffness: 240, damping: 28 }}>
              {previewUrl ? <img /* eslint-disable-line @next/next/no-img-element */ src={previewUrl} alt={`${selected.label} ${format.label} preview of the quote export`} /> : null}
              <AnimatePresence>{previewLoading ? <motion.div className="export-preview-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="status"><span/><p>Composing preview</p></motion.div> : null}</AnimatePresence>
            </motion.div>
          </div>
          <div className="export-footer"><div><strong>{selected.label}</strong><span>{selected.dimensions} · {format.label}</span></div><motion.button whileHover={{ y: -2, scale: 1.01 }} whileTap={{ scale: .98 }} className="export-button" disabled={!quote || exporting} onClick={download}>{exporting ? "Rendering full resolution…" : `Download ${format.label}`}</motion.button></div>
          <small className="export-note">{exportStatus || "The preview and download use your current layout, typography, size, palette, accent, and captured atmosphere."}</small>
        </div>
      </div>
    </motion.aside>
  </> : null}</AnimatePresence>;
}

async function renderExport(width: number, height: number, quote: Quote, settings: AppearanceSettings, includeDate: boolean, includeMark: boolean, capturedBackground: string | null) {
  const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d"); if (!context) throw new Error("Canvas rendering is unavailable");
  const background = capturedBackground ? await loadImage(capturedBackground).catch(() => null) : null;
  drawExport(context, width, height, quote, settings, includeDate, includeMark, background);
  return canvas;
}

function drawExport(ctx: CanvasRenderingContext2D, width: number, height: number, quote: Quote, settings: AppearanceSettings, includeDate: boolean, includeMark: boolean, background: HTMLImageElement | null) {
  const palette = { ...palettes[settings.theme], accent: settings.accent || palettes[settings.theme].accent };
  ctx.fillStyle = palette.bg; ctx.fillRect(0, 0, width, height);
  if (background) drawImageCover(ctx, background, width, height);
  else { const gradient = ctx.createLinearGradient(0, 0, width, height); gradient.addColorStop(0, palette.bg); gradient.addColorStop(1, palette.bg2); ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height); }
  const shade = ctx.createRadialGradient(width / 2, height * .46, 0, width / 2, height * .46, Math.max(width, height) * .72);
  shade.addColorStop(0, "#00000005"); shade.addColorStop(1, "#00000052"); ctx.fillStyle = shade; ctx.fillRect(0, 0, width, height);
  const unit = Math.min(width, height) / 100;
  const displayFont = canvasFont(settings.fonts);
  const sizeScale = settings.quoteSize / 24;
  const layout = settings.layout;
  const centerX = width / 2;
  ctx.textBaseline = "middle"; ctx.shadowColor = "#0000007a"; ctx.shadowBlur = unit * 1.4;

  if (includeDate) {
    const date = getDateChrome(); ctx.textAlign = layout === "editorial" ? "left" : "center";
    ctx.font = `650 ${unit * 1.18}px Inter, Arial, sans-serif`; ctx.fillStyle = palette.soft;
    ctx.fillText(`${date.stamp}   ·   ${date.badge}`, layout === "editorial" ? width * .15 : centerX, height * .085);
  }

  const textLeft = layout === "editorial" ? width * .16 : width * .12;
  const textWidth = layout === "editorial" ? width * .7 : width * .76;
  const baseSize = unit * (quote.text.length < 70 ? 6.4 : quote.text.length < 140 ? 5.25 : quote.text.length < 230 ? 4.25 : 3.45) * sizeScale;
  const verticalAllowance = height * (layout === "editorial" ? .48 : .46);
  const fitted = fitText(ctx, quote.text, displayFont, baseSize, textWidth, verticalAllowance, unit * 2.5);
  const lineHeight = fitted.fontSize * 1.16;
  const contentCenter = layout === "editorial" ? height * .5 : height * .51;
  const startY = contentCenter - ((fitted.lines.length - 1) * lineHeight) / 2;

  if (layout === "editorial") {
    ctx.fillStyle = palette.accent; ctx.fillRect(width * .095, height * .25, Math.max(2, unit * .22), height * .49);
    ctx.textAlign = "left"; ctx.font = `700 ${unit * 1.05}px Inter, Arial, sans-serif`; ctx.fillStyle = palette.soft; ctx.fillText("DAYBOOK / DAILY THOUGHT", textLeft, height * .18);
    if (includeMark) { ctx.font = `600 ${unit * 7}px ${displayFont}`; ctx.fillStyle = palette.accent; ctx.fillText("“", width * .105, startY - lineHeight * .15); }
    ctx.font = `500 ${fitted.fontSize}px ${displayFont}`; ctx.fillStyle = palette.text;
    fitted.lines.forEach((line, index) => ctx.fillText(line, textLeft, startY + index * lineHeight));
    ctx.font = `650 ${unit * 1.25}px Inter, Arial, sans-serif`; ctx.fillStyle = palette.soft; ctx.fillText(quote.author.toUpperCase(), textLeft, startY + fitted.lines.length * lineHeight + unit * 3.5);
  } else {
    ctx.textAlign = "center";
    if (includeMark) { ctx.font = `600 ${unit * 7.5}px ${displayFont}`; ctx.fillStyle = palette.accent; ctx.fillText("“", centerX, startY - lineHeight * 1.25); }
    ctx.font = `500 ${fitted.fontSize}px ${displayFont}`; ctx.fillStyle = palette.text;
    fitted.lines.forEach((line, index) => ctx.fillText(line, centerX, startY + index * lineHeight));
    ctx.font = `650 ${unit * 1.3}px Inter, Arial, sans-serif`; ctx.fillStyle = palette.soft; ctx.fillText(`—  ${quote.author}`, centerX, startY + fitted.lines.length * lineHeight + unit * 3.5);
  }
  ctx.textAlign = "center"; ctx.font = `650 ${unit * .9}px Inter, Arial, sans-serif`; ctx.fillStyle = `${palette.soft}bb`; ctx.fillText("DAYBOOK", centerX, height * .94);
}

function canvasFont(font: FontPairing) {
  if (font === "typewriter") return '"Courier New", monospace';
  if (font === "modernist") return "Inter, Arial, sans-serif";
  if (font === "broadsheet" || font === "editorial") return '"Times New Roman", serif';
  return "Georgia, serif";
}

function fitText(ctx: CanvasRenderingContext2D, text: string, family: string, desiredSize: number, maxWidth: number, maxHeight: number, minimumSize: number) {
  let fontSize = desiredSize; let lines: string[] = [];
  while (fontSize >= minimumSize) {
    ctx.font = `500 ${fontSize}px ${family}`; lines = wrapText(ctx, text, maxWidth);
    if (lines.length * fontSize * 1.16 <= maxHeight) break;
    fontSize *= .94;
  }
  return { fontSize: Math.max(fontSize, minimumSize), lines };
}

function drawImageCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sourceWidth = width / scale; const sourceHeight = height / scale;
  ctx.drawImage(image, (image.naturalWidth - sourceWidth) / 2, (image.naturalHeight - sourceHeight) / 2, sourceWidth, sourceHeight, 0, 0, width, height);
}
function loadImage(source: string) { return new Promise<HTMLImageElement>((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = source; }); }
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) { const words = text.split(" "); const lines: string[] = []; let line = ""; words.forEach((word) => { const test = line ? `${line} ${word}` : word; if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; } else line = test; }); if (line) lines.push(line); return lines; }
