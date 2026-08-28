# Daybook

Daybook is an immersive daily quote and reflection app built with Next.js. It combines a deterministic quote of the day, offline support, an explanation engine, extensive appearance controls, real-time Three.js atmosphere, expressive interface motion, and private HD image export.

The project is a ground-up rebuild of an earlier single-file `daily-quote.html` prototype. The prototype remains a behavioral and visual reference; the application itself now uses components, typed data, and dedicated utility modules.

## Features

- A deterministic quote of the day from [DummyJSON](https://dummyjson.com/docs/quotes)
- Daily quote caching in `localStorage`
- Curated offline fallback quotes
- Random quote fetching with a return-to-today action
- Clipboard copying with animated confirmation
- Groq-powered AI interpretations with a local fallback that produces:
  - a simple interpretation
  - a deeper interpretation
  - a reflection question
- Eight visual themes, with Harbor as the first-run default
- Custom accent color
- Multiple typeface pairings
- Adjustable quote size
- Four selectable procedural atmospheres: Harbor, Aurora, Constellation, and Embers
- Harbor motion is the default, with adjustable atmosphere and motion intensity
- Persistent appearance preferences
- Motion-sensitive, magnetic action controls
- Quote tilt and layered pointer parallax
- Animated meaning panel and settings drawer
- GPU-rendered Three.js background with:
  - flowing shader fields
  - luminous particles
  - a bright, theme-aware cursor wake that traces pointer movement
  - click-generated light rings
  - animated theme color transitions
- Reduced-motion and WebGL fallbacks
- Instant live-background capture with an accurate export preview
- Private HD export in PNG, JPEG, or WebP
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

Copy the environment template and add a free Groq API key:

```bash
cp .env.example .env.local
```

```text
GROQ_API_KEY=your_groq_api_key_here
```

Create a key in the [Groq Console](https://console.groq.com/keys). The key is read only by the `/api/meaning` Route Handler and must never be prefixed with `NEXT_PUBLIC_`.

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

The interpretation feature sends the quote and author to the server-only `/api/meaning` Route Handler. The handler requests a strict JSON-schema response from Groq using `openai/gpt-oss-20b`, validates the output, and returns only the four display fields.

Successful interpretations are cached in the browser by quote and author. Repeat views therefore do not consume additional Groq requests.

If Groq is unconfigured, unavailable, rate-limited, or times out, Daybook automatically uses the bundled local engine:

1. Exact interpretations for selected well-known quotes.
2. Keyword scoring against bundled meaning themes.
3. A general reflective interpretation when no strong theme matches.

The output is intended as a thoughtful reading prompt rather than an authoritative explanation of an author’s intent.

## Appearance persistence

Appearance preferences are saved under the versioned `appearance-settings:v2` key in `localStorage`. Harbor is used on first run; changes made afterward persist normally. The persisted settings include:

- theme
- custom accent color
- typeface pairing
- entrance animation
- procedural background animation
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

Opening Download HD freezes the current WebGL background frame—including its exact procedural pattern and cursor wake—and uses it for both the preview and final high-resolution render. Available presets include:

- Portrait: 2160 × 2700
- Square: 2160 × 2160
- Story: 2160 × 3840
- 4K desktop: 3840 × 2160

Users can include or remove the date and quotation mark, then export PNG, JPEG, or WebP. The selected canvas size and file format are encoded independently, with matching MIME types and filename extensions.

No export data is uploaded, and no backend is required.

## External services and privacy

Runtime network requests are made to DummyJSON for quote content and, when configured, to Groq through Daybook’s server-only Route Handler. The Groq API key is never sent to the browser. Settings, cached meanings, clipboard actions, motion, and image export remain local.

## Future directions

- Saved quote collections and browsing history
- Additional export layouts and custom dimensions
- Animated WebM export
- Share API integration
- Custom user-entered quotes
- Installable PWA and enhanced offline support
- Optional route handlers or backend only when persistent accounts or cross-device synchronization become necessary
