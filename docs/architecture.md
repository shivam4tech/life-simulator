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
  lives in `data/demo-constants.ts`; migrations are handled from Sprint 2 onward.
- `app/store/onboarding.ts` — the in-progress character-creation draft plus the
  current chapter index, persisted under `life-simulator:onboarding`. A reload
  resumes exactly where the user left off. `complete()` assigns a real id,
  pushes the draft into the profile store, and resets the draft.

## Validation philosophy (`domain/validation.ts`)

`validateProfile` returns `error | warning | info` issues. Only genuinely
impossible states block saving (negative money, impossible ages, missing
country); unusual-but-real lives produce warnings that link back to the
offending chapter; contextual notes are `info`. This is deliberate: reality is
strange and the simulator must not overvalidate people into a narrow template.

## Currency safety on country change

Money is captured as `MoneyAmount { value, currency, period }`. Changing the
country of residence never silently converts existing amounts — they keep their
original currency, and the Money chapter surfaces a notice when entered
currencies diverge from the new country's (`moneyCurrenciesInUse`).

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
