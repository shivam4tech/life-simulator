# LIFE SIMULATOR — MASTER DEVELOPMENT PROMPT

## PART 1 OF 3 — SPRINTS 1–4

### Foundation → Global Character Creation → Deterministic Simulation Engine → First Playable Life

You are the senior product engineer, simulation engineer, interaction designer, and frontend architect responsible for building a serious web-based **Life Simulator**.

This is not a landing-page prototype.

This is not a static financial calculator.

This is not a questionnaire that outputs generic advice.

You are building the foundation of a long-lived interactive simulation game in which a person describes their present circumstances and the system simulates many possible future lives.

The long-term product concept is:

> Give us the life you are living now.
> We show you the lives that could plausibly grow out of it.

The experience should feel somewhat like a modern, data-driven astrologer or fortune-reading experience, but the machinery underneath must be explicit simulation, demographic reasoning, economics, behavioural state transitions, seeded randomness, scenario modelling, and transparent assumptions rather than mystical claims.

The user's future is never presented as destiny.

The product should show:

* plausible futures,
* distributions,
* representative life paths,
* bad / average / good / exceptional outcome bands,
* uncertainty,
* causal chains,
* major turning points,
* randomness,
* decisions,
* path dependence,
* and eventually alternative lives produced by different choices.

The experience must feel like an **interactive simulation game**, not enterprise analytics software.

---

# REPOSITORY

The canonical application repository is:

```bash
git@github.com:shivam4tech/life-simulator.git
```

You are authorized to work directly in this repository.

Before making changes:

1. inspect the repository completely;
2. understand its current architecture;
3. inspect package scripts and dependencies;
4. inspect existing UI and domain code;
5. inspect existing tests;
6. inspect README/documentation;
7. inspect git status and recent commits;
8. preserve useful existing work;
9. do not unnecessarily rewrite working code;
10. determine the correct development command yourself.

If the local project is not connected to the correct remote, configure the remote appropriately.

Use SSH for the target GitHub repository where possible.

Before committing, always verify:

```bash
git remote -v
git status
```

Never force-push.

Never rewrite published history.

Never delete user work just because you prefer another architecture.

---

# DESIGN REFERENCE — REQUIRED

Use this repository as an important design-engineering reference:

https://github.com/ibelick/ui-skills

Do not merely glance at it.

Study the relevant UI Skills guidance before implementing important interface systems.

Use its playbook and relevant skills for matters such as:

* baseline UI quality,
* interaction design,
* visual hierarchy,
* forms,
* sliders,
* buttons,
* navigation,
* motion,
* responsive layouts,
* accessibility,
* typography,
* density,
* feedback,
* state transitions,
* dashboards,
* empty states,
* loading states,
* information architecture,
* visual polish.

You may clone/reference the repository outside the application repository if useful.

Do NOT blindly copy its visual appearance.

Use it to improve design judgement.

The Life Simulator should develop its own identity.

---

# VISUAL / EXPERIENCE DIRECTION

The simulator should feel like a mixture of:

* strategy game,
* scientific instrument,
* alternate-history simulator,
* personal dashboard,
* interactive timeline,
* probabilistic oracle.

Avoid making it look like:

* a bank dashboard,
* a generic SaaS admin panel,
* a cryptocurrency dashboard,
* a tax calculator,
* a childish game,
* a horoscope website,
* an Excel sheet with gradients.

Aim for:

* premium dark-first presentation,
* excellent light mode if the architecture allows it cleanly,
* strong typography,
* high information clarity,
* restrained decoration,
* subtle depth,
* meaningful motion,
* excellent hover states,
* tactile controls,
* useful micro-interactions,
* responsive layout,
* keyboard accessibility,
* reduced-motion support.

A user should feel curious enough to keep interacting with the simulation.

Numbers should feel alive.

The timeline should feel explorable.

Changes to sliders should visibly alter projections.

Running a simulation should have satisfying visual feedback.

Do not use excessive glassmorphism.

Do not make everything a card.

Do not put every piece of information inside rounded rectangles.

Do not overuse huge border radii.

Do not make all sections vertically stacked boxes.

Use structure, spacing, typography, dividers, plotting, rails, tracks, overlays, panels, and contextual controls intelligently.

---

# PRODUCT PRINCIPLES

These principles are non-negotiable.

## 1. GLOBAL FIRST

The simulator is intended for people anywhere in the world.

Never assume:

* United States,
* India,
* Europe,
* Western family structures,
* four-year university degrees,
* dollar-denominated income,
* a particular healthcare model,
* a specific retirement system,
* nuclear families,
* one definition of marriage,
* home ownership,
* salaried employment.

Use globally meaningful abstractions.

Examples:

Instead of hardcoding:

```text
B.Com
B.Tech
A-levels
GED
Abitur
```

model education through generic levels such as:

* no formal education,
* primary/basic,
* lower secondary,
* upper secondary,
* post-secondary vocational,
* short-cycle tertiary,
* bachelor-equivalent,
* master-equivalent,
* doctoral/professional doctorate,
* professional qualification,
* other.

Country-specific terminology can later map onto the universal schema.

