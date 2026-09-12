# LIFE SIMULATOR — MASTER DEVELOPMENT PROMPT

## PART 3 OF 3 — SPRINTS 8–10

### Counterfactual Life Engine → Economic Calibration → Life Multiverse → Final Production Polish

Continue development of the Life Simulator produced by Parts 1 and 2.

Canonical repository:

```bash
git@github.com:shivam4tech/life-simulator.git
```

Required design-engineering reference:

```text
https://github.com/ibelick/ui-skills
```

This prompt contains the final three major sprints:

* Sprint 8 — Rewind, Fork, Butterfly Mode & Sensitivity
* Sprint 9 — Country-Calibrated Money, Income & Economic Reality Engine
* Sprint 10 — Life Multiverse, Explainability, Chaos, Game Feel & Production Hardening

The goal is to finish the first serious version of the product.

---

# EXECUTION RULE — ABSOLUTELY IMPORTANT

You MUST execute only **ONE sprint per invocation**.

Do not perform Sprints 8, 9 and 10 automatically in one session.

At the beginning:

1. inspect git history;
2. inspect current application;
3. identify the earliest incomplete sprint;
4. execute ONLY that sprint.

At the end of the sprint:

1. run lint;
2. run typecheck;
3. run automated tests;
4. run simulation tests;
5. run production build;
6. inspect important UI states;
7. fix regressions;
8. update documentation;
9. commit;
10. push to:

```bash
git@github.com:shivam4tech/life-simulator.git
```

Then STOP.

Tell me:

* sprint completed,
* commit hash,
* important systems built,
* simulation changes,
* tests/build status,
* exact command to run locally,
* manual scenarios I should test,
* known limitations.

Then ask me to run and review it.

Do not continue until I explicitly tell you to continue.

Use sprint commits such as:

```text
feat(sprint-8): add rewind forks and sensitivity simulation
feat(sprint-9): calibrate income costs and country economics
feat(sprint-10): complete multiverse explainability and production polish
```

Never force-push.

Never rewrite published history.

Preserve previous user work.

---

# PRODUCT VISION REMINDER

This should ultimately feel like a modern data-driven fortune machine.

The emotional experience is:

> Tell us who you are now.
> Let us explore thousands of lives that can grow out of that starting point.

But underneath it must remain:

* deterministic,
* explainable,
* scenario-driven,
* country-aware,
* path-dependent,
* uncertainty-aware,
* based on explicit assumptions.

The product is not claiming to predict fate.

The system is exploring reachable life trajectories under model assumptions.

---

# GLOBAL-FIRST RULE

The simulator must work sensibly for people living anywhere.

Do NOT allow the economic model to secretly assume:

* US salaries,
* US rent,
* US university fees,
* US healthcare,
* Western household patterns,
* USD as economic truth,
* wealthy-country consumption,
* formal salaried employment,
* independent living from age 18.

A user earning the equivalent of USD 20,000 in one country may be relatively affluent.

Another user earning USD 40,000 elsewhere may be financially constrained.

Absolute converted currency alone tells us very little.

The simulator must understand **economic position**, not merely currency conversion.

This becomes one of the central goals of Sprint 9.

---

# CORE ECONOMIC PRINCIPLE

Never reason about money using only:

```text
absolute currency value
```

Instead money-related simulation should increasingly use:

```text
nominal local amount
+
local purchasing power
+
relative income position
+
household composition
+
settlement type
+
occupation
+
career level
+
local costs
+
tax/social contribution approximation
+
inflation
```

The economic engine should answer:

> What does this amount of money mean for this particular person in this particular place?

---

# SPRINT 8 — REWIND, FORK, COUNTERFACTUALS & BUTTERFLY MODE

## Goal

Turn the simulator into an interactive counterfactual laboratory.

At the end of this sprint the user should be able to take any simulated life and ask:

> What if I changed this?

Then generate a new deterministic branch from that exact moment.

This should become the main gameplay loop.

---

# 1. Arbitrary timeline rewind

Allow the player to select any meaningful point in an existing representative life.

Example:

```text
AGE 37

Career:
Senior operations role

Savings:
...

Partner:
...

Children:
1

Country:
...

[REWIND HERE]
```

Selecting rewind should reconstruct the full simulation state at that time.

Do not approximate by rebuilding from final-state values.

The engine must be able to restore the actual historical state.

---

# 2. State snapshots

Introduce efficient checkpoint/state snapshot architecture.

Possible approach:

```text
full snapshots:
major events / periodic checkpoints

deltas:
intermediate state changes
```

Do not retain enormous duplicate object graphs for every Monte Carlo life.

Representative lives can preserve detailed history.

Aggregate lives can preserve much less.

---

# 3. Fork from history

From any restored state allow:

```text
CREATE BRANCH
```

Example:

```text
ORIGINAL
Age 32 → Stay in job

NEW BRANCH
Age 32 → Change career
```

Both branches share identical history before the fork.

After the fork they evolve independently.

---

# 4. Deterministic branch seeds

Branch identity must remain deterministic.

A branch should include:

```ts
branchId
parentBranchId
forkTimestamp
baseSeed
branchSeed
interventions
simulationVersion
```

Same branch configuration should replay identically.

---

# 5. Intervention palette

From a timeline state, present context-relevant interventions.

Possible categories:

## Career

```text
Change employer
Change career
Reduce hours
Increase hours
Start business
Begin freelance work
Retire
```

## Education

```text
Start training
Begin qualification
Learn skill
```

## Money

```text
Increase savings
Reduce spending
Invest more
Pay debt faster
Buy home
Sell home
```

## Relationship

```text
Prioritize relationship
Separate
Marry/formalize
Delay marriage
```

Do not force users to make unrealistic actions instantly.

## Family

```text
Try for child
Delay children
Remain child-free
Change caregiving commitment
```

## Geography

```text
Move city
Move country
Return home
```

## Lifestyle

```text
Exercise more
Sleep more
Reduce substance use
Increase leisure
```

Use only interventions the existing model can meaningfully simulate.

---

# 6. Intervention configuration

Some decisions require parameters.

Example:

```text
SAVE MORE

Current savings rate: 12%

Target:
12% ─────────●──────── 35%

Start:
Now

Duration:
Until changed
```

Or:

```text
CHANGE CAREER

Target:
Data / Analytics

Retraining:
12 months

Maximum training budget:
Local currency amount
```

Controls should be tactile and easy to manipulate.

---

# 7. Compare fork to original

Immediately show:

```text
ORIGINAL LIFE
vs
NEW BRANCH
```

Use aligned timelines.

Shared history should visually converge before fork.

Example:

```text
                       Original
                     ───────────────→

───────────────● AGE 32

                     ───────────────→
                       Career switch
```

---

# 8. Counterfactual distributions

Do not compare only one original seed against one alternative seed.

Allow two modes:

