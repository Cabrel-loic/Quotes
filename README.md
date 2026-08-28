# Daybook

Daybook is an immersive daily quote and reflection app built with Next.js. It combines a deterministic quote of the day, offline support, an explanation engine, extensive appearance controls, real-time Three.js atmosphere, expressive interface motion, and private HD image export.

The project is a ground-up rebuild of an earlier single-file `daily-quote.html` prototype. The prototype remains a behavioral and visual reference; the application itself now uses components, typed data, and dedicated utility modules.

## Features

- A deterministic quote of the day from [DummyJSON](https://dummyjson.com/docs/quotes)
- Daily quote caching in `localStorage`
- Curated offline fallback quotes
- Random quote fetching with a return-to-today action
- Clipboard copying with animated confirmation
- A local meaning engine that produces:
  - a simple interpretation
  - a deeper interpretation
  - a reflection question
- Eight visual themes
- Custom accent color
- Multiple typeface pairings
- Adjustable quote size
- Adjustable atmosphere and motion intensity
- Persistent appearance preferences
- Motion-sensitive, magnetic action controls
- Quote tilt and layered pointer parallax
- Animated meaning panel and settings drawer
- GPU-rendered Three.js background with:
  - flowing shader fields
  - luminous particles
  - pointer displacement
  - click-generated light rings
  - animated theme color transitions
- Reduced-motion and WebGL fallbacks
- Private, browser-only HD PNG export
- Responsive desktop and mobile layouts

## Technology

- [Next.js 16](https://nextjs.org/) with App Router
- [React 19](https://react.dev/)
- TypeScript
- [Tailwind CSS 4](https://tailwindcss.com/)
- [daisyUI 5](https://daisyui.com/)
- [Motion for React](https://motion.dev/docs/react)
- [Three.js](https://threejs.org/)
- Inter Variable, bundled locally with Fontsource
- pnpm

## Getting started

### Requirements

- Node.js 20 or newer
- pnpm 11

### Install

```bash
pnpm install
```

The workspace explicitly allows the `unrs-resolver` installation script in `pnpm-workspace.yaml`. This is required by the current dependency toolchain.

### Run locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production build

```bash
pnpm build
pnpm start
```

## Available commands

```bash
pnpm dev                 # Start the development server
pnpm build               # Create an optimized production build
pnpm start               # Run the production server
pnpm lint                # Run ESLint
pnpm exec tsc --noEmit   # Run strict TypeScript validation
```

## Project structure

```text
src/
├── app/
│   ├── globals.css          Global tokens, themes, atmosphere, and UI styles
│   ├── layout.tsx           Root metadata and locally bundled Inter font
│   └── page.tsx             Server-rendered route and resilient fallback
├── components/
│   ├── AppErrorBoundary.tsx Visible client-rendering fallback
│   ├── ExportPanel.tsx      Browser-side HD PNG generation
│   ├── MeaningPanel.tsx     Animated interpretation and reflection content
│   ├── MotionBackground.tsx Three.js shader and particle scene
│   ├── QuoteActions.tsx     Magnetic action controls
│   ├── QuoteApp.tsx         Main client state and application orchestration
│   ├── QuoteCard.tsx        Animated, pointer-reactive quote presentation
│   ├── SettingsDrawer.tsx   Persistent appearance controls
│   └── ThemePicker.tsx      Animated theme selection
├── data/
│   ├── fallbackQuotes.ts    Offline quote catalog
│   └── meaningThemes.ts     Keyword-based interpretation themes
├── lib/
│   ├── date.ts              Date key, day count, and display helpers
│   ├── meaning.ts           Local quote interpretation engine
│   ├── quotes.ts            DummyJSON fetching and offline fallback logic
│   └── storage.ts           Safe localStorage access
└── types/
    └── quote.ts             Quote, meaning, theme, animation, and settings types
```

## Quote behavior

Daybook first looks for a quote cached under the current local date. If no cached value exists, it requests the total DummyJSON quote count and derives a quote ID from the current epoch day. This gives users the same quote throughout a given day without requiring a backend.

If DummyJSON is unavailable, Daybook selects a deterministic quote from the bundled fallback catalog. Random quote requests use the same offline catalog when necessary.

## Meaning engine

The interpretation feature runs entirely in the browser and does not call an AI service. It uses:

1. Exact interpretations for selected well-known quotes.
2. Keyword scoring against bundled meaning themes.
3. A general reflective interpretation when no strong theme matches.

The output is intended as a thoughtful reading prompt rather than an authoritative explanation of an author’s intent.

## Appearance persistence

Appearance preferences are saved under `appearance-settings` in `localStorage`. The persisted settings include:

- theme
- custom accent color
- typeface pairing
- entrance animation
- quote size
- background intensity
- background motion
- grain amount

The app remains usable if browser storage is disabled; preferences simply reset on reload.

## Motion and accessibility

Motion for React handles component transitions, gesture feedback, layout changes, and scroll-linked depth. Three.js handles the continuous background scene.

The native cursor is never replaced or delayed. Interface elements react to pointer position through independent spring values.

When the operating system requests reduced motion:

- quote tilt is disabled
- pointer parallax is disabled
- large transforms are minimized
- the Three.js scene renders a stable frame
- opacity and color feedback remain available

The WebGL animation loop also pauses when the document is hidden.

## HD export

The Download HD panel creates a new high-resolution canvas rather than enlarging a screenshot of the page. Available presets include:

- Portrait: 2160 × 2700
- Square: 2160 × 2160
- Story: 2160 × 3840
- 4K desktop: 3840 × 2160

Users can include or remove the date and quotation mark. The selected theme, accent color, quote, and author are rendered into a PNG locally.

No export data is uploaded, and no backend is required.

## External services and privacy

The only runtime network request made by the app is to DummyJSON for quote content. Settings, meanings, clipboard actions, motion, and image export all run locally in the browser.

## Future directions

- Saved quote collections and browsing history
- Additional export layouts and custom dimensions
- Animated WebM export
- Share API integration
- Custom user-entered quotes
- Installable PWA and enhanced offline support
- Optional route handlers or backend only when persistent accounts or cross-device synchronization become necessary