Likewise, occupations should use occupation families and industries, not only country-specific job titles.

---

## 2. COUNTRY MATTERS

Country is not decoration.

A person's trajectory must eventually depend on country-level context including things such as:

* wage distributions,
* cost of living,
* inflation,
* unemployment,
* labour-market mobility,
* social protection,
* healthcare accessibility,
* housing affordability,
* education accessibility,
* taxation,
* childcare,
* demographic patterns,
* migration possibilities,
* economic volatility,
* political/institutional stability.

Do not reduce countries to one simplistic good/bad score.

Design a multidimensional `CountryProfile` abstraction.

Actual high-quality country datasets can be introduced progressively.

The architecture created now must support them cleanly.

---

## 3. DETERMINISTIC RANDOMNESS

Life contains random shocks, but simulation reproducibility is critical.

All stochastic behaviour must ultimately be generated through a seeded pseudo-random generator.

Same:

* profile,
* assumptions,
* decisions,
* simulation version,
* seed

must produce the same simulated life.

Never use uncontrolled `Math.random()` throughout business logic.

Create a deterministic RNG abstraction.

---

## 4. LIFE IS PATH-DEPENDENT

Events must modify future probabilities.

Example:

A failed business should not simply become an isolated timeline card.

It might alter:

* savings,
* debt,
* skills,
* entrepreneurial experience,
* confidence,
* stress,
* network,
* employability,
* risk tolerance.

Later outcomes should derive from the resulting state.

---

## 5. NO SINGLE "LIFE SCORE"

Never collapse the entire human life into one universal score.

Use dimensions such as:

* finances,
* career,
* health,
* relationships,
* family,
* freedom,
* stability,
* knowledge,
* adventure,
* purpose/meaning,
* leisure,
* social connection.

Eventually allow the player to decide how much each matters.

---

## 6. EXPLAINABILITY

Every important simulated transition should eventually be explainable.

The architecture must preserve reasons such as:

```text
promotion probability increased because:
+ experience
+ skill progression
+ industry growth
- weak local labour market
- economic slowdown
```

The UI does not need to expose every formula immediately, but the engine must not become an opaque collection of random events.

---

# GLOBAL DOMAIN MODEL

Design a clean type-safe domain model that can grow toward approximately this hierarchy:

```text
Simulation
│
├── WorldState
│   ├── economy
│   ├── technology
│   ├── geopolitics
│   ├── climate pressure
│   └── global shocks
│
├── CountryState
│   ├── economy
│   ├── labour
│   ├── welfare
│   ├── healthcare
│   ├── housing
│   ├── education
│   ├── demographics
│   ├── institutions
│   └── migration
│
├── RegionalContext
│
├── HouseholdState
│   ├── household income
│   ├── dependents
│   ├── housing
│   ├── family obligations
│   └── household expenses
│
├── PersonState
│   ├── demographics
│   ├── education
│   ├── career
│   ├── skills
│   ├── finances
│   ├── health
│   ├── behaviours
│   ├── relationships
│   ├── social network
│   ├── goals
│   └── constraints
│
├── PartnerState
├── ChildState[]
├── Decision[]
├── Event[]
├── ScenarioAssumptions
└── SimulationMetadata
```

Do not over-engineer every future subsystem immediately.

But establish boundaries that allow them to be added without rebuilding the application.

---

# EXECUTION PROTOCOL — EXTREMELY IMPORTANT

This Part 1 contains **four sprints**.

You MUST NOT execute all four sprints in one invocation.

You must work on **exactly ONE sprint per run**.

Determine the earliest incomplete sprint from repository state and commit history.

For that sprint:

1. inspect current state;
2. implement the sprint completely;
3. run tests;
4. run lint/typecheck;
5. build the application;
6. fix problems you discover;
7. perform basic UX inspection;
8. update documentation where necessary;
9. commit everything related to that sprint;
10. push the commit to:

```bash
git@github.com:shivam4tech/life-simulator.git
```

Then STOP.

Do not automatically begin the next sprint.

At the end, tell me:

* sprint completed,
* commit hash,
* major features completed,
* tests/build status,
* important things I should manually test,
* exact command I should run,
* any known limitations.

Then ask me to run/review the application before continuing.

Only continue to the next sprint after I explicitly tell you to proceed.

---

# COMMIT FORMAT

Use clear commits such as:

```text
feat(sprint-1): establish life simulator foundation
feat(sprint-2): build global life profile onboarding
feat(sprint-3): implement deterministic simulation engine
feat(sprint-4): add playable life timeline and outcome explorer
```

Each sprint should result in one principal clean commit.

Small fix commits are acceptable only if genuinely required after the primary commit, but prefer a clean sprint-level commit.

Push after every completed sprint.

---

# SPRINT 1 — PRODUCT FOUNDATION + DESIGN SYSTEM + DOMAIN ARCHITECTURE

## Goal

Turn the repository into a robust foundation for the full product.

By the end of this sprint, the app must already feel visually intentional and contain a navigable shell for the simulation experience.

Do not build the entire simulator yet.

---

## 1. Repository audit

Inspect everything first.

Document important architectural decisions.

Determine:

* framework,
* rendering model,
* state management,
* router,
* styling strategy,
* testing tools,
* persistence strategy,
* chart/visualization dependencies,
* existing component primitives.

If something already exists and is good, preserve it.

Only introduce dependencies with clear justification.

Prefer a maintainable dependency surface.

---

## 2. Architecture

Create sensible boundaries for:

```text
app/
components/
features/
simulation/
domain/
data/
utils/
styles/
tests/
```

Adapt naming to the existing framework rather than forcing this exact structure.

Separate:

* UI,
* simulation engine,
* domain models,
* seed data,
* persistence,
* formatting.

Simulation code should be usable independently from the visual components.

---

## 3. Domain types

Create strongly typed definitions for at least:

### Person

* id
* age
* sex/gender modelling field where appropriate
* country of residence
* citizenship(s)
* residency status
* region
* settlement type
* household
* education
* employment
* income
* savings
* debt
* housing
* dependents
* skills
* health
* behaviours
* relationship state
* goals
* constraints

Do not require every field.

Support:

```text
known value
unknown
estimated/range
not applicable
prefer not to answer
```

where appropriate.

---

## 4. Generic taxonomies

Create extensible constants/types for:

### Education level

* none
* primary/basic
* lower secondary
* upper secondary
* vocational/post-secondary
* short-cycle tertiary
* bachelor-equivalent
* master-equivalent
* doctorate/professional doctorate
* professional certification
* other

### Employment status

* student
* unemployed
* employed
* self-employed
* business owner
* informal work
* gig/freelance
* caregiver
* retired
* unable to work
* other

### Occupation family

Create a sensible broad taxonomy such as:

* administration
* agriculture
* arts/media
* business
* construction
* education
* engineering
* finance
* healthcare
* hospitality
* law/public policy
* manufacturing
* sales/marketing
* science/research
* skilled trades
* technology
* transport/logistics
* service work
* military/security
* other

Do not overfit this list to one economy.

### Settlement

* rural
* small town
* secondary city
* major city
* global/megacity

### Relationship status

Use globally useful broad concepts.

### Housing state

Support:

* family household,
* rent,
* own outright,
* mortgage,
* shared housing,
* employer housing,
* temporary/informal,
* other.

---

## 5. Country architecture

Build a country abstraction with:

```ts
CountryProfile
```

capable of eventually storing dimensions such as:

* income level,
* wage distribution,
* price level,
* inflation regime,
* labour-market strength,
* unemployment,
* housing affordability,
* healthcare access,
* education access,
* social safety net,
* political/institutional stability,
* migration attractiveness,
* economic volatility.

DO NOT pretend temporary seed values are authoritative real-world statistics.

Separate:

```text
country identity metadata
```

from:

```text
simulation assumptions / modelling data
```

Use clearly marked seed/demo modelling assumptions for now where actual data integration has not yet happened.

Structure the system so real public datasets can replace them later.

---

## 6. Currency and localisation primitives

Never assume USD.

Introduce:

* ISO-like country identifiers,
* currency configuration,
* locale-aware formatting,
* percentage formatting,
* compact number formatting,
* configurable currency display.

Make the architecture ready for localisation/i18n even if only English ships initially.

Avoid concatenating manually formatted currency strings throughout components.

---

## 7. Design system

Use UI Skills guidance.

Establish reusable tokens for:

* spacing,
* typography,
* surfaces,
* foreground hierarchy,
* border hierarchy,
* focus states,
* semantic success/warning/danger,
* chart/trajectory categories,
* animation timing,
* shadows/elevation where useful.

Create excellent primitives for:

* Button
* IconButton
* Toggle
* SegmentedControl
* Slider
* RangeSlider if justified
* Select / Combobox
* NumberInput
* TextInput
* Tooltip
* Popover
* Dialog / Sheet
* Tabs
* Metric
* Progress
* InlineNotice
* EmptyState
* Skeleton/loading
* accessible form field
* contextual help

Do not build primitives already provided well by the existing stack unless customization requires it.

---

## 8. Application shell

Create the visual shell for the simulator.

Possible information architecture:

```text
Life Simulator
├── Home / New Life
├── My Life
├── Timeline
├── Futures
├── Scenario Lab
└── Assumptions
```

Some destinations can remain disabled/placeholder in Sprint 1.

The shell should already make the product feel substantial.

Consider:

Desktop:

* restrained side rail or compact navigation,
* main simulation canvas,
* contextual side panel.

Mobile:

* adaptive navigation,
* avoid tiny desktop sidebar squeezed into viewport.

---

## 9. Landing / simulation entry

Create an excellent start screen.

Avoid marketing-site bloat.

The primary action should immediately invite experimentation.

Something conceptually like:

```text
YOUR FUTURE IS NOT ONE LINE.

Build your present state.
Simulate the lives that could grow from it.

[Create my life]
[Try an example]
```

Include a small visual glimpse of possible timelines, particles, trajectories, or branches using lightweight frontend rendering.

Do not use fake screenshots.

---

## 10. Demo profile

Create at least one fully fictional demo person so the interface can be explored without onboarding.

Make all demo data clearly fictional.

---

## 11. Accessibility

