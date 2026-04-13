# WeekOrganizator — Project Guide

## Overview
Single-user weekly productivity app. 5-step sequential planning wizard.
Next.js 16 App Router + TypeScript + Tailwind v4 + shadcn/ui + Supabase + Vercel.

## Architecture Rules
- **Mutations:** Server Actions only (`lib/actions/*.actions.ts`). No client-side Supabase calls except real-time.
- **DB queries:** Server Components or Server Actions. Never fetch from client components.
- **Validation:** Zod on ALL Server Action inputs.
- **Optimistic UI:** `useOptimistic` hook for instant feedback.
- **Supabase clients:** browser→`lib/supabase/client.ts`, server→`lib/supabase/server.ts`

## Naming Conventions
- Components: PascalCase
- Server Actions: `verbNoun` (e.g. `createBrainDumpItem`, `updatePriority`)
- Hooks: `use` prefix in `lib/hooks/`
- DB types: imported from `@/types/database`
- Imports: absolute with `@/` alias

## Priority Color System
```
top    = #ef4444  (red-500)
high   = #f97316  (orange-500)
medium = #eab308  (yellow-500)
low    = #22c55e  (green-500)
```

## Step Completion Rules
- Step 1→2: ≥1 brain_dump_item
- Step 2→3: ≥1 priority classified + exactly 1 is_number_one=true
- Step 3→4: ≥1 task defined
- Step 4→5: no hard requirement
- Step 5→done: all 3 reflection fields non-empty

## Design
- Dark mode only. Background: zinc-950 (#09090b). Accents: violet/indigo.
- Desktop-first (min 1280px target, graceful at 768px).
- Style reference: Linear, Notion dark.

## Build Status
- [x] Phase 0: Project scaffold + dependencies
- [ ] Phase 0b: Database schema (supabase/migrations/001_initial_schema.sql)
- [ ] Phase 1a: Auth (middleware + login + Supabase clients)
- [ ] Phase 1b: UI foundation (layout + shadcn + WizardShell)
- [ ] Phase 2: Wizard steps 1-5 + Areas
- [ ] Phase 3: Integration + Vercel deploy

## Local Dev
```bash
cp .env.example .env.local  # fill in Supabase credentials
npm install
npx supabase db push        # or run migration SQL manually
npm run dev
```
