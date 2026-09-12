# Life Simulator

> Give us the life you are living now.
> We show you the lives that could plausibly grow out of it.

A web-based **life simulator**: describe your present circumstances, then explore
thousands of deterministic, seeded possible futures — bad, typical, good,
exceptional — with explainable turning points and country-aware economics.

This is a simulation game built on explicit models, not a horoscope: outputs are
modelled possibility spaces, never predictions or advice.

## Status — Sprint 1 of 10 complete

| Sprint | Scope | Status |
| ------ | ----- | ------ |
| 1 | Foundation: architecture, domain model, design system, shell, landing, demo profile | ✅ done |
| 2 | "Build Your Present" character-creation onboarding | next |
| 3 | Deterministic life simulation engine (seeded Monte Carlo) | |
| 4 | First fully playable life experience (timeline, outcome bands) | |
| 5 | Relationships, partners, children & household systems | |
| 6 | Career reinvention, education & Decision Lab | |
| 7 | Migration, country comparison & world dynamics | |
| 8 | Rewind, forks, butterfly mode & sensitivity | |
| 9 | Country-calibrated income, money & economic reality | |
| 10 | Life Multiverse, explainability & production hardening | |

The full product brief lives in [docs/prompts/](./docs/prompts).

## Tech stack

- **Vite + React 19 + TypeScript (strict)** — client-side SPA
- **Tailwind CSS v4** — token-driven design system (dark-first, clean light mode)
- **Radix UI primitives** — accessible behaviour for sliders, dialogs, tabs, selects…
- **Zustand** — app state with versioned localStorage persistence
- **Vitest + Testing Library (happy-dom)** — unit, data-integrity and UI tests
- **oxlint** — linting

The simulation engine (Sprint 3+) is and will remain **framework-free TypeScript**
under `src/simulation/` and `src/domain/`, runnable in Web Workers and Node
without any DOM dependency.

## Getting started

```bash
npm install
npm run dev        # start dev server
```

| Command | Purpose |
| ------- | ------- |
| `npm run dev` | Vite dev server |
| `npm run build` | typecheck + production build (`dist/`) |
| `npm run preview` | serve the production build locally |
| `npm test` | run the test suite once |
| `npm run test:watch` | watch mode |
| `npm run lint` | oxlint |
| `npm run typecheck` | `tsc -b` strict project check |

## Architecture at a glance

```
src/
  app/          shell (nav, theme), routes, stores
  components/   design-system primitives (Button, Slider, Combobox, Metric…)
  features/     product surfaces (landing, profile, assumptions, placeholders)
  domain/       framework-free types + pure helpers (person, country, money, taxonomies)
  data/         country registry (identity ≠ assumptions), archetypes, fictional demo profiles
  simulation/   deterministic life engine (reserved — lands in Sprint 3)
  utils/        formatting (Intl-based), class merging
  styles/       design tokens + global styles
tests/          vitest suite (domain, data integrity, formatting, store, shell)
docs/           architecture & design-system notes, master prompts
```

Deeper notes: [docs/architecture.md](./docs/architecture.md) ·
[docs/design-system.md](./docs/design-system.md)

## Product principles (non-negotiable)

1. **Global first** — no country's defaults are universal; taxonomies are generic.
2. **Country matters** — multidimensional `CountryProfile`; identity metadata is
   strictly separated from placeholder modelling assumptions (provenance-tracked).
3. **Deterministic randomness** — same seed + profile + assumptions = same future.
4. **Life is path-dependent** — events change future probabilities.
5. **No single life score** — multidimensional, goal-weighted outcomes.
6. **Explainability** — the engine records why things happened.

Everything shown is a modelled scenario. It is not financial, medical, legal,
immigration or psychological advice.
