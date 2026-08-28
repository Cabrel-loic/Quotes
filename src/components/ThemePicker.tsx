"use client";

import { motion } from "motion/react";
import type { ThemeName } from "@/types/quote";

const themes: { value: ThemeName; label: string }[] = [
  { value: "ink", label: "Ink & paper" },
  { value: "daylight", label: "Daylight" },
  { value: "midnight", label: "Midnight" },
  { value: "meadow", label: "Meadow" },
  { value: "rosewood", label: "Rosewood" },
  { value: "harbor", label: "Harbor" },
  { value: "graphite", label: "Graphite" },
  { value: "skyline", label: "Skyline" },
];

interface ThemePickerProps {
  value: ThemeName;
  onChange: (theme: ThemeName) => void;
}

export function ThemePicker({ value, onChange }: ThemePickerProps) {
  return (
    <fieldset>
      <legend className="setting-label">Theme</legend>
      <div className="theme-grid">
        {themes.map((theme) => (
          <motion.button
            key={theme.value}
            type="button"
            className={`theme-swatch theme-${theme.value}`}
            aria-label={`${theme.label} theme`}
            aria-pressed={value === theme.value}
            onClick={() => onChange(theme.value)}
            whileHover={{ y: -5, scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 420, damping: 25 }}
          >
            <span>{theme.label}</span>
            {value === theme.value ? <motion.i layoutId="theme-selection" className="theme-selection" /> : null}
          </motion.button>
        ))}
      </div>
    </fieldset>
  );
}
