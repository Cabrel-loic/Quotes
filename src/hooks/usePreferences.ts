"use client";

import { useEffect, useState } from "react";
import { accentContent } from "@/lib/color";
import { defaultPreferences, migratePreferences, PREFERENCES_KEY } from "@/lib/preferences";
import { readStorage, writeStorage } from "@/lib/storage";
import type { DaybookPreferences } from "@/types/quote";

export function usePreferences() {
  const [preferences, setPreferences] = useState(defaultPreferences);

  useEffect(() => {
    const saved = readStorage<Partial<DaybookPreferences>>(PREFERENCES_KEY)
      ?? readStorage<Partial<DaybookPreferences>>("appearance-settings:v2");
    if (saved) queueMicrotask(() => setPreferences(migratePreferences(saved)));
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = preferences.theme;
    root.dataset.fonts = preferences.fonts;
    root.dataset.layout = preferences.layout;
    root.style.setProperty("--quote-size", `${preferences.quoteSize}px`);
    root.style.setProperty("--atmosphere", String(preferences.atmosphere / 100));
    root.style.setProperty("--motion", String(preferences.motion / 100));
    root.style.setProperty("--grain", String(preferences.grain / 100));
    if (preferences.accent) {
      root.style.setProperty("--accent", preferences.accent);
      root.style.setProperty("--accent-content", accentContent(preferences.accent));
    } else {
      root.style.removeProperty("--accent");
      root.style.removeProperty("--accent-content");
    }
    writeStorage(PREFERENCES_KEY, preferences);
  }, [preferences]);

  return { preferences, setPreferences, resetPreferences: () => setPreferences(defaultPreferences) };
}