### Story comparison

Same deterministic universe with one changed intervention.

Useful for game-like comparison.

### Distribution comparison

Thousands of futures under:

```text
Baseline
vs
Alternative
```

Useful for serious decision exploration.

---

# 9. Controlled common randomness

For fair comparisons, use common random numbers where appropriate.

Conceptually:

```text
Baseline seed 48321
Scenario seed 48321
```

External shocks can remain aligned unless the intervention logically changes exposure.

Example:

Both worlds experience the same recession.

But:

```text
Baseline:
user still in retail

Scenario:
user transitioned into healthcare
```

Consequences differ.

This makes counterfactual comparisons more meaningful.

Document the implementation.

---

# 10. Butterfly Mode

Create a special interaction:

```text
BUTTERFLY MODE
```

The user changes one seemingly small variable.

Examples:

```text
Exercise +2 days/week
Save +5% income
Sleep +45 minutes
Learn one new skill
Delay relocation 2 years
Work 5 fewer hours/week
Spend more time socializing
```

Run many lives.

Measure downstream divergence.

---

# 11. Butterfly result

Show:

```text
CHANGE

Savings rate
12% → 17%
```

Then:

```text
AFTER 5 YEARS

Median liquid savings     +21%
Debt stress                -8%
Home purchase timing      earlier

AFTER 15 YEARS

Median net worth           +17%
Career differences         small
Relationship outcomes      largely unchanged
```

Do not manufacture effects that were not simulated.

---

# 12. Direct and indirect effects

Where the model allows, distinguish:

```text
DIRECT
```

from:

```text
DOWNSTREAM
```

Example:

```text
Exercise more

DIRECT
health state improved

DOWNSTREAM
fewer work interruptions
lower health-related costs
slightly greater career continuity
```

---

# 13. Sensitivity analysis

Create:

```text
WHAT MATTERS MOST?
```

Vary relevant inputs around the user's starting state.

Potential variables:

```text
income growth
savings rate
career mobility
education choice
location
housing cost
number of children
relationship stability
health behaviour
working hours
economic regime
```

Measure sensitivity of selected outcomes.

---

# 14. Outcome-specific sensitivity

Do not produce one universal ranking.

Allow:

```text
What matters most for:
```

* net worth,
* financial security,
* career,
* health,
* family goal alignment,
* freedom,
* retirement resilience,
* overall user-defined goals.

---

# 15. Sensitivity UI

Possible visual:

```text
NET WORTH AT AGE 50

Savings behaviour       █████████
Career growth            ████████
Country                  ███████
Housing cost             █████
Children                 ████
Macro regime             ███
```

These should represent model sensitivity, not philosophical importance.

Label clearly.

---

# 16. One-variable experiment

Allow:

```text
TEST A VARIABLE
```

Example:

```text
Savings rate

5% ───────────── 40%
```

Plot outcome distributions as the value changes.

Do not automatically run huge simulations for every pixel of slider movement.

Use discrete sampled values.

---

# 17. Two-variable experiment

If performance allows, support one simple heatmap-style analysis.

Example:

```text
Savings rate
vs
Retirement age
```

or:

```text
Training duration
vs
Career-switch age
```

Limit to carefully selected pairs.

Do not turn the product into MATLAB.

---

# 18. Rewind UX

Rewind should feel slightly dramatic but fast.

Possible interaction:

```text
REWINDING TO AGE 28...
```

Timeline contracts back to selected point.

Then branch options appear.

Respect reduced-motion settings.

---

# 19. Branch tree

Create first version of the Life Tree.

Example:

```text
                            ┌─ Stay in country
                   ┌─ Job ─┤
                   │        └─ Move abroad
START ─────────────┤
                   │        ┌─ Success
                   └─ Biz ──┤
                            └─ Failure → New career
```

Allow:

* pan,
* zoom,
* select,
* rename,
* delete,
* duplicate.

Do not render every Monte Carlo trajectory as a branch.

Only user-created scenario branches belong in this tree.

---

# 20. Branch breadcrumbs

When viewing a branch show:

```text
Original Life
→ Career switch
→ Move to Germany
→ Have child
```

This prevents users becoming lost.

---

# 21. Sprint 8 test scenarios

Test:

```text
fork at age 25
fork at age 60
multiple nested forks
delete parent with children
duplicate branch
same seed replay
same common shock across branches
migration fork
career fork
relationship fork
savings fork
```

Prevent branch corruption.

---

# 22. Sprint 8 acceptance criteria

At completion:

* rewind works;
* historical states restore correctly;
* arbitrary forks work;
* branch tree exists;
* deterministic replay works;
* common-random counterfactual comparison exists;
* Butterfly Mode exists;
* sensitivity analysis exists;
* one-variable experiments work;
* baseline vs alternative distributions work;
* UI remains usable with many branches;
* build/lint/typecheck/tests pass.

Commit:

```text
feat(sprint-8): add rewind forks and sensitivity simulation
```

Push.

STOP.

Ask me to run it.

---

# SPRINT 9 — COUNTRY-CALIBRATED INCOME, MONEY & ECONOMIC REALITY ENGINE

## Goal

Make every monetary quantity in the simulator context-aware.

This sprint is extremely important.

The simulator must stop interpreting money using universal fixed amounts.

A user's:

* salary,
* savings,
* rent,
* debt,
* education costs,
* healthcare burden,
* childcare,
* business capital,
* migration cost,
* emergency fund,
* home affordability

should make sense relative to:

```text
country
currency
local income distribution
occupation
industry
experience
seniority
settlement type
household
price level
inflation
```

This should work even where detailed country data is incomplete.

Build a **hierarchical economic extrapolation system**.

---

# 1. Economic normalization model

For every user, derive several monetary representations.

Example:

```ts
EconomicPosition {
    nominalLocalIncome
    annualizedIncome
    estimatedDisposableIncome
    incomeRelativeToCountryMedian
    estimatedIncomePercentile
    purchasingPowerIndex
    householdAdjustedIncome
    localCostPressure
}
```

Never destroy the original local values.

Keep raw input and derived values separately.

---

# 2. Currency

Every monetary amount must have:

```text
amount
currency
timeBasis
source
```

For example:

```ts
{
  amount: 50000,
  currency: "INR",
  period: "month"
}
```

Do not store ambiguous numbers such as:

```ts
income: 50000
```

without currency/context.

---

# 3. Monetary value type

Introduce a reusable money representation.

Example concept:

```ts
MoneyAmount {
    value
    currency
    frequency?
}
```

Create safe helpers for:

* monthly → annual,
* annual → monthly,
* currency formatting,
* inflation adjustment,
* real/nominal conversion,
* household scaling.

Avoid floating-point drift where material.

---

# 4. Income expectations must be country-based

Career salary expectations cannot be globally fixed.

Do NOT model:

```text
Software engineer = $80,000
Accountant = $50,000
Teacher = $45,000
```

