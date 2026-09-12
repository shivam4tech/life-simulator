# Architecture

## Layer boundaries

```
UI (app/, components/, features/)
        │  may import
        ▼
domain/  data/  utils/          ← framework-free types, constants, pure helpers
        ▲
simulation/                      ← engine (Sprint 3+), also framework-free
```

Rules enforced by convention (and by where imports appear):

- `domain/`, `data/`, `simulation/`, `utils/` must never import from `app/`,
  `components/` or `features/`. They stay usable from Vitest, Node scripts and,
  later, Web Workers.
- UI reads domain types; it never redefines them.
- No `Math.random()` in business logic. Presentation-only visuals (e.g. the
  landing canvas) use a small seeded PRNG for stable rendering.

## Domain model (Sprint 1 scope)

- **`MaybeValue<T>`** (`domain/values.ts`) — `known | range | unknown |
  not-applicable | prefer-not-to-answer`. Incomplete knowledge is represented,
  never silently collapsed into one guessed number.
- **Taxonomies** (`domain/taxonomies.ts`) — education levels, employment statuses,
  occupation families, settlement types, relationship statuses, housing states,
  seniority, residency. Deliberately generic; local degree names are descriptive
  free text only.
- **`PersonProfile`** (`domain/person.ts`) — the simulation starting state.
  Sections: demographics, household, education, employment, finances, housing,
  dependents, health, behaviours (0–10 self-assessments), relationship status,
  goal weights (0–10), constraints. Almost everything is optional.
- **`MoneyAmount`** (`domain/money.ts`) — every monetary value carries
  `value + currency + period`. Bare numbers are forbidden.
- **`CountryProfile`** (`domain/country.ts`) — `identity` (factual: ISO code,
  currency, locale, languages) strictly separated from `assumptions`
  (placeholder modelling coefficients resolved from an archetype plus optional
  country overrides) and `provenance` (source, reference year, confidence).

## Country data strategy

`data/country-archetypes.ts` defines nine broad economic archetypes
(high-income-strong-welfare … lower-income-developing). `data/countries.ts`
assigns each country an archetype plus a handful of explicit overrides, and
`getCountryProfile(code)` resolves the merged assumption set.

Every resolved profile carries `PLACEHOLDER_PROVENANCE`
(`source: "internal placeholder model"`, `confidence: "placeholder"`). When real
datasets arrive (Sprint 7/9), they replace assumptions per-dimension and update
provenance — without changing the `CountryProfile` API.

## State & persistence

- `app/store/theme.ts` — dark/light, applied as a `light` class on `<html>`,
  persisted under `life-simulator:theme`.
- `app/store/profile.ts` — the active `PersonProfile`, persisted via zustand
  `persist` under `life-simulator:profile` with `version: 1`. Schema versioning
  lives in `data/demo-constants.ts`; migrations are a Sprint 2 concern.

## Engine readiness (for Sprint 3)

`simulation/index.ts` currently only pins `SIMULATION_ENGINE_VERSION`. The
boundaries it will grow into are already respected by the rest of the codebase:
pure state transforms, seeded RNG with domain sub-streams, event metadata with
causes, and a worker-friendly (no-DOM) surface.

## Testing strategy

- `tests/domain/` — value semantics, money arithmetic, taxonomy integrity.
- `tests/data/` — country registry invariants: unique codes, 0–1 bounded
  assumptions, no NaN/Infinity, placeholder provenance everywhere, override
  resolution, search.
- `tests/utils/` — Intl formatting across locales/currencies (incl. zero-decimal).
- `tests/store/` — persistence round-trip.
- `tests/ui/` — shell smoke tests through the router.

Sprint 3 adds determinism/replay, property/fuzz and engine invariant tests.
