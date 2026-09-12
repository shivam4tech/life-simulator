# LIFE SIMULATOR — Master Plan (Parts 1–3, Sprints 1–10)

## What I received
All three master prompts are read and held in context: Part 1 (Sprints 1–4: foundation → character creation → deterministic engine → first playable life), Part 2 (Sprints 5–7: relationships/family → career reinvention/Decision Lab → migration/world dynamics), Part 3 (Sprints 8–10: rewind/fork/butterfly/sensitivity → country-calibrated economics → multiverse/production polish).

Non-negotiable protocol from all three parts: **exactly ONE sprint per invocation** — determine earliest incomplete sprint from repo state, implement fully, test/lint/typecheck/build, commit `feat(sprint-N): …`, push to `git@github.com:shivam4tech/life-simulator.git`, then STOP and ask you to review before continuing. Never force-push; preserve prior work; design guided by `ibelick/ui-skills` (studied, not copied); global-first domain model; no `Math.random()` in simulation logic; no single "life score"; never present output as destiny.

## Environment findings
- `/home/shivam/Projects/life-simulator` is **completely empty** (not a git repo yet) → true greenfield, Sprint 1 is the earliest incomplete sprint.
- SSH key (`id_ed25519`) and git identity (Shivam Shukla / shivam4tech@gmail.com) exist.
- Network/remote state was unverifiable under plan-mode sandbox → verified as step 1 of execution.

## Step 0 — Repo bootstrap + save prompts (first execution actions)
1. Verify remote: `git ls-remote git@github.com:shivam4tech/life-simulator.git` (fallback to HTTPS; if the repo has hidden prior history, re-plan against it).
2. `git init` in the project dir, add SSH remote `origin`, verify Node/npm toolchain.
3. Save the three prompts verbatim as `docs/prompts/part-1-sprints-1-4.md`, `part-2-sprints-5-7.md`, `part-3-sprints-8-10.md` + a short `docs/prompts/README.md` index.
4. Commit `docs: add master development prompts (parts 1–3)` and push.

## Stack (confirmed by you)
**Vite + React + TypeScript (strict)** SPA with: Tailwind CSS v4 (token-driven design system), Radix UI primitives (dialog/tabs/slider/tooltip/select/popover — accessible by default), Zustand (app state), react-router (shell navigation), Vitest (unit + property/fuzz tests for the engine), ESLint + Prettier. Simulation engine is **pure framework-free TypeScript** (no React imports) so it runs in Web Workers and Node test runners. Persistence: versioned localStorage schema + migrations. i18n-ready formatting via `Intl` wrappers from day one.

## Sprint 1 — executes in the first run after plan approval
1. **Scaffold**: Vite React-TS app, strict tsconfig, ESLint/Prettier, Vitest, Tailwind v4, clean build pipeline.
2. **Architecture boundaries**: `src/{app,components,features,simulation,domain,data,utils,styles}` — engine, domain, data, formatting all separated from UI.
3. **Domain types**: `Person`/profile (age, country, citizenship, residency, settlement, household, education, employment, income, savings, debt, housing, dependents, skills, health, behaviours, relationships, goals, constraints) with `Known | Unknown | Range | NotApplicable | PreferNotToAnswer` value wrappers.
4. **Generic taxonomies**: education levels (none → doctorate + professional cert), employment status (student/unemployed/employed/self-employed/informal/gig/caregiver/retired/…), ~20 occupation families, settlement types, relationship statuses, housing states — extensible constants, not country-specific names.
5. **Country architecture**: ISO-identified `CountryProfile` separating identity metadata from **clearly-labelled placeholder modelling assumptions** (income level, wage distribution, price level, inflation, labour strength, housing affordability, healthcare/education access, safety net, stability, migration attractiveness, volatility) with provenance fields (`source: internal placeholder model`, confidence) so real datasets can drop in later.
6. **Currency/localisation**: currency registry (ISO code, symbol, decimals), locale-aware number/percent/compact formatting helpers — never hand-built strings, never USD-assumed.
7. **Design system** (ui-skills-informed): tokens (spacing, type scale, surfaces, fg/border hierarchy, focus, semantic success/warning/danger, chart categories, motion timings, elevation) + primitives: Button, IconButton, Toggle, SegmentedControl, Slider, Select/Combobox, NumberInput, TextInput, Tooltip, Popover, Dialog/Sheet, Tabs, Metric, Progress, InlineNotice, EmptyState, Skeleton, form field, contextual help. Dark-first, clean light mode.
8. **App shell**: nav for Home/New Life · My Life · Timeline · Futures · Scenario Lab · Assumptions (placeholders allowed beyond Home), desktop side-rail + contextual panel, adaptive mobile nav.
9. **Landing/entry**: "YOUR FUTURE IS NOT ONE LINE" start screen with lightweight canvas/SVG trajectory-branch glimpse (no fake screenshots), primary actions Create my life / Try an example.
10. **Demo profile**: one clearly-fictional person making the UI explorable without onboarding.
11. **A11y**: keyboard operability, labels, visible focus, reduced-motion, contrast, semantic HTML, no hover-only essentials.
12. **Verify**: install/run/build/lint/typecheck/tests pass, no console errors → commit `feat(sprint-1): establish life simulator foundation` → push → **STOP** with report (sprint, hash, features, test/build status, run command, manual test list, known limitations).

