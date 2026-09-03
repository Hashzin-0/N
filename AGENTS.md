# AGENTS.md

## What This Is

Next.js 15 App Router application — a Brazilian corn nitrogen calculator ("Agronômica N-Pro") with Gemini Live voice assistant and 3D visualization. Runs as a Google AI Studio applet on Cloud Run.

## Key Commands

- `npm run dev` — start dev server
- `npm run build` — production build (standalone output)
- `npm run lint` — ESLint (next config)
- `npm run clean` — `next clean`

No test framework or test files exist. No CI workflows.

## Build Quirks

- ESLint is ignored during builds (`eslint.ignoreDuringBuilds: true` in `next.config.ts`)
- TypeScript errors are NOT ignored — `typescript.ignoreBuildErrors: false`
- Standalone output mode (`output: 'standalone'`)
- HMR is disabled in AI Studio via `DISABLE_HMR=true` env var (webpack watchOptions ignore all files)
- `motion` package is transpiled via `transpilePackages`

## Environment

Two env vars (see `.env.example`):
- `GEMINI_API_KEY` — injected by AI Studio at runtime from user secrets
- `APP_URL` — injected by AI Studio with Cloud Run service URL

Do not hardcode or commit these. The `.env` file is gitignored.

## Architecture

- **App Router**: `app/page.tsx` is the single-page calculator (client component)
- **API Route**: `app/api/gemini/live-token/route.ts` — creates ephemeral tokens for Gemini Live WebSocket
- **Components**: 11 components in `components/` — 3D visualizers (Three.js), dark mode toggles, voice HUD, scenario save/compare
- **Hooks**: `hooks/useGeminiLiveAgent.ts` — manages Gemini Live WebSocket connection and voice agent state (700+ lines)
- **Lib**: `lib/audioStreamer.ts` (audio capture/playback), `lib/pageAutomator.ts` (UI automation for voice agent), `lib/storage.ts` (localStorage-based scenario DB)
- **Storage**: localStorage with `useSyncExternalStore` for hydration safety; 3 default seed scenarios
- **Language**: App UI is in Portuguese (pt-BR)

## Conventions

- `@/*` path alias maps to root (configured in `tsconfig.json`)
- Tailwind CSS 4 with `@tailwindcss/postcss` plugin; custom dark mode variant: `.dark` class
- Client components use `'use client'` directive
- Icons from `lucide-react`
- Animation from `motion/react` (not `framer-motion`)
- `cn()` utility in `lib/utils.ts` for Tailwind class merging (clsx + tailwind-merge)