At minimum:

* keyboard-operable controls,
* correct labels,
* visible focus,
* reduced-motion preference,
* reasonable contrast,
* semantic HTML,
* no hover-only essential information.

---

## 12. Sprint 1 acceptance criteria

Sprint 1 is complete only when:

* project installs cleanly,
* app runs,
* production build passes,
* lint passes,
* typecheck passes,
* tests pass,
* responsive shell works,
* design system exists,
* major domain types exist,
* country abstraction exists,
* currency/localisation primitives exist,
* demo profile exists,
* start screen works,
* no obvious console errors exist.

Then:

COMMIT.

PUSH.

STOP.

Ask me to run it.

---

# SPRINT 2 — GLOBAL CHARACTER CREATION / "BUILD YOUR PRESENT"

## Goal

Build the first major interactive experience:

> Create the current state from which the user's possible lives will be simulated.

This should feel closer to **character creation in a strategy/RPG game** than filling a government form.

Do not dump 50 fields onto one page.

Use progressive disclosure.

Make it satisfying.

---

# 1. Character creation structure

Design an onboarding flow broken into meaningful chapters.

Possible progression:

```text
01 You
02 Where you live
03 Education
04 Work
05 Money
06 Household
07 Relationships
08 Health
09 Behaviour
10 Goals
11 Review
```

The exact navigation can evolve based on good UX judgement.

Show visible progress without implying false precision.

Users must be able to:

* go backward,
* edit earlier sections,
* skip optional fields,
* choose "I don't know",
* enter approximate values,
* see why certain information is useful.

Persist progress locally.

A reload should not destroy completed onboarding.

---

# 2. Demographics

Capture:

* age,
* country of residence,
* citizenship(s),
* residency category where relevant,
* region/state/province optionally,
* city optionally,
* settlement type,
* sex/gender-related modelling inputs only where simulation relevance is justified.

Do not make culturally narrow assumptions.

---

# 3. Education

Use generic categories.

Capture:

* highest education level,
* current study status,
* field of study,
* qualification completed/incomplete,
* years since completion,
* institution selectivity only as an optional broad self-assessment,
* professional credentials,
* willingness to study/retrain.

Do not require country-specific degree names.

Allow optional free-text local qualification name as descriptive metadata while mapping it to a universal education level.

---

# 4. Career

Capture:

* employment state,
* occupation family,
* industry,
* seniority,
* years of experience,
* annual or monthly income,
* working hours,
* job stability self-assessment,
* career satisfaction,
* remote compatibility,
* willingness to change jobs,
* willingness to change careers,
* entrepreneurial interest.

Use sliders where they make conceptual sense.

Do NOT use sliders for everything.

Provide useful labels such as:

```text
Low
Moderate
High
```

alongside continuous values when appropriate.

---

# 5. Money

Capture:

* income,
* savings,
* investments,
* debt,
* housing cost,
* essential monthly expenses,
* discretionary spending,
* emergency savings,
* major assets optionally.

Use local currency.

If the user chooses a different country, the currency should update appropriately while protecting already entered values from destructive conversion.

Think through this interaction carefully.

Allow approximate values.

Support "unknown".

---

# 6. Household and obligations

Capture:

* living arrangement,
* household size,
* contributors to household income,
* dependents,
* financial support sent to family,
* elder-care obligations,
* other care responsibilities,
* family financial support available to the user,
* rough household financial resilience.

This is especially important for global applicability.

Do not assume everyone lives independently at 18.

---

# 7. Relationships

Capture:

* relationship status,
* desire for long-term partnership,
* marriage preference where relevant,
* current relationship satisfaction if partnered,
* preference for children,
* desired number of children optionally,
* approximate desired timing,
* openness to adoption optionally.

Do not infer sexuality.

Do not treat marriage as mandatory.

Allow users to state that relationships/family are not goals.

---

# 8. Health

Keep it useful without pretending to perform medicine.

Capture broad self-assessments such as:

* overall health,
* activity level,
* sleep,
* smoking,
* alcohol,
* long-term health constraints optionally,
* healthcare access,
* mental wellbeing self-assessment optionally.

Clearly describe these as simulation inputs rather than medical diagnosis.

---

# 9. Behaviour / personality

Capture behavioural characteristics relevant to simulation:

* risk tolerance,
* discipline,
* patience,
* persistence,
* adaptability,
* sociability,
* stress tolerance,
* novelty seeking,
* career ambition,
* financial restraint,
* family orientation,
* geographic mobility,
* learning inclination,
* entrepreneurial tendency.

Use excellent interactive controls.

For example, a bipolar slider might read:

```text
Prefer certainty ───────────── Comfortable with risk
```

Do not assign moral judgement.

---

# 10. Goals

Let users indicate importance of:

* wealth,
* financial security,
* career,
* family,
* romance,
* children,
* health,
* knowledge,
* prestige/status,
* freedom,
* adventure,
* creativity,
* community,
* spirituality,
* leisure,
* contribution/purpose.

Use a thoughtful interaction.

Do not force weights to sum to exactly 100 unless the UX benefits strongly.

The player should understand:

> These values influence how future lives are compared. They do not control what events happen.

---

# 11. Constraints

Allow users to specify:

* cannot relocate,
* unwilling to relocate internationally,
* family care obligations,
* education constraints,
* debt obligations,
* health limitations,
* immigration restrictions,
* other personal constraints.

---

# 12. Review screen

Before simulation, provide a polished "Your Starting State" screen.

Example:

```text
AGE                         29
LOCATION                    Brazil · Major city
HOUSEHOLD                   Partnered · Renting
EDUCATION                   Bachelor-equivalent
CAREER                      Finance · Mid-level
INCOME                      R$...
SAVINGS                     R$...
CAREER MOBILITY             High
RELOCATION OPENNESS         Moderate
RISK TOLERANCE              Moderate
CHILDREN                    Maybe
TOP GOALS                   Freedom · Family · Wealth
```

Show useful visual summaries.

Allow direct editing.

---

# 13. Data validation

Prevent nonsense while allowing unusual lives.

Examples:

* negative age: invalid;
* age 15 with 30 years work experience: warn;
* massive debt: allowed;
* zero income: allowed;
* living with parents at 55: allowed;
* retired at 32: unusual but allowed;
* no formal education + executive role: unusual but allowed.

Prefer warnings over arbitrary blocking when reality can legitimately be unusual.

---

# 14. Example profiles

Create several fictional examples from meaningfully different contexts so the UI gets exercised:

* young worker in an emerging economy,
* mid-career professional in a wealthy country,
* self-employed worker,
* student,
* parent with dependents,
* person considering migration.

Do not encode stereotypes.

---

# 15. Sprint 2 acceptance criteria

A user can:

* start fresh,
* complete onboarding,
* save progress,
* edit values,
* skip unknown fields,
* use mobile,
* select any supported country,
* see correctly formatted currency,
* review their state,
* load fictional examples.

Types remain clean.

Tests cover validation and persistence.

Build/lint/typecheck/tests pass.

Then:

COMMIT.

PUSH.

STOP.

Ask me to run it.

---

# SPRINT 3 — DETERMINISTIC LIFE SIMULATION ENGINE

## Goal

Implement the first real simulation engine.

This sprint should transform the project from UI prototype into an actual life simulator.

The initial engine can use simplified modelling assumptions, but it must have serious architecture.

Do not fake output using hardcoded narrative cards.

---

# 1. Deterministic RNG

Create a high-quality deterministic seeded random abstraction.

Requirements:

```text
same simulation version
+ same profile
+ same assumptions
+ same decisions
+ same seed
=
same future
```

No uncontrolled randomness inside simulation code.

Support derived sub-seeds for independent event domains if useful:

```text
economy
career
health
relationships
household
life-events
```

This prevents adding one random draw in one subsystem from unnecessarily scrambling every unrelated future.

Document the strategy.

Test reproducibility.

---

# 2. Time model

Support simulated time.

Start with yearly or configurable monthly/yearly ticks.

The engine should understand:

```text
age
simulation year
calendar year
elapsed months/years
```

Design so detailed monthly simulation can coexist with long-range yearly summaries later.

---

# 3. Core LifeState

Implement an immutable or safely transformed `LifeState`.

It should hold at least:

* age,
* location,
* country,
* household,
* education,
* career,
* income,
* expenses,
* savings,
* investments,
* debt,
* health,
* relationships,
* children/dependents summary,
* skills,
* behaviours,
* goals,
* life metrics,
* accumulated history.

---

# 4. Engine stages

Every tick should conceptually process stages such as:

```text
1. age / time progression
2. world context
3. country context
4. income / expenses
5. career progression
6. skill change
7. relationship transitions
8. household transitions
9. health change
10. deterministic random events
11. financial consequences
12. derived metrics
13. event explanations
```

Exact sequencing can differ if you identify better causal ordering.

Document it.

---

# 5. Finances

Initial financial model should support:

* salary/income growth,
* inflation,
* living expenses,
* saving/spending behaviour,
* investment growth using scenario assumptions,
* debt servicing,
* emergency expenses,
* household costs,
* basic housing effects.

Avoid promising precise investment returns.

Keep assumptions visible.

---

# 6. Career

Initial career transitions:

* normal progression,
* promotion,
* job change,
* unemployment,
* recovery from unemployment,
* stagnation,
* income growth,
* income decline,
* retirement where appropriate.

Probability must depend on state.

For example:

```text
career growth
depends partly on:
experience
skills
age
sector opportunity
country labour market
behaviour
job stability
economic conditions
```

Do not use flat random probabilities for everything.

---

# 7. Education and skills

Implement:

* skill growth,
* gradual skill decay where relevant,
* studying/training events,
* increased career opportunity from useful skills,
* willingness to learn as a modifier.

Deep career switching comes in later sprints, but create the foundations now.

---

# 8. Relationships — initial version

Implement a deliberately simplified first pass:

* single → relationship,
* relationship continuation,
* relationship ending,
* partnered/married transition,
* separation/divorce,
* widowhood only if appropriate to the simplified model.

Probability should depend on age/context/state rather than arbitrary dice alone.

Do not imply these are personalized predictions.