globally.

Instead derive salary from a hierarchy.

Conceptual process:

```text
Country income baseline
× occupation multiplier
× sector multiplier
× experience multiplier
× seniority multiplier
× education/credential modifier
× settlement modifier
× employment-type modifier
× macro condition modifier
```

Then introduce deterministic variation around the estimate.

---

# 5. Income baseline

Each country should have a baseline labour-income representation.

Possible internal concepts:

```text
median worker income
median formal-sector income
median household income
income distribution shape
minimum-income floor proxy
high-income tail behaviour
```

Where reliable values are unavailable, estimate through the fallback system described later.

Never silently pretend an estimate is observed data.

---

# 6. Prefer ratios over fixed global amounts

Many economic rules should operate as ratios.

For example:

Instead of:

```text
Emergency expense = $2,000
```

use something like:

```text
Emergency expense
≈ X weeks/months of locally adjusted household expenditure
```

Instead of:

```text
Childcare = $800/month
```

use:

```text
childcare burden
=
country childcare burden factor
× local median income
× settlement factor
× child age
```

Instead of:

```text
University costs $20,000
```

use:

```text
training cost
=
local education-cost burden
× country income baseline
× qualification duration
```

This is how the simulator can remain globally coherent.

---

# 7. Hierarchical economic fallback system

Implement a clear fallback ladder.

For income or cost data, prefer the most specific available data.

Example:

```text
LEVEL 1
Country + occupation + seniority + settlement

LEVEL 2
Country + occupation + seniority

LEVEL 3
Country + occupation

LEVEL 4
Country + occupation family

LEVEL 5
Country labour-market baseline

LEVEL 6
Country economic cluster + occupation

LEVEL 7
Regional economic cluster + occupation

LEVEL 8
Global reference relationship
scaled by country economic indicators
```

Record which fallback level was used.

---

# 8. Confidence

Every extrapolated figure should have internal confidence.

Example:

```text
Observed / strong
Modelled / moderate
Extrapolated / low
Fallback / very low
```

Do not necessarily clutter the primary UI with these constantly.

But expose them in:

```text
Assumptions
Model details
Why this estimate?
```

---

# 9. Income distribution

Do not assume a normal distribution.

Income generally has skewed tails.

Use an appropriate simplified distribution such as:

```text
log-normal core
+
controlled upper-tail behaviour
```

or another defensible approximation.

The exact mathematical model is less important than:

* no negative income,
* right-skewed values,
* realistic tails,
* country-adjustable inequality.

---

# 10. Country inequality effect

Allow CountryProfile to influence income spread.

Conceptually:

```text
Country A:
narrower distribution

Country B:
wider distribution
```

This affects:

* percentile calculations,
* career upside,
* downside,
* high-income trajectories.

Do not encode inequality as moral judgement.

---

# 11. User income percentile

Estimate the user's relative position.

Example:

```text
Monthly income:
₹60,000

Estimated individual labour-income position:
around upper-middle portion of local distribution
```

Avoid exposing false exactness where model quality is low.

Internally percentiles may be continuous.

UI can bucket into:

```text
Lower
Lower-middle
Middle
Upper-middle
High
Very high
```

where appropriate.

---

# 12. Household equivalence

A person earning €3,000 alone and a household earning €3,000 supporting four people should not be treated identically.

Introduce household-adjusted disposable resources.

Use a configurable equivalence-scale abstraction.

Example concept:

```text
effective household resources
=
disposable household income
/
equivalence factor
```

Do not claim one household equivalence formula is universally correct.

Store the chosen modelling assumption.

---

# 13. Settlement multipliers

Settlement type affects:

```text
wages
housing
transport
childcare
service costs
employment opportunities
```

Example internal categories:

```text
Rural
Small town
Secondary city
Major city
Global/megacity
```

Create country-sensitive multipliers.

Do not assume megacity always means better finances.

Higher salary may coexist with dramatically higher rent.

---

# 14. Occupation multipliers

Build broad occupation-family multipliers relative to local median labour income.

Example internal relationship:

```text
local occupation salary
=
country baseline
× occupation multiplier
```

Then modify using:

* seniority,
* education,
* experience,
* industry,
* settlement.

Do not use fixed salaries.

---

# 15. Seniority curve

Income progression should follow occupation-sensitive career curves.

Possible levels:

```text
entry
junior
mid
senior
lead
management
executive/specialist
```

Do not assume every career reaches executive level.

Some occupations have flatter curves.

Others have steep tails.

---

# 16. Experience curve

Create diminishing-return experience functions.

Avoid:

```text
+10% salary every year forever
```

Instead:

```text
rapid early growth
moderate mid-career growth
slower later growth
```

with differences by career family.

---

# 17. Career transition salary

Changing careers must account for experience transfer.

Example:

```text
10 years experience
```

does NOT imply:

```text
10 years experience in new profession.
```

Calculate:

```text
transferable experience
specialized experience
credential relevance
```

New salary may temporarily fall.

---

# 18. Informal economy

Support income patterns such as:

```text
informal worker
gig worker
self-employed
small business owner
```

Income may have:

```text
higher volatility
lower predictability
seasonality
```

depending on model.

Do not force everyone into corporate salary progression.

---

# 19. Irregular income

Introduce income processes for:

```text
freelance
commission
seasonal work
business ownership
gig work
```

Track:

```text
mean income
variance
bad months
good months
```

Household resilience should care about volatility, not only annual average.

---

# 20. Purchasing power

Introduce a purchasing-power abstraction.

Do not simply convert currency.

Example:

```text
€2,000
```

in Country A and:

```text
equivalent FX value
```

in Country B should not be treated equally.

Estimate:

```text
local purchasing power
housing-adjusted purchasing power
essential-cost burden
```

---

# 21. Local cost basket

Create cost categories:

```text
housing
food
transport
utilities
health
education
childcare
communications
basic discretionary spending
```

Each country/archetype should have ratios to local income or price-level indices.

Settlement type modifies these.

---

# 22. Housing

Housing cost should derive from:

```text
country
settlement
household size
housing tenure
income
housing market pressure
```

Never globally assume:

```text
rent = 30% income
```

Instead model distributions and affordability pressure.

---

# 23. Housing stress

Derived:

```text
housingCost / disposableHouseholdIncome
```

Use buckets like:

```text
comfortable
noticeable
high
severe
```

Thresholds can be modelling assumptions.

---

# 24. Home purchase affordability

Home ownership simulation should consider:

```text
local property-price-to-income ratio
deposit/down-payment requirement
mortgage availability
interest-rate regime
household income
existing debt
settlement
```

Do not use a fixed house price.

---

# 25. Debt

Debt must be contextual.

Track:

```text
principal
interest
payment
currency
type
```

Potential broad types:

```text
education
housing
consumer
business
family/personal
other
```

