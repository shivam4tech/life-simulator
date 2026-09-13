# Simulation engine

The engine lives in `src/simulation/` and is **framework-free TypeScript**: no
React, no DOM — it runs identically in Web Workers, Vitest and Node. It turned
the product from a UI prototype into an actual life simulator (Sprint 3).

## Determinism contract

> same engine version + profile + config + seed ⇒ byte-identical futures

- **Base seed** (string or number) identifies a "universe".
- **Life seed** = `hash(baseSeed, lifeIndex)` — life #7 is identical whether
  you run 10 lives or 10,000.
- **Sub-streams** = `hash(lifeSeed, year, domain)` for each domain
  (`economy, career, education, health, relationships, family, life-events`).
  Adding a draw inside one domain never scrambles unrelated domains' histories.
- PRNG: mulberry32; hashes: xmur3/splitmix-style mixing (`simulation/rng.ts`).
- Event ids are derived from `(lifeSeed, year, order)` — never a global counter.
- Everything stochastic in the engine flows through `rngFor`; `Math.random()`
  is banned in engine code (the only allowed use is the UI's "new random seed"
  button, which is presentation, not simulation).
- The contract is enforced by tests: byte-equal snapshots/events for equal
  inputs, divergence for different seeds, and reproducible aggregates.

## Yearly tick pipeline (`simulation/engine.ts`)

Order encodes causal assumptions and is documented in the source:

1. time progression → 2. world context (macro year) → 3. country context →
4. education events → 5. career progression → 6. relationship transitions →
7. children → 8. health → 9. financial consequences → 10. derived metrics →
11. immutable year snapshot (+ deterministic event ids).

A run stops at the horizon, a target age, or the engine age limit (100).
Each year produces a `YearSnapshot` (compact numeric record + that year's
events with signed, human-readable causes: `"+ 7 years experience"`,
`"- recession year"`). No giant state cloning — history *is* the snapshots.

## Model overview (all coefficients placeholder)

| Subsystem | Shape |
| --------- | ----- |
| Income | country median × occupation × seniority × education × settlement × personal anchor; user-entered income always pins the personal anchor; unknown income is sampled log-normal per life |
| Costs | country price level × household scale × personal cost anchor; children add stage-dependent costs; remittances supported |
| Career | promotion / job change / job loss / re-employment hazards driven by experience phase, skills, ambition, stability, labour market, sector recession exposure; salary compression above ~2× local market |
| Retirement | hazard ramps from 60, more likely with runway; pension scales with safety-net strength, indexed to inflation |
| Relationships | state machine single → dating → committed → cohabiting → married (+separated/divorced/widowed); hazards from satisfaction, stress, preferences; partner income joins the household |
| Children | strictly gated by stated preference and fertility window; over-desired suppression; children persist and age |
| Health | index 0–100 with age drift + lifestyle; mild/major shocks with country-sensitive out-of-pocket costs; chronic-constraint possibility; no diagnoses |
| World | four scenarios (optimistic/stable/difficult/volatile) with growth, inflation (incl. spikes), recession, investment-return regimes; nominal vs real tracked via an inflation index |

All constants live in `simulation/assumptions.ts` with
`ASSUMPTIONS_PROVENANCE` (`source: internal placeholder model`) — real datasets
replace values per-coefficient later without touching engine APIs.

## Monte Carlo runner (`simulation/runner.ts` + `worker.ts` + `client.ts`)