Later sprints will substantially deepen partner simulation.

---

# 9. Children — initial version

Support initial events around:

* first child,
* additional child,
* dependent costs,
* household expense changes,
* time/career impact.

Respect stated user preferences.

Never force children into every life.

Later sprints will make children proper lightweight agents.

---

# 10. Health — initial version

Implement broad health trajectory mechanics:

* ageing pressure,
* lifestyle modifiers,
* mild health events,
* major health events at low probability,
* healthcare-access modifiers,
* financial/career consequences.

Do not output diagnoses.

Represent categories such as:

```text
health shock
temporary limitation
chronic constraint
recovery
```

rather than pretending to forecast specific diseases.

---

# 11. Event architecture

Each important event should include metadata such as:

```ts
{
  id,
  type,
  timestamp,
  title,
  description,
  severity,
  domain,
  stateBefore,
  stateAfter,
  causes,
  consequences,
  seedContext
}
```

Do not store giant deep-cloned states if that becomes computationally wasteful; design intelligently.

But preserve enough information for later:

**Why did this happen?**

---

# 12. Event categories

Support:

### structural

* ageing
* salary change
* inflation
* expenses

### decisions

User-driven choices later.

### personal stochastic events

* job loss
* opportunity
* financial emergency
* relationship shift
* health shock

### macro events

* recession
* boom
* inflation spike
* sector disruption

### rare tail events

Very low probability.

Do not make rare events ridiculous by default.

---

# 13. World scenarios

Create several modelling regimes:

```text
Stable
Optimistic
Difficult
Volatile
```

These are not the same as the user's personal Good/Average/Bad outcome bands.

They represent external conditions.

---

# 14. Simulation horizons

Support:

* 1 year
* 5 years
* 10 years
* 20 years
* retirement/later-life horizon
* custom age or horizon within reasonable bounds

Do not simulate beyond sensible age limits.

---

# 15. Monte Carlo runner

Implement efficient simulation of many seeded lives.

Initial UI can offer something like:

```text
100
1,000
5,000
10,000
```

based on measured browser performance.

Do not freeze the main thread.

Use:

* Web Workers,
* chunking,
* worker pool,
* or another appropriate strategy

if necessary.

The interface should remain responsive while simulations run.

Allow cancellation.

Provide progress.

---

# 16. Outcome classification

From many simulated lives compute:

### Bad / difficult outcomes

Representative lower-outcome cluster or lower quantile.

### Average / typical outcomes

Representative central trajectories.

### Good outcomes

Upper outcome band.

### Exceptional outcomes

Rare favourable tails.

Do NOT classify solely using wealth.

Use the user's goal-weighted multidimensional outcome representation plus separate objective dimensions.

Allow users later to inspect financial versus overall goal alignment independently.

---

# 17. Distribution summaries

Compute distributions for:

* income,
* net worth,
* savings,
* health state,
* career level,
* relationship state,
* children count where appropriate,
* location,
* unemployment exposure,
* goal alignment.

Architecture should support percentiles:

```text
P10
P25
P50
P75
P90
```

---

# 18. Representative paths

Choose actual simulation runs representative of:

* bad,
* average,
* good,
* exceptional

rather than fabricating synthetic lives disconnected from engine output.

Store their seeds.

Users should eventually be able to replay a specific seed.

---

# 19. Explainability

Every transition function should return or record its major contributing factors where feasible.

Example:

```text
JOB CHANGE

positive contributors
+ high mobility
+ dissatisfaction
+ labour demand

negative contributors
- weak economy
- family constraints
```

Do not expose false numerical precision unless formulas justify it.

---

# 20. Testing

Simulation tests are essential.

Cover:

* deterministic replay,
* same seed = same future,
* different seeds produce variation,
* no NaN/Infinity values,
* savings arithmetic,
* age progression,
* debt logic,
* relationship constraints,
* child preference constraints,
* event consistency,
* percentile aggregation,
* state invariants.

Run fuzz/property-like tests over many fictional profiles if feasible.

The engine should not crash because someone enters extreme but valid values.

---

# 21. Sprint 3 acceptance criteria

At the end:

* real deterministic simulation exists,
* thousands of lives can be produced,
* seeds work,
* distributions work,
* representative outcomes work,
* engine runs independently from UI,
* tests verify determinism,
* no obvious numerical corruption,
* progress/cancellation architecture exists,
* build/lint/typecheck/tests pass.

It is acceptable if the visualisation is still primitive.

Do not spend the sprint polishing the timeline.

That comes next.

Then:

COMMIT.

PUSH.

STOP.

Ask me to run it.

---

# SPRINT 4 — FIRST FULLY PLAYABLE LIFE EXPERIENCE

## Goal

Make the engine understandable, explorable, and fun.

This is the sprint where the project should first feel like:

> "I am watching possible versions of my life unfold."

---

# 1. Simulation launch screen

From the completed profile, create a strong simulation setup.

Controls:

### Horizon

```text
5 years
10 years
20 years
30 years
Custom
```

### Number of lives

Use an appropriate control.

### World conditions

```text
Optimistic
Stable
Difficult
Volatile
```

### Seed controls