Debt burden is relative to income.

---

# 26. Debt stress

Example:

```text
debt service ratio
=
required debt payments
/
disposable income
```

This should affect:

* financial stress,
* resilience,
* housing affordability,
* career risk tolerance.

---

# 27. Savings

Savings should be interpreted through:

```text
months of essential expenses
```

not only absolute amount.

Example:

```text
Emergency runway: 8.3 months
```

This is far more globally meaningful.

---

# 28. Financial resilience

Create a multidimensional derived state.

Possible inputs:

```text
liquid savings runway
debt burden
income volatility
partner income
social protection
family support
housing burden
dependents
```

Do not reduce to wealth alone.

---

# 29. Taxes and mandatory deductions

Implement broad country-aware tax/social deduction approximations.

Do not pretend to be a tax calculator.

Architecture:

```text
gross income
→ estimated mandatory deductions
→ estimated disposable income
```

Keep this deliberately approximate unless real jurisdictional tax rules are later supplied.

Expose:

```text
Estimated deductions
```

not:

```text
Your exact tax liability.
```

---

# 30. Progressive approximation

Support broad progressive schedules using configurable brackets/rates where available.

Fallback:

```text
estimated tax wedge
```

derived from country archetype.

Always record model provenance.

---

# 31. Social transfers

Architecture should support:

```text
child benefit
unemployment support
pension
housing support
other social transfers
```

Where detailed programs are absent, use country-level social-protection assumptions.

Do not fabricate named programs.

---

# 32. Inflation

Nominal values must evolve.

Track:

```text
nominal
real
```

where useful.

The timeline must not treat:

```text
₹1,000,000 in 2055
```

as equivalent to today's purchasing power.

Allow display:

```text
Nominal
Today's money
```

---

# 33. Wage inflation vs price inflation

Do not force wages and prices to increase identically.

Model:

```text
price inflation
wage growth
```

separately.

Economic regimes should influence both.

---

# 34. Real income

Calculate:

```text
real disposable income growth
```

This is often more meaningful than nominal salary growth.

---

# 35. Career offer generation

When a simulated job offer appears, generate salary using local rules.

Example:

```text
new salary offer
=
local market estimate
× applicant competitiveness
× macro conditions
× deterministic negotiation variation
```

Never generate arbitrary globally scaled offers.

---

# 36. Negotiation

If negotiation exists:

```text
negotiation outcome
```

should scale relative to:

```text
local salary band
```

not arbitrary percentage explosions.

---

# 37. Promotion salary increase

Promotion raise should depend on:

```text
country labour norms
occupation family
current salary position
seniority transition
macro environment
```

Avoid universal:

```text
promotion = +20%
```

---

# 38. Salary compression

Someone already well above local market should generally have lower future wage growth unless moving into a new seniority band.

Someone below market may have more catch-up potential.

Implement this.

---

# 39. Income ceiling

Occupation-family models should have soft income ceilings relative to country distribution.

Not hard caps.

Use decreasing probability of huge further growth.

---

# 40. Exceptional income

Rare high-income outcomes remain possible.

But require plausible mechanisms such as:

```text
business success
executive promotion
specialist career
commission windfall
international remote employment
```

Do not randomly multiply salary by 10.

---

# 41. Cross-border remote work

Support future trajectory:

```text
living in Country A
earning from employer/client in Country B
```

This can create unusual purchasing-power effects.

Model carefully.

Allow:

```text
foreign income premium
currency risk
income volatility
tax uncertainty abstraction
```

Do not pretend exact legal compliance.

---

# 42. Migration salary recalibration

On migration:

Do not convert old salary using FX and continue.

Recalculate target-market earning ability using:

```text
occupation
experience
credential recognition
language
local demand
migration status
country income baseline
```

The user may earn:

* less,
* similar,
* more

depending on circumstances.

---

# 43. Migration lifestyle recalibration

All expenses should also shift to destination economy.

Recalculate:

```text
housing
food
transport
health
education
childcare
```

Do not simply scale all costs by one multiplier.

---

# 44. Economic clusters

Where detailed data is unavailable, create multidimensional economic archetypes.

Potential traits:

```text
income level
price level
inequality
welfare strength
housing pressure
labour mobility
inflation volatility
```

Country fallback should derive from these.

---

# 45. Clever extrapolation system

Implement a rule-based estimation pipeline.

A potential generalized estimate:

```text
EstimatedLocalValue
=
ReferenceValue
× CountryIncomeScale
× LocalPriceScale
× SectorModifier
× SettlementModifier
× HouseholdModifier
× ContextModifier
```

Different value types use different subsets.

For salaries:

```text
SalaryEstimate
=
CountryMedianLabourIncome
× OccupationFactor
× SeniorityFactor
× ExperienceFactor
× EducationFactor
× SettlementWageFactor
× EmploymentTypeFactor
× MacroFactor
```

For rent:

```text
RentEstimate
=
CountryMedianIncome
× HousingBurdenFactor
× SettlementHousingFactor
× HouseholdSizeFactor
× HousingQualityFactor
```

For childcare:

```text
ChildcareEstimate
=
CountryMedianIncome
× ChildcareBurdenFactor
× ChildAgeFactor
× SettlementFactor
× PublicSupportAdjustment
```

For education:

```text
EducationCostEstimate
=
CountryIncomeScale
× EducationCostBurden
× QualificationLevel
× Duration
× PublicSupportAdjustment
```

For healthcare shocks:

```text
OutOfPocketCost
=
HealthcareBurdenFactor
× HouseholdIncomeScale
× SeverityBand
× Insurance/PublicCoverage
```

Do not use these exact formulas blindly.

Use them as architectural guidance and calibrate sane ranges.

---

# 46. Guardrails on extrapolation

Apply caps/floors to multipliers.

Avoid situations like:

```text
rent = 900% of median income
```

unless deliberately modelling severe housing crisis.

Avoid negative costs.

Avoid salary below zero.

Avoid savings exceeding available cash flow without explanation.

---

# 47. Model calibration tests

Create synthetic country test fixtures.

Example:

```text
Country LowCostEmerging
Country HighIncomeHighCost
Country HighIncomeStrongWelfare
Country VolatileMiddleIncome
```

Test identical users.

Expected behaviour should differ coherently.

Example:

```text
Same occupation

High-income country:
gross salary ↑
housing ↑

Lower-cost country:
gross salary ↓
living costs ↓

Strong welfare:
health/childcare risk ↓

Volatile country:
inflation uncertainty ↑
```

---

# 48. Cross-country sanity tests

Create invariants.

Examples:

Changing country must not automatically improve every dimension.

Higher nominal salary must not necessarily improve savings.

Higher GDP/income baseline must not automatically produce higher life satisfaction.

Migration can reduce short-term net worth.

High-cost cities can reduce purchasing power.

---

# 49. Relative economic language

