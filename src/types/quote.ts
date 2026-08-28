export type QuoteSource = "dummyjson" | "offline";

export interface Quote {
  text: string;
  author: string;
  source: QuoteSource;
  id?: number;
}

export interface QuoteMeaning {
  title: string;
  simple: string;
  deeper: string;
  reflection: string;
}

export type ThemeName =
  | "ink"
  | "daylight"
  | "midnight"
  | "meadow"
  | "rosewood"
  | "harbor"
  | "graphite"
  | "skyline";

export type FontPairing =
  | "inkpaper"
  | "broadsheet"
  | "typewriter"
  | "readingroom"
  | "editorial"
  | "modernist";

export type EntranceAnimation = "stamp" | "fade" | "slide" | "typewriter";

export interface AppearanceSettings {
  theme: ThemeName;
  accent: string;
  fonts: FontPairing;
  animation: EntranceAnimation;
  quoteSize: number;
  atmosphere: number;
  motion: number;
  grain: number;
}