Offer:

```text
Random universe
Specific seed
```

A generated seed must be visible/replayable after the simulation.

Primary action:

```text
SIMULATE MY FUTURES
```

Make the action feel meaningful.

---

# 2. Running state

Do more than show a spinner.

Create lightweight game-like simulation feedback.

Possible presentation:

```text
SIMULATING 10,000 LIVES

3,824 completed
████████████░░░░░░░

Exploring career changes…
Resolving household transitions…
Projecting financial paths…
```

The actual progress labels should truthfully correspond to computation stages where possible.

Use subtle movement.

Respect reduced motion.

Provide cancel.

Keep UI responsive.

---

# 3. Futures overview

After completion, present:

```text
10,000 FUTURES GENERATED
```

Immediately show major outcome bands.

Example conceptual structure:

```text
DIFFICULT       TYPICAL       GOOD       EXCEPTIONAL
  18%             51%          26%           5%
```

Do not imply these exact labels are universal truths.

Explain how trajectories are grouped.

Make each band clickable.

---

# 4. Outcome dimensions

Show distributions for important life dimensions.

Avoid one giant "success score".

Examples:

```text
Finances
Career
Health
Relationships
Freedom
Security
Knowledge
Family
Adventure
Goal alignment
```

Use:

* bands,
* distributions,
* percentile rails,
* ranges,
* sparklines,
* trajectories

rather than covering the page in radial gauges.

---

# 5. THE LIFE TIMELINE

This is the core experience.

Create a horizontally explorable or otherwise highly usable life timeline.

It must support decades without becoming unreadable.

At minimum show:

```text
2026
Age 29
│
├ Career progression
│
2028
Age 31
│
├ Relationship begins
│
2031
Age 34
│
├ Job loss
├ Savings decline
│
2032
Age 35
│
├ New job
│
2037
Age 40
│
└ First home purchase
```

But visually much better.

Important events should emerge from the rail.

Minor events should be collapsible/aggregated.

Allow zoom levels such as:

```text
overview
years
detailed
```

if sensible.

---

# 6. Timeline domains

Allow toggles/filters:

* all,
* career,
* money,
* relationships,
* family,
* health,
* education,
* location,
* shocks.

Filters must not cause chaotic layout shifts.

Use UI Skills guidance.

---

# 7. Representative-life switching

Let users switch between:

```text
Difficult Life
Typical Life
Good Life
Exceptional Life
```

Each must load an actual representative simulation seed.

The entire timeline should change.

Show seed ID unobtrusively.

---

# 8. Parallel trajectories

Add a compact visualization showing many simulated futures simultaneously.

Think of:

* branching streams,
* percentile bands,
* many thin life trajectories,
* particle paths,
* flowing lines.

Do not attempt expensive 3D graphics.

Use SVG, Canvas, WebGL, or DOM based on measured performance.

The visual should communicate:

> Many futures begin together and diverge.

The user should be able to hover/select regions if practical.

---

# 9. Event inspector

Click an important event.

Open a contextual side panel or sheet.

Example:

```text
CAREER CHANGE
Age 34

Previous:
Operations specialist

New:
Project manager

Why this occurred:
• 8 years experience
• strong skill growth
• high career mobility
• positive labour market

Immediate consequences:
Income         +17%
Stress         +8%
Free time      -6%
Savings rate   +4%

Longer-term effects:
Improved promotion probability
Higher relocation likelihood
```

Do not invent effects that were not produced by the engine.

---

# 10. "Why did this life happen?"

Create an early version of causal explanation.

For the selected representative trajectory show strongest factors such as:

```text
This life was shaped most by:

Career progression
Savings behaviour
Country conditions
Relationship transitions
Health stability
Macro shock at age 38
```

No fake causal certainty.

Prefer:

```text
major model contributors
```

over claiming philosophical causation.

---

# 11. Outcome comparison

Allow switching among representative lives while retaining comparable axes.

Example:

|                 | Difficult | Typical | Good |
| --------------- | --------: | ------: | ---: |
| Net worth at 50 |         … |       … |    … |
| Career state    |         … |       … |    … |
| Health          |         … |       … |    … |
| Relationship    |         … |       … |    … |
| Goal alignment  |         … |       … |    … |

But make the UI more visual than a static spreadsheet.

---

# 12. Age scrubber

Add a control allowing the player to move through life.

Something like:

```text
AGE
29 ─────────●──────────── 75
             42
```

As the user scrubs:

* metrics update,
* timeline focus updates,
* selected-life state updates.

This should feel responsive.

---

# 13. Time controls

Experiment with subtle simulation-player controls:

```text
|◀  ◀  ▶  ▶| 
```

or:

```text
Age 29 → 30 → 31 → ...
```

Do not overcomplicate.

The user should be able to "play" the representative future unfolding over time.

Use animation conservatively.

---

# 14. State panel

When a specific age is selected show the person's state at that point:

```text
AGE 42

CAREER
Senior role

INCOME
...

NET WORTH
...

HOUSEHOLD
Partner + 2 dependents

HEALTH
Good

LOCATION
...

TOP ACTIVE PRESSURES
Housing costs
Family expenses
Career transition
```