The UI should increasingly say things like:

```text
Your income is above the modelled local median.

Housing absorbs a high share of household resources.

Your emergency savings cover approximately 7 months of essential expenses.

Your target career would likely enter near the local middle-income range.

This move raises gross income but increases housing burden significantly.
```

This is far better than showing isolated amounts.

---

# 50. Money inspector

Create a useful money details panel.

Example:

```text
INCOME

₹65,000 / month

Relative local position
Upper-middle

Estimated disposable
₹...

Housing burden
19%

Savings rate
17%

Emergency runway
6.4 months

Income volatility
Low
```

---

# 51. Income trajectory chart

Allow switching:

```text
Nominal income
Real income
Relative local position
Disposable income
```

This communicates economic trajectory much better.

---

# 52. Country comparison money view

When comparing destinations show:

```text
Gross salary
Disposable income
Housing
Essential costs
Savings
Purchasing power
Local income position
```

Avoid only:

```text
Salary A vs Salary B
```

---

# 53. Data provenance panel

Economic assumptions should show:

```text
Country economic model

Income baseline:
Modelled

Occupation multiplier:
Internal occupation model

Cost-of-living:
Archetype estimate

Confidence:
Moderate
```

Later real data can replace components independently.

---

# 54. Data adapters

Create clean interfaces so real datasets can later be ingested without rewriting the simulation.

Possible adapters:

```ts
IncomeDataProvider
PriceDataProvider
LabourDataProvider
HousingDataProvider
TaxApproximationProvider
CountryIndicatorProvider
```

Simulation should depend on normalized interfaces rather than specific datasets.

---

# 55. Do not fetch live external data on every simulation

The simulation must remain fast and reproducible.

Use versioned local datasets / normalized snapshots later.

A simulation should record:

```text
economicDataVersion
```

so a saved life can be replayed.

---

# 56. Sprint 9 acceptance criteria

Sprint 9 is complete only when:

* no major money system assumes USD;
* income is interpreted relative to country;
* occupation salaries derive from local baselines;
* seniority matters;
* experience matters;
* settlement matters;
* household composition matters;
* local costs scale appropriately;
* purchasing power exists;
* disposable income exists;
* approximate deductions exist;
* real vs nominal values exist;
* inflation works;
* savings runway exists;
* debt stress exists;
* housing burden exists;
* migration recalibrates both income and costs;
* remote foreign income can be represented;
* hierarchical fallbacks work;
* confidence/provenance works;
* missing country data can be intelligently extrapolated;
* economic test fixtures behave sensibly;
* deterministic replay remains intact;
* build/lint/typecheck/tests pass.

Commit:

```text
feat(sprint-9): calibrate income costs and country economics
```

Push.

STOP.

Ask me to run it.

---

# SPRINT 10 — LIFE MULTIVERSE, EXPLAINABILITY, CHAOS, GAME FEEL & PRODUCTION HARDENING

## Goal

Finish the first complete product experience.

After Sprint 10 the simulator should feel like a coherent interactive game/application rather than a collection of modelling experiments.

Focus on:

* Life Multiverse,
* deep explanation,
* rare events,
* timeline polish,
* shareability,
* model transparency,
* performance,
* accessibility,
* responsive design,
* persistence,
* final design quality.

---

# 1. Life Multiverse

Turn the accumulated branch graph into a major product screen.

Possible title:

```text
YOUR MULTIVERSE
```

Show user-created lives.

Example:

```text
                                 Germany
                         ┌───────────────
                 MBA ────┤
                /        └──── Stay home
START ─────────●
                \
                 Business ── Failure ── New career
```

Each branch represents a genuine stored scenario.

---

# 2. Multiverse navigation

Support:

* pan,
* zoom,
* select branch,
* expand,
* collapse,
* rename,
* duplicate,
* delete,
* focus lineage,
* return to current branch.

Avoid a giant unreadable graph.

Use progressive disclosure.

---

# 3. Branch preview

Hover/tap branch:

```text
MOVE TO GERMANY
Fork age: 31

Median age-45 income
...

Median net worth
...

Family state
...

Goal alignment
...

[Open life]
```

---

# 4. Parallel Lives

Allow selecting perhaps 2–4 branches and viewing them simultaneously.

Show aligned age axis.

Example:

```text
AGE        30      35      40      45

STAY       ───────●───────●───────
GERMANY    ──●──────●────────●─────
BUSINESS   ─────●────────●──────────
```

Important milestones appear.

---

# 5. "Why did this life happen?"

Create a polished explanation system.

For any representative life derive:

```text
MAIN MODEL CONTRIBUTORS
```

Potential categories:

```text
starting financial position
career progression
country conditions
savings behaviour
partner income
children
housing
migration
health interruptions
economic shocks
rare events
```

---

# 6. Explanation hierarchy

Do not overwhelm.

Show:

```text
Top 5 influences
```

then:

```text
Show detailed causal chain
```

---

# 7. Causal chain visualization

Example:

```text
CAREER SWITCH
↓
initial income decline
↓
skill gain
↓
better opportunities
↓
migration became feasible
↓
higher long-term earnings
```

These links must come from model event dependencies.

Do not fabricate natural-language causal stories after the fact.

---

# 8. Counterfactual explanation

For two branches:

```text
WHY DID THESE LIVES DIVERGE?
```

Example:

```text
Until age 31:
identical

Age 31:
migration decision differed

Primary downstream divergence:
housing
career
partner employment
social network
savings
```

This should be one of the strongest features.

---

# 9. Chaos setting

Create user-facing simulation randomness level.

Possible:

```text
CALM
REALISTIC
VOLATILE
WILD
```

Default:

```text
REALISTIC
```

Do not call "Wild" realistic.

---

# 10. Chaos interpretation

### Calm

Fewer stochastic disruptions.

Useful for understanding structural trajectory.

### Realistic

Normal life variability.

Default.

### Volatile

Higher macro/personal shock exposure.

### Wild

Game-oriented tail events.

Clearly label Wild as entertainment-heavy.

---

# 11. Black swan system

Create rare-event infrastructure.

Examples:

```text
unexpected business breakthrough
large financial loss
inheritance
legal settlement abstraction
industry collapse
major relocation opportunity
extraordinary career opportunity
severe macro disruption
```

Avoid tasteless random tragedies.

Do not overuse.

---

# 12. Rare event frequency

Use extremely low event probabilities.

Events should depend on exposure.

Example:

```text
startup acquisition
```

cannot happen if user never owns or invests in a startup.

```text
international executive offer
```

should generally require compatible career path.

---

# 13. Event consequences

Rare events must propagate.

Example:

```text
Business windfall
↓
liquid assets ↑
↓
job exit probability ↑
housing options ↑
retirement flexibility ↑
```

Not simply:

```text
+ money
```

---

# 14. Scenario presets

Create interesting starting modes.

