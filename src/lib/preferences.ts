import type { DaybookPreferences } from "@/types/quote";

export const PREFERENCES_KEY = "daybook-preferences:v3";

export const defaultPreferences: DaybookPreferences = {
  theme: "harbor",
  accent: "",
  fonts: "inkpaper",
  animation: "stamp",
  backgroundAnimation: "harbor",
  quoteSize: 24,
  atmosphere: 100,
  motion: 50,
  grain: 70,
  layout: "immersive",
  backgroundInteraction: true,
  graphicsQuality: "auto",
};

export function migratePreferences(value: Partial<DaybookPreferences> | null): DaybookPreferences {
  if (!value) return defaultPreferences;
  return {
    ...defaultPreferences,
    ...value,
    motion: Math.min(100, Math.max(0, value.motion ?? defaultPreferences.motion)),
  };
}