---

# 15. Assumptions panel

Users need transparency.

Provide a clean view of:

* simulation horizon,
* world scenario,
* seed,
* starting state,
* simplified country assumptions,
* model version.

Include language such as:

> These are modelled scenarios, not predictions or professional financial, medical, legal, or immigration advice.

Do not ruin the experience with giant warning banners.

Place disclaimers intelligently.

---

# 16. Responsive experience

Timeline must work on:

* desktop,
* tablet,
* phone.

Do not simply shrink desktop.

On mobile consider:

* vertical timeline,
* swipeable outcome selector,
* bottom sheet inspector,
* compact age scrubber.

---

# 17. Performance

Test with:

* 100 lives,
* 1,000 lives,
* 10,000 lives if supported.

Do not render thousands of DOM nodes.

Measure.

Optimize.

---

# 18. Game feel

Add restrained feedback:

* timeline drawing,
* simulation particles,
* event pulses,
* milestone emphasis,
* number interpolation,
* hover responses,
* selection transitions.

Sound is optional and should remain off by default in this phase unless already handled elegantly.

Never auto-play intrusive audio.

---

# 19. Empty/error states

Handle:

* simulation failed,
* worker unavailable,
* malformed saved profile,
* zero results,
* cancelled simulation,
* unsupported country data,
* missing assumptions.

Never dump raw exceptions onto the user.

---

# 20. Sprint 4 acceptance criteria

By the end of Sprint 4, I should be able to:

1. create/load a life;
2. configure simulation;
3. simulate many futures;
4. watch progress;
5. inspect difficult/typical/good/exceptional representative lives;
6. navigate a life timeline;
7. inspect major events;
8. scrub through age;
9. compare outcomes;
10. understand model assumptions;
11. replay a deterministic seed;
12. use the application comfortably on desktop and mobile.

The app should now feel like the beginning of a real game.

Build/lint/typecheck/tests must pass.

Then:

COMMIT.

PUSH.

STOP.

Ask me to run it.

---

# DO NOT YET IMPLEMENT

Unless required architecturally, defer these to later parts:

* deep partner-as-agent modelling,
* detailed divorce model,
* detailed children-as-agents modelling,
* full migration recommendation engine,
* sophisticated career-switch planner,
* destination-country ranking,
* real external country dataset ingestion,
* detailed macroeconomic regime simulation,
* fork-any-decision,
* rewind,
* full counterfactual comparison,
* sensitivity analysis,
* "what variable matters most?",
* full causal decomposition,
* shareable life universes,
* export/import,
* accounts/cloud persistence,
* advanced game events,
* extensive sound design.

Architect for them, but do not steal time from the current sprint.

---

# CODE QUALITY REQUIREMENTS

Throughout all four sprints:

* prefer TypeScript where applicable;
* keep strict typing;
* avoid `any` unless genuinely unavoidable;
* keep domain logic out of visual components;
* document non-obvious simulation formulas;
* centralize constants;
* avoid magic numbers;
* use deterministic tests;
* preserve separation between model assumptions and facts;
* maintain schema/version information for stored profiles;
* use migrations for persisted state when needed;
* prevent stale saved data from crashing newer builds;
* keep components focused;
* keep accessibility intact;
* keep simulations testable without launching a browser.

---

# UX QUALITY REQUIREMENTS

Constantly ask:

* Is this fun to manipulate?
* Does changing a value visibly matter?
* Can I understand what changed?
* Is information overwhelming?
* Is the interface making uncertainty understandable?
* Can someone outside North America/Europe use it naturally?
* Does this feel like a simulation rather than a form?
* Can I explore without fear of breaking something?
* Are controls tactile and obvious?
* Is the hierarchy clear?
* Is mobile genuinely designed rather than patched?

Use sliders only when continuous manipulation adds value.

Use direct numeric input alongside sliders for money/ages where useful.

Use segmented controls for small mutually exclusive choices.

Use searchable selects/comboboxes for countries and long taxonomies.

Use contextual explanations rather than permanent walls of text.

---

# IMPORTANT DATA ETHICS / PRODUCT RULES

Never present simulation output as certainty.

Do not say:

```text
You will divorce at 42.
```

Say, conceptually:

```text
In this simulated trajectory, the relationship ended at age 42.
```

Do not say:

```text
You have a 74.23% chance of cancer.
```

Do not turn the product into medical diagnosis.

Do not claim actual visa eligibility without appropriate future data/legal modelling.

Do not rank countries as morally superior.

Do not use gender, nationality, ethnicity, religion, or similar personal characteristics as crude success multipliers.

If a demographic characteristic genuinely affects a real-world process later, model the specific mechanism carefully and transparently rather than encoding discriminatory shortcuts.

---

# FINAL INSTRUCTION

Start by inspecting the repository and determining which Sprint from this prompt is the earliest incomplete Sprint.

Execute ONLY that Sprint.

Do it thoroughly.

Test it thoroughly.

Commit it.

Push it to:

```bash
git@github.com:shivam4tech/life-simulator.git
```

Then STOP and ask me to run/review it.

Do not continue automatically to the next Sprint.