Possible:

```text
MY REAL LIFE
```

User profile.

```text
FRESH START
```

Quick fictional profile.

```text
WHAT IF?
```

Scenario builder.

```text
RANDOM LIFE
```

Generate fictional global starting state.

---

# 15. Random Life mode

This can become a game.

Generate:

```text
country
age
education
career
household
income
goals
constraints
```

using coherent distributions.

Avoid stereotypical country characterization.

---

# 16. Challenge mode — optional but desirable

Create a small number of fictional challenges if time permits.

Example:

```text
DEBT ESCAPE

Age 29
High debt
Low savings
Stable career

Can you reach financial resilience by age 40?
```

or:

```text
SECOND CAREER

Age 45
Career stagnation
Dependents
Moderate savings

Can you successfully retrain?
```

This should reuse the normal simulator.

Do not create a separate fake game engine.

---

# 17. Achievements — optional/lightweight

If appropriate, add non-judgmental discovery achievements such as:

```text
First Fork
Explorer
Three Countries
Second Career
100 Years Simulated
10,000 Futures
```

Avoid:

```text
Got Married!
Had Children!
Became Rich!
```

as universal achievements.

---

# 18. Share a life

Allow share/export of a simulation configuration.

Prefer a compact encoded scenario or downloadable JSON if backend does not exist.

A shared life should preserve:

```text
profile snapshot where privacy-safe
simulation config
seed
scenario interventions
simulation version
economic data version
```

Do NOT publish private life information automatically.

Require explicit user action.

---

# 19. Privacy-first export

Provide:

```text
Share anonymously
```

which strips:

* name,
* exact city,
* free-text personal notes,
* other unnecessary identifiers.

---

# 20. Import

Allow importing a previously exported scenario.

Validate versions.

Gracefully handle old schema.

---

# 21. Simulation versioning

Every run should record:

```text
engineVersion
modelVersion
economicDataVersion
profileSchemaVersion
```

This is crucial.

A future model update should not silently claim an old seed reproduces identically under a new engine.

---

# 22. Replay warning

If an old life is loaded with a newer simulation engine:

offer:

```text
Replay with original model
```

if available,

or:

```text
Recalculate using current model
```

Clearly distinguish.

---

# 23. Save slots

Create usable local save management.

Example:

```text
MY LIVES

Real Life
Career Experiment
Germany Move
Business Path
```

Show:

* last opened,
* model version,
* branch count,
* simulation horizon.

---

# 24. Autosave

Persist important state automatically.

Avoid losing:

* profile,
* branches,
* assumptions,
* selected simulations.

But avoid excessive storage of huge Monte Carlo histories.

---

# 25. Storage strategy

Store:

```text
profile
branch definitions
selected representative seeds
summary results
settings
```

Recompute large datasets where practical.

---

# 26. Model assumptions centre

Create a proper:

```text
HOW THE SIMULATOR THINKS
```

screen.

Explain:

* deterministic randomness,
* income modelling,
* country modelling,
* relationship modelling,
* health abstraction,
* career simulation,
* migration,
* uncertainty,
* limitations.

Use approachable writing.

Not academic walls of text.

---

# 27. "What we don't know"

Explicitly surface:

```text
This model cannot know:

who you will meet
future political events
your exact health
your future motivation
exact visa rules
exact investment returns
future technology
```

Yet it can explore how such uncertainty affects trajectories.

This increases trust.

---

# 28. Model confidence

For outputs support:

```text
HIGHER CONFIDENCE
```

when driven mostly by straightforward arithmetic.

Example:

```text
current savings runway
```

Versus:

```text
LOWER CONFIDENCE
```

for:

```text
relationship state at age 55
```

Do not treat all outputs equally.

---

# 29. Final main dashboard

Create a strong home screen after a profile exists.

Possible structure:

```text
ANAND'S POSSIBILITY SPACE

Current age                     27
Lives simulated             10,000
Branches                         7

CURRENT PATH

[Timeline]

MOST SENSITIVE TO
Career
Savings
Location

OPEN QUESTIONS

What if you changed career?
What if you moved abroad?
What if you saved 10% more?

[Simulate]
```

Do not make it overly dashboard-like.

Preserve game atmosphere.

---

# 30. Fortune-style presentation

Lean slightly into the "modern astrologer" feeling aesthetically.

Example moments:

```text
10,000 FUTURES FOUND
```

```text
YOUR MOST COMMON TURNING POINT
```

```text
THE DECISION THAT CHANGED THIS LIFE
```

```text
A RARE LIFE
```

```text
THE LIVES YOU DIDN'T LIVE
```

But always pair evocative language with clear simulation framing.

---

# 31. Life playback

Refine playback controls.

Allow:

```text
Play
Pause
Previous event
Next event
Speed
```

When playing:

* age advances,
* values interpolate,
* timeline moves,
* milestones appear.

Do not auto-scroll violently.

---

# 32. Ambient sound — optional

If implemented:

* OFF by default,
* user-controlled,
* subtle,
* lightweight.

Possible sounds:

```text
soft tick
timeline transition
branch creation
rare event
simulation complete
```

No casino sounds.

No loud reward loops.

---

# 33. Motion

Use motion meaningfully:

```text
branch growth
timeline reveal
metric transitions
simulation particles
state change
```

Respect:

```text
prefers-reduced-motion
```

---

# 34. Simulation visual

Improve the "thousands of futures" visual.

Potential:

```text
10,000 tiny paths
↓
clusters
↓
representative lives
```

Use performant canvas/WebGL/SVG approach.

Do not create 10,000 DOM elements.

---

# 35. Performance profiling

Profile:

* onboarding,
* 1k simulations,
* 10k simulations,
* multiple branches,
* timeline rendering,
* multiverse rendering,
* mobile.

Find actual bottlenecks.

Do not optimize blindly.

---

# 36. Worker architecture

Ensure heavy simulation does not freeze the main UI.

If not already done well, move Monte Carlo work to Web Workers.

Support:

```text
progress
cancel
error
retry
```

---

# 37. Memory

Do not keep:

```text
10,000 × 70 years × complete giant state object
```

in memory.

Store:

### Aggregate runs

```text
summary checkpoints
terminal outcomes
key metrics
key event flags
```

### Representative lives

```text
full timeline
event history
```

---

# 38. Reproducibility

Create regression fixtures.

Known seed + known profile should produce expected snapshots.

If simulation changes intentionally, update fixtures explicitly.

---

# 39. Property tests

Run many randomized valid profiles.

Invariants:

```text
age never decreases
child age never exceeds impossible relation to birth
currency amount never NaN
household size never negative
net worth calculation remains finite
relationship state machine valid
country exists
timeline events ordered
debt cannot become NaN
probabilities bounded
```

---

# 40. Stress testing

Generate ugly edge cases:

```text
age 18 with no income
age 75 working
many dependents
negative net worth
huge assets
multiple citizenships
migration with partner
no formal education
high professional income
rural entrepreneur
student parent
widowed retiree
informal worker
```

Reality is weird.

Do not make the simulator work only for median users.

---

# 41. Mobile redesign

Do not merely shrink desktop.

Specifically test:

* onboarding,
* timeline,
* branch comparison,
* multiverse,
* country comparison,
* event inspector,
* sliders,
* numeric input.

On mobile:

* sheets,
* stacked comparisons,
* swipeable branch selection,
* vertical timeline

may be better.

---

# 42. Accessibility audit

Check:

* keyboard navigation,
* focus order,
* labels,
* screen reader naming,
* sliders,
* dialogs,
* charts,
* contrast,
* reduced motion,
* non-colour distinction.

For important charts provide text summaries.

---

# 43. Design audit

Revisit:

```text
https://github.com/ibelick/ui-skills
```

Study the relevant guidance again.

Audit every major surface.

Remove:

* unnecessary cards,
* excessive pills,
* inconsistent radii,
* awkward spacing,
* poor hierarchy,
* excessive gradients,
* giant modal forms,
* dead-end buttons,
* hover-only controls,
* decorative clutter.

---

# 44. Visual identity

By final sprint the product should have a recognizable identity.

Possible feeling:

```text
dark observatory
+
strategy game
+
scientific instrument
```

Use:

* restrained palette,
* strong typography,
* luminous trajectory lines,
* quiet grid,
* excellent spacing,
* sharp controls,
* subtle state glow.

Avoid cheesy zodiac imagery.

This is not an astrology website visually.

---

# 45. Final onboarding pass

Re-run onboarding as a first-time user.

Measure:

* confusing questions,
* redundant fields,
* cognitive load,
* unnecessary required fields.

The user should be able to create a useful profile without spending 30 minutes.

Offer:

```text
QUICK START
```

and:

```text
DETAILED PROFILE
```

if appropriate.

---

# 46. Quick Start

A fast version may ask only:

```text
age
country
settlement
education
career
income
savings
debt
relationship
children
top goals
```

Then infer reasonable unknown ranges.

The user can refine later.

---

# 47. Detailed profile

Keep richer inputs available.

Never require all advanced variables.

---

# 48. Unknown-value uncertainty

If important inputs are missing, simulation should widen uncertainty rather than silently invent one precise value.

Example:

```text
Income unknown
```

could sample from:

```text
occupation × country distribution
```

instead of inserting a single median.

---

# 49. Missing-data sampling

Use deterministic sub-seeds for unknown inputs.

Same seed should reproduce the same sampled latent starting value.

Monte Carlo runs can sample different plausible values where uncertainty is intended.

---

# 50. Uncertainty decomposition

If feasible show:

```text
Your outcome range is wide mainly because:

Future career              31%
Unknown expense level      18%
World conditions           15%
Relationship path          12%
Other                      24%
```

Only do this if mathematically grounded.

---

# 51. Final landing page

Refine first impression.

Do not use generic SaaS hero sections.

Possible:

```text
YOU HAVE MORE THAN ONE FUTURE.

Build your present.
Simulate thousands of lives.
Change one decision.
Watch everything diverge.

[Build my life]
[Play a random life]
```

Provide a living trajectory preview.

---

# 52. Legal/product language

Keep modest persistent disclaimer:

```text
Life Simulator explores modelled scenarios.
It is not financial, medical, legal, immigration or psychological advice.
```

Do not interrupt normal gameplay with giant warnings.

---

# 53. No dark patterns

No:

* fake urgency,
* "your future expires",
* fear-based retention,
* fake psychic certainty,
* manipulative predictions.

The product's intrigue should come from exploration.

---

# 54. Final README

Document:

* what the simulator is,
* architecture,
* local setup,
* simulation design,
* deterministic seed system,
* economic calibration system,
* assumptions,
* test strategy,
* known limitations.

Include:

```text
npm/pnpm/yarn commands
```

appropriate to the repository.

---

# 55. Architecture documentation

Create/update docs covering:

```text
simulation-engine.md
economic-model.md
country-model.md
counterfactuals.md
data-provenance.md
```

Adapt filenames to existing documentation conventions.

---

# 56. Economic model documentation

Especially document Sprint 9 clearly.

Explain:

```text
nominal income
relative local income
disposable income
PPP/purchasing power abstraction
occupation multipliers
settlement modifiers
fallback hierarchy
confidence
inflation
cost model
```

A future developer should understand how ₹50,000 and €2,500 are interpreted differently.

---

# 57. Final test matrix

Test at least fictional profiles roughly representing:

```text
young rural worker in lower-income economy
urban student in emerging economy
mid-career worker in high-income high-cost economy
parent in strong welfare state
informal worker
freelancer
small business owner
high-income executive
migrant
retiree
career changer
single parent
dual-income household
large extended household
```

Do not stereotype.

These are architecture test cases.

---

# 58. Cross-country economic test

Use the same occupation and age in multiple country fixtures.

Verify:

```text
salary changes
costs change
purchasing power changes
tax approximation changes
housing burden changes
```

but outcomes remain plausible.

---

# 59. Country-switch regression

Migration must update:

```text
currency
salary expectations
costs
housing
purchasing power
social systems
```

without corrupting prior historical amounts.

Historical amounts remain denominated/represented correctly.

---

# 60. Financial continuity

When user migrates:

```text
existing savings
```

must not disappear.

Convert economic meaning carefully.

Preserve original asset currency where architecture supports it or perform documented conversion into simulation accounting currency.

Do not silently reinterpret:

```text
₹10 lakh
```

as:

```text
€10 lakh.
```

---

# 61. Final outcome page

At simulation end, do not merely say:

```text
You ended with $X.
```

Instead show something like:

```text
AGE 72

FINANCIAL POSITION
Strong

CAREER
Retired at 64

FAMILY
Partnered
2 adult children

HEALTH
Moderate

LOCATION
...

GOAL ALIGNMENT
High

MAJOR TURNING POINTS
Age 31 — career switch
Age 37 — migration
Age 42 — child
Age 49 — recession
Age 57 — business opportunity

THE DECISION WITH THE LARGEST MODELLED EFFECT
Career switch at 31
```

---

# 62. Don't end at retirement

Life does not stop after work.

Later years may include:

```text
retirement
health
partner
children leaving
grandchildren abstraction if appropriate
caregiving
widowhood
relocation
financial drawdown
leisure
social connection
```

No need for excessive detail.

But the timeline should remain meaningful.

---

# 63. Retirement economics

Model:

```text
retirement age
assets
pension/social support abstraction
drawdown
housing
health costs
```

Country context matters.

Do not assume US 401(k)-style systems.

---

# 64. Longevity

Do not present:

```text
You will die at 83.
```

Instead a representative seed may naturally end at a simulated age.