- Chunked batches (250 lives) with `onProgress` and an abort signal.
- Memory: lives stream into compact per-year buffers; only `(seed, composite,
  startAge, years)` triplets are retained; the four **representative lives**
  (actual runs nearest each band's characteristic percentile) are re-simulated
  from their seeds at the end — replayable and shareable.
- The UI calls `runSimulationAsync`, which runs a module Web Worker and falls
  back to chunked main-thread execution where workers don't exist.

## Outcome classification

Bands (**difficult / typical / good / exceptional** = bottom 20% / middle 60% /
next 15% / top 5% of *this universe*) rank lives by the **user's goal-weighted
alignment composite** — a comparison within their possibility space, never a
universal life score. Objective dimensions (financial security, career, health,
family, romance, freedom, stability) are computed separately and displayed
alongside.

## Persistent agents (Sprint 5)

- **`PartnerState`** — generated once per relationship from the meeting
  event's seed context (same seed ⇒ same partner): age, work and income
  (deliberately below the user's on average), personality, children/marriage
  preferences, migration willingness (for Sprint 7) and five-dimension
  compatibility. Partners age, earn, lose work, reduce hours for infants and
  retire; their income flows into household finances. Slow-moving dynamics
  (satisfaction, stability, financial pressure, time pressure) drift toward
  compatibility-derived targets — no year-to-year oscillation.
- **`ChildState`** — persists from arrival (birth or explicit adoption route)
  to independence: stage ladder, education stage, placeholder health-burden
  bands, living arrangement. Adult children leave home gradually; custody
  after separation defaults to staying with the user, with support payments
  otherwise. Child costs are country-sensitive (benefit discount by safety
  net, burden multipliers).
- **Household & extended family** — combined incomes, custody support,
  remittance growth, and elder-care obligations that arrive mid-life
  (care level 0–2 with cost + time-pressure effects). Separation/divorce
  hazards combine satisfaction, stability, unemployment, debt, time pressure
  and compatibility — never a single cause.

## Decision Lab (Sprint 6)

- **Occupation model** (`careers.ts`): all 20 families carry modelling
  attributes — education gate, credential barrier, skill demand, physical
  intensity, remote compatibility, income ceiling, stability, automation
  exposure, mobility, entrepreneurial applicability, international
  transferability, growth outlook (placeholder coefficients).
- **Career capital**: network, accumulated capital and management skill grow
  with work and survive job loss and failed ventures — the "startup failed,
  founder improved" loop is explicit (failure adds management + network while
  money is lost).
- **Switch distance**: `assessSwitch` derives honest banded classifications
  (easy / moderate / difficult / major-retraining / credential-gated) from the
  models, with reasons — no fake percentages.
- **Interventions** (`interventions.ts` + `apply.ts`): typed commands applied
  at the fork (currently "now"; Sprint 8 reuses them on restored snapshots).
- **Paired comparison** (`scenario.ts`): baseline and scenario lives share
  (seed, lifeIndex) so per-domain streams deliver identical macro shocks —
  deltas mean "same life, except…". `comparison.ts` computes deltas, the
  break-even year on median net worth paths, and the share of paired lives
  ahead at the horizon.
- **Recommendations** (`recommendations.ts`): rule-based reachability ranking
  into strong / longer-term / ambitious tiers with explicit reasons.

## Migration & world dynamics (Sprint 7)

- **CountryProfile** gained employment-protection, informality, entrepreneurship
  and migration dimensions (accessibility, credential recognition, integration
  support) — archetype baselines with country overrides, provenance-labelled.
- **World regimes**: a seeded Markov chain over expansion / normal / slowdown /
  recession / inflation-shock / tech-disruption / geopolitical-stress, plus
  rare global events (pandemic-like, conflict, financial crisis, commodity
  boom, tech shifts) at low frequency. Countries respond by archetype
  (volatile economies amplify inflation shocks, resource-heavy catch commodity
  booms, sectors win/lose by regime).
- **Migration** (`migrations.ts`): deterministic feasibility (credentials,
  language, savings, age, openness — explicitly an abstraction, not visa
  advice), moving costs by family size, purchasing-power balance conversion,
  destination-market salary recalibration, partner willingness, network shock
  and integration regrowth, remittances, and return migration when moves
  struggle.
- **Destination explorer** (`destinations.ts`): goal-dependent ranking across
  five priority sliders; cards carry banded fits, why-it-appears reasons,
  frictions and explicit "Model confidence: placeholder" labels.

## Rewind, forks & sensitivity (Sprint 8)

- **Rewind** (`engine.rewindTo`): reconstructs the exact historical state at
  any year index by deterministic replay from the seed — `rewindTo(n)` is the
  state after n ticks; snapshot i corresponds to rewindTo(i+1). Not an
  approximation: the engine is a pure function of its inputs.
- **Forks** (`forks.ts`): `createFork` rewinds, applies interventions, and
  continues with the SAME lifeSeed — shared history before the fork, identical
  shocks after (common random numbers). Branches carry parent links,
  breadcrumbs and a forkState snapshot captured before simulation (the
  simulation mutates the working state). Nested forks chain from other forks.
- **Butterfly Mode**: six curated small changes; deltas vs the paired original
  measured at 5/10/horizon years — direct levers show early, downstream
  effects accumulate. Nothing manufactured.
- **Sensitivity** (`sensitivity.ts`): eight dimensions × discrete levels ×
  small Monte Carlo each; the spread of an outcome's median across levels is
  the dimension's model sensitivity. Outcome-specific (net worth / alignment /
  health / runway), cancellable, deterministic.

## Life insights (`simulation/insights.ts`)

`deriveLifeDrivers` powers "Why did this life happen?" — it ranks the model
systems (career, savings, world, relationships, health, family, late shocks)
that visibly moved a trajectory, citing only evidence present in the run
output (event counts, snapshot deltas). `derivePressures` computes the
"top active pressures" for a given age. Both are deterministic and tested.

## Testing (`tests/simulation/engine.test.ts`)

Byte-level determinism, seed divergence, per-life identity independent of run
size, age progression, net-worth identity, real-vs-nominal consistency,
retirement behaviour, child-preference gating, event validity, band sums,
progress/cancellation, a 2,000-life performance bound, quantile correctness,
and six extreme-but-valid fuzz profiles (all finite, no NaN/Infinity, non-negative
balances).