## Roadmap (subsequent runs, one sprint each, only on your go-ahead)
- **S2**: "Build Your Present" chaptered character-creation (You/Where/Education/Work/Money/Household/Relationships/Health/Behaviour/Goals/Review), progressive disclosure, persistence across reloads, unknown/approximate values, currency-safe country switching, warnings-over-blocking validation, 6+ fictional example profiles.
- **S3**: Deterministic engine — seeded RNG with domain sub-streams (`seed/career`, `seed/health`, …), immutable `LifeState`, staged yearly ticks, finances/career/skills/relationships/children/health mechanics driven by state, event metadata with causes, world regimes (Stable/Optimistic/Difficult/Volatile), horizons, Web-Worker Monte Carlo runner (progress/cancel, 100–10k lives), percentile distributions, representative bad/typical/good/exceptional seeds, determinism + property tests.
- **S4**: First playable experience — simulation launch screen, progress feedback, outcome bands, multi-domain life timeline with zoom/filters, representative-life switching, parallel-trajectory visualization, event inspector with engine-derived causes, age scrubber + playback, state panel, assumptions panel, responsive.
- **S5**: `PartnerState`/`ChildState` as persistent lightweight agents, partner generation + multidimensional compatibility, relationship state machine (single→dating→cohabiting→married→separated/divorced/widowed→remarriage), slow dynamics, stateful separation, child life stages with country-sensitive costs, extended-family obligations, dynamic household engine, partner careers, family timeline layer, household visualization; 11+ stress profiles.
- **S6**: Career capital + switch-distance model, Career Lab, typed `ScenarioBranch`/intervention architecture, education with opportunity costs/dropout, business pathway, job-change/hours interventions, non-LLM recommendations, baseline-vs-scenario distributions, deltas, break-even analysis, timeline forking.
- **S7**: CountryProfile expansion (raw→derived→coefficients with provenance), archetype+override presets, migration as first-class intervention (costs/feasibility/language/credential transferability/partner+children effects/network rebuild/remittances/return migration), goal-dependent destination ranking, purchasing power, evolving `WorldState` macro regimes hitting countries differently, country timeline layer, confidence labels.
- **S8**: Arbitrary rewind from true historical snapshots, deterministic forks (branchId/baseSeed/branchSeed), intervention palette, story vs distribution comparisons with common random numbers, Butterfly Mode, outcome-specific sensitivity analysis, one/two-variable experiments, branch tree + breadcrumbs.
- **S9**: Country-calibrated economic engine — `MoneyAmount` everywhere, hierarchical income/cost extrapolation with fallback ladder + confidence, occupation/seniority/experience/settlement multipliers vs country baseline, log-normal income distributions, household equivalence, purchasing power, cost basket, housing burden/stress, affordability, debt stress, savings runway, tax-deduction approximation, real-vs-nominal with separate wage/price inflation, migration salary+costs recalibration, data-provider adapters, cross-country calibration fixtures.
- **S10**: Life Multiverse screen, parallel lives, "Why did this life happen?" + counterfactual divergence explanations, chaos setting (Calm/Realistic/Volatile/Wild), contextual rare events, scenario presets + Random Life + optional challenges, versioned save slots/autosave, privacy-safe export/import, engine/model/data versioning + replay warnings, assumptions centre, polished dashboard/landing, mobile redesign, a11y/design/performance audits, final README + architecture docs, full test matrix.

## Recurring per-sprint protocol (every run)
Inspect repo/git history → earliest incomplete sprint → review relevant ui-skills guidance → implement fully → add/update tests → lint → typecheck → test → production build → manual UX inspection → update docs/assumptions → single sprint commit → push → report (sprint, hash, features, sim systems changed, test/build results, run command, manual scenarios, limitations) → **STOP and ask you to review**.

## Known risks / notes
- Remote repo content unverified until execution (sandbox blocked network) — if it already contains sprint work, I'll re-plan against it before touching anything.
- The prompt files will be committed under `docs/prompts/` — say the word at review if you'd rather keep them out of the repo.
- First run delivers Step 0 + Sprint 1 only, then stops for your review, exactly as the master prompt requires.