Distribution view should treat longevity statistically.

Avoid dramatic "death countdown" UI.

---

# 65. Simulation ending

Possible presentation:

```text
This simulated life ended at age 86.
```

Then:

```text
Explore another life
Rewind
Compare
```

Keep respectful.

---

# 66. Final quality bar

The final product should allow this loop:

```text
CREATE ME
↓
SIMULATE 10,000 LIVES
↓
EXPLORE FUTURES
↓
OPEN ONE LIFE
↓
WATCH TIMELINE
↓
REWIND
↓
CHANGE DECISION
↓
SIMULATE AGAIN
↓
COMPARE
↓
EXPLORE COUNTRY / CAREER / FAMILY ALTERNATIVES
↓
BUILD MULTIVERSE
```

If this loop does not feel smooth, keep refining.

---

# 67. Sprint 10 acceptance criteria

Sprint 10 is complete only when:

* Life Multiverse works;
* multiple branches are navigable;
* parallel-life comparison works;
* "Why did this life happen?" works;
* counterfactual explanations work;
* realistic chaos system works;
* rare events are contextual;
* simulation versioning works;
* save/load works;
* export/import works;
* privacy-safe sharing exists;
* economic model assumptions are documented;
* model confidence is exposed;
* final timeline is polished;
* mobile works;
* accessibility is acceptable;
* performance is acceptable;
* 10k-life simulations remain usable on target hardware or automatically reduce workload;
* no major console errors;
* lint passes;
* typecheck passes;
* tests pass;
* production build passes.

Commit:

```text
feat(sprint-10): complete multiverse explainability and production polish
```

Push.

STOP.

Give me a full final report.

---

# CRITICAL ECONOMIC RULES — APPLY ACROSS THE ENTIRE CODEBASE

Before finishing Part 3, audit all previous sprints for violations.

Search for:

```text
hardcoded salary
hardcoded rent
hardcoded USD
hardcoded childcare
hardcoded tuition
hardcoded house price
hardcoded healthcare cost
hardcoded migration cost
hardcoded income raise
```

Replace global constants with context-aware rules where appropriate.

---

# NEVER DO THIS

```ts
teacherSalary = 45000;
softwareEngineerSalary = 90000;
rent = 1800;
childCost = 1200;
```

unless values belong to an explicit fictional fixture.

---

# PREFER THIS

```text
country labour baseline
× occupation factor
× experience
× seniority
× settlement
× macro regime
```

and:

```text
country cost baseline
× household
× settlement
× public-support environment
```

---

# RELATIVE VALUES ARE OFTEN MORE IMPORTANT

Throughout the UI favour metrics such as:

```text
Income percentile
Disposable income
Housing burden
Savings rate
Months of emergency runway
Debt service ratio
Real income growth
Purchasing power
Household-adjusted resources
```

alongside nominal values.

---

# COUNTRY DATA SHOULD BE MODULAR

Do not create one giant country object containing every derived number manually.

Separate:

```text
Country identity
Economic raw data
Economic derived data
Simulation coefficients
Confidence/provenance
```

The model should eventually be able to upgrade from estimated data to real datasets without changing core simulation APIs.

---

# EXTRAPOLATION SHOULD BE HIERARCHICAL

For every unknown economic value ask:

```text
Do we know country-specific value?

If no:
Do we know country-cluster value?

If no:
Do we know regional relationship?

If no:
Can global value be scaled using economic indicators?

If no:
Use conservative fallback and mark low confidence.
```

Never silently insert a random arbitrary amount.

---

# COUNTRY CLUSTERING SHOULD BE MULTIDIMENSIONAL

Do not classify:

```text
rich
poor
```

only.

Cluster using dimensions such as:

```text
income
price level
inequality
welfare
inflation stability
housing pressure
labour mobility
```

Two countries with similar GDP may have dramatically different household economics.

---

# USER-SPECIFIC ECONOMIC POSITION

Whenever possible, interpret the person relative to their society.

Example:

```text
User A
Income: $35k equivalent
Country: low-cost middle-income economy
Position: high locally

User B
Income: $35k
Country: high-cost wealthy economy
Position: modest locally
```

Their simulated lifestyles should diverge.

---

# HOUSEHOLD CONTEXT MATTERS

A salary must always interact with:

```text
household size
dependents
partner income
care obligations
housing
```

Income alone is not quality of life.

---

# ECONOMIC CHANGE OVER TIME

Never freeze country economics for 50 years.

Allow:

```text
wages
prices
housing
interest
unemployment
```

to evolve under simulated macro regimes.

But constrain long-term extrapolation.

Do not allow exponential nonsense.

---

# LONG-HORIZON STABILITY

For 50+ year runs:

Prefer:

```text
mean reversion
regime changes
bounded growth assumptions
```

instead of blindly compounding one rate forever.

Example:

Do not assume:

```text
7% wage growth × 50 years
```

without changing regime.

---

# OUTLIERS

Outlier financial success should emerge through actual mechanisms.

For example:

```text
business success
ownership
executive career
valuable specialist skills
international opportunity
investment luck
```

Do not simply assign random giant wealth.

---

# ECONOMIC DOWNSIDE

Likewise financial difficulty should arise from combinations such as:

```text
job loss
high housing burden
dependents
health expenses
inflation
debt
business failure
macro recession
```

not:

```text
randomly lose 70% of money.
```

---

# GAME DESIGN PRINCIPLE

Despite all this modelling complexity, never expose the user to a wall of equations.

The engine can be sophisticated.

The interface should remain intuitive.

User asks:

```text
What if I move to Japan?
```

The simulator handles:

```text
wages
costs
housing
migration friction
language
family
career
```

and returns understandable consequences.

---

# PERFORMANCE PRINCIPLE

Precompute reusable local economic coefficients.

Do not recalculate complex country normalization thousands of times unnecessarily.

For each simulation configuration, create an economic context:

```ts
EconomicContext
```

that contains the relevant normalized values.

Reuse it across Monte Carlo runs.

---

# FINAL DESIGN PASS

Before Sprint 10 completion, review every major interface against UI Skills.

Pay particular attention to:

* slider quality,
* visual hierarchy,
* interactive states,
* branch exploration,
* event details,
* comparison,
* mobile,
* accessibility,
* density,
* motion.

This product contains enormous complexity.

The UI must make that complexity feel manageable.

---

# FINAL AGENT INSTRUCTION

Inspect the repository and git history.

Determine the earliest incomplete sprint among:

```text
Sprint 8
Sprint 9
Sprint 10
```

Execute ONLY that sprint.

Do not skip acceptance criteria.

Do not start the next sprint automatically.

Complete the sprint.

Test thoroughly.

Commit.

Push to:

```bash
git@github.com:shivam4tech/life-simulator.git
```

Then STOP.

Tell me exactly what you built and ask me to run/review it.
