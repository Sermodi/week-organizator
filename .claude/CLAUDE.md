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
- [x] Phase 0b: Database schema (supabase/migrations/001_initial_schema.sql)
- [x] Phase 1a: Auth (middleware + login + Supabase clients)
- [x] Phase 1b: UI foundation (layout + shadcn + WizardShell)
- [x] Phase 2: Wizard steps 1-5 + Areas
- [ ] Phase 3: Integration + Vercel deploy

## Local Dev
```bash
cp .env.example .env.local  # fill in Supabase credentials
npm install
npx supabase db push        # or run migration SQL manually
npm run dev
```

---

## Codebase Map

### Route tree
```
app/
  page.tsx                          → redirect to /dashboard
  layout.tsx                        → lang=es, Geist font, Toaster
  (auth)/
    layout.tsx                      → plain layout (no sidebar)
    login/page.tsx                  → 'use client', useActionState(login)
  auth/callback/route.ts            → Supabase OAuth callback
  (app)/
    layout.tsx                      → auth guard + Sidebar
    dashboard/page.tsx              → get_or_create_week RPC + progress
    areas/
      page.tsx                      → fetch areas → AreasClient
      AreasClient.tsx               → CRUD inline, 10 color presets
    history/page.tsx                → past weeks + reflection snippets
    settings/page.tsx               → placeholder
    plan/
      page.tsx                      → redirect to current step
      [weekId]/
        step1/page.tsx → Step1Client  brain dump + 20min timer
        step2/page.tsx → Step2Client  scoring slider + classification + #1 star
        step3/page.tsx → Step3Client  verb+object+victory per priority
        step4/page.tsx → Step4Client  7-day grid, modal block creator
        step5/page.tsx → Step5Client  3 reflection fields + star rating
proxy.ts                            → Supabase session refresh + auth guard
```

### Server Actions (`lib/actions/`)
| File | Exports |
|------|---------|
| `auth.actions.ts` | `login`, `logout` |
| `brain-dump.actions.ts` | `createBrainDumpItem`, `deleteBrainDumpItem`, `updateBrainDumpItemArea`, `completeStep1` |
| `priority.actions.ts` | `upsertPriority` (select+insert/update, returns `{id}`), `setNumberOnePriority`, `completeStep2` |
| `task.actions.ts` | `createTask`, `deleteTask`, `completeStep3` |
| `time-block.actions.ts` | `createTimeBlock`, `deleteTimeBlock`, `completeStep4` |
| `reflection.actions.ts` | `upsertReflection`, `completeStep5` |
| `area.actions.ts` | `createArea`, `updateArea`, `deleteArea` |

### Database tables
```
auth.users (Supabase managed)
  └── users_profile       id, display_name, avatar_url
  └── areas               id, user_id, name, color
  └── weeks               id, user_id, week_start DATE, current_step INT,
  │                       completed_steps INT[], status
  │   UNIQUE(user_id, week_start)
  └── brain_dump_items    id, week_id, user_id, content, area_id, position
  └── priorities          id, week_id, user_id, brain_dump_item_id, title,
  │                       area_id, score INT, classification ENUM,
  │                       is_number_one BOOL, priority_level TEXT
  │   UNIQUE(week_id, brain_dump_item_id)  ← migration 002
  └── tasks               id, week_id, user_id, priority_id, action_verb,
  │                       concrete_object, victory_condition, area_id,
  │                       priority_level, status
  └── time_blocks         id, week_id, user_id, task_id, day_of_week INT,
  │                       start_time TIME, end_time TIME, block_type ENUM,
  │                       label TEXT
  └── reflections         id, week_id, user_id, what_worked, what_didnt,
                          what_to_change, overall_rating INT
      UNIQUE(week_id)
```

DB function: `get_or_create_week(p_user_id, p_week_start) → UUID`

### Key types (`types/index.ts`)
```
PriorityLevel   = 'top' | 'high' | 'medium' | 'low'
WeekStatus      = 'active' | 'completed' | 'archived'
BlockType       = 'task' | 'fixed_commitment' | 'deep_work' | 'buffer'
Classification  = 'top_priority' | 'essential' | 'not_essential'
Area, Week, BrainDumpItem, Priority, Task, TimeBlock, Reflection
```

### Utilities
| Path | Contents |
|------|----------|
| `lib/utils/week.ts` | `getWeekStartString`, `formatWeekRange` (es locale), `getWeekDays`, `DAY_NAMES`, `DAY_NAMES_FULL` |
| `lib/utils/priority.ts` | `PRIORITY_COLORS`, `PRIORITY_BG`, `PRIORITY_BORDER`, `PRIORITY_LABELS`, `scoreToPriorityLevel` |
| `lib/supabase/client.ts` | `createBrowserClient` (client components) |
| `lib/supabase/server.ts` | `createServerClient` with async cookies (server components / actions) |

### Known fixes / gotchas
- `proxy.ts` not `middleware.ts` — Next.js 16 renamed the convention
- `upsertPriority` uses select+insert/update instead of Supabase upsert because the unique constraint on `(week_id, brain_dump_item_id)` was added in migration 002 (run it if missing)
- Step2 star (⭐): `upsertPriority` must return `{id}` so the client stores it; `handleSetNumberOne` needs that id to call `setNumberOnePriority` — without it the star never persists
- Custom verbs in Step3 saved to `localStorage` key `wo_custom_verbs`
- `scoreToPriorityLevel`: 75–100 → top, 50–74 → high, 25–49 → medium, 0–24 → low
