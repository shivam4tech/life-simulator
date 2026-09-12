# LIFE SIMULATOR — MASTER DEVELOPMENT PROMPT

## PART 2 OF 3 — SPRINTS 5–7

### Human Relationships → Career Reinvention → Migration & Global Opportunity

Continue development of the Life Simulator from the state produced by Part 1.

Canonical repository:

```bash
git@github.com:shivam4tech/life-simulator.git
```

Design-engineering reference:

```text
https://github.com/ibelick/ui-skills
```

You must continue following the project's established architecture and the UX/design principles already introduced.

Do not rebuild completed systems merely because you would have implemented them differently.

Inspect the repository, git history, documentation, tests, and previous sprint commits before starting.

---

# EXECUTION PROTOCOL

This prompt contains:

* Sprint 5
* Sprint 6
* Sprint 7

You MUST execute only **ONE sprint per invocation**.

Determine the earliest incomplete sprint.

For that sprint:

1. inspect the existing implementation;
2. review relevant UI Skills guidance;
3. understand the existing simulation architecture;
4. implement the sprint fully;
5. add/update tests;
6. run lint;
7. run typecheck;
8. run automated tests;
9. run production build;
10. inspect the UI manually where possible;
11. fix regressions;
12. update documentation/model assumptions;
13. commit the sprint;
14. push it to the canonical repository;
15. STOP.

Never automatically start the next sprint.

At completion tell me:

* sprint completed,
* commit hash,
* features completed,
* simulation systems changed,
* test/build results,
* exact command to run locally,
* scenarios I should manually test,
* known limitations.

Then ask me to run and review it.

Only continue when I explicitly tell you to proceed.

---

# PRODUCT REMINDER

The Life Simulator models a **possibility space**, not destiny.

It should have some of the experiential appeal historically provided by astrology or fortune telling:

> "Show me what my future might look like."

But unlike astrology, every simulated future should emerge from:

* explicit state,
* model assumptions,
* user decisions,
* country conditions,
* world conditions,
* demographic processes,
* economics,
* behavioural tendencies,
* path dependence,
* seeded stochastic events.

Never pretend that the system knows someone's future.

Use phrases such as:

```text
In this simulated life...
Across these simulations...
Under these assumptions...
This path became more common when...
```

rather than:

```text
You will...
You are destined to...
This definitely happens...
```

---

# GLOBAL-FIRST REQUIREMENT

Everything introduced in these sprints must work conceptually for users across:

* Africa,
* Asia,
* Europe,
* North America,
* South America,
* Oceania,
* wealthy economies,
* emerging economies,
* lower-income economies,
* urban users,
* rural users,
* migrants,
* citizens,
* temporary residents,
* traditional households,
* nontraditional households.

Do not silently encode one country's assumptions as universal human behaviour.

---

# MODELLING PRINCIPLE: PEOPLE ARE EMBEDDED SYSTEMS

A person's life should increasingly be understood through:

```text
World
  ↓
Country
  ↓
Region / settlement
  ↓
Household
  ↓
Person
  ↕
Partner
  ↕
Children / dependents
  ↕
Extended family
```

These systems affect one another.

Examples:

A career move may increase salary but:

* reduce time with partner,
* require migration,
* increase childcare costs,
* weaken family support,
* improve long-term savings.

A child may:

* increase household expenses,
* reduce available working hours,
* alter housing needs,
* change migration decisions,
* affect relationship pressure,
* alter life satisfaction differently depending on user goals.

These interconnected consequences are essential.

---

# SPRINT 5 — RELATIONSHIPS, PARTNERS, CHILDREN & HOUSEHOLD LIFE

## Goal

Transform relationships and family from simplistic event labels into persistent, interacting simulation systems.

At the end of this sprint, a user's simulated life should be capable of evolving through:

* meeting partners,
* relationships,
* long-term partnership,
* marriage where relevant,
* cohabitation,
* separation,
* divorce,
* remarriage,
* children,
* child-related costs,
* household formation,
* elder/family obligations,
* widowhood,
* changing family structure.

Do not create soap-opera randomness.

Relationships must arise from state, preferences, social exposure, partner compatibility, life stress and seeded stochastic variation.

---

# 1. Partner agent architecture

Introduce a lightweight `PartnerState`.

A partner should not be merely:

```ts
hasPartner: true
```

The partner should become a lightweight simulated person.

Include a practical subset of variables such as:

```text
age
education level
employment state
occupation family
income
career trajectory
health
relationship goals
children preference
migration preference
financial behaviour
risk tolerance
social orientation
relationship compatibility dimensions
```

Do not simulate partners with the exact depth of the primary user yet.

Use a compact model.

---

# 2. Partner generation

When a relationship event occurs, generate a persistent partner from:

* user's age,
* country,
* region/settlement type,
* social exposure,
* preferences,
* education environment,
* occupational environment,
* seeded randomness.

Do not generate absurdly perfect partners.

Do not create stereotyped partners based solely on nationality or gender.

Persist that partner's identity and simulation seed.

The same relationship event replayed under the same seed should create the same partner.

---

# 3. Compatibility

Create multidimensional compatibility rather than one mystical percentage.

Possible factors:

```text
values alignment
children preferences
financial behaviour
career ambition
migration willingness
lifestyle
risk tolerance
social orientation
relationship goals
life-stage compatibility
```

Internal compatibility can affect relationship transitions.

Avoid presenting it as scientifically exact.

UI might communicate:

```text
Strong alignment
Moderate alignment
Major tension
```

rather than:

```text
83.274% soulmates
```

---

# 4. Relationship state machine

Build a clear state machine.

Possible states:

```text
single
dating
committed relationship
cohabiting
married / formal partnership
separated
divorced
widowed
```

Support cultural variation.

Do not require formal marriage for a stable household.

Transitions should depend on:

* user preference,
* partner preference,
* compatibility,
* relationship duration,
* finances,
* children,
* stress,
* health shocks,
* employment changes,
* migration,
* social context,
* deterministic randomness.

---

# 5. Relationship dynamics

Track broad persistent variables such as:

```text
relationship satisfaction
relationship stability
shared financial pressure
time pressure
major unresolved tension
support level
```

These may evolve slowly.

Avoid rapid year-to-year random oscillation.

---

# 6. Separation and divorce

Implement separation carefully.

Relationship breakdown probability may increase through combinations of:

* sustained low satisfaction,
* incompatibility,
* major financial stress,
* repeated unemployment,
* migration disagreement,
* severe time pressure,
* conflicting children preferences,
* life-stage divergence,
* deterministic shocks.

Do not model:

```text
money low = automatic divorce
```

Use interacting factors.

A separation/divorce should have consequences:

```text
housing changes
household income changes
asset/debt changes
childcare/custody expenses
emotional wellbeing impact
social network impact
relocation
future relationship likelihood
```

Keep legal/financial settlement modelling broad globally.

Do not assume one jurisdiction's divorce law.

---

# 7. Remarriage / later relationships

Allow future partnership after:

* breakup,
* divorce,
* widowhood.

Age should modify social exposure and relationship dynamics without making later relationships impossible.

---

# 8. Children as lightweight agents

Create a `ChildState`.

At minimum:

```text
id
age
birth/adoption year
dependency stage
education stage
health burden category
living arrangement
```

Children should persist over time.

Do not store only:

```text
childrenCount = 2
```

because their ages matter.

---

# 9. Child arrival

Respect:

* user preference,
* partner preference,
* age/life stage where relevant,
* relationship state,
* household finances,
* country demographic context,
* deliberate user choices,
* deterministic randomness.

Support:

* biological child at broad simulation level,
* adoption as a possible explicit route,
* choosing not to have children.

Do not make claims about individual fertility.

Do not perform medical fertility prediction.

---

# 10. Child life stages

At least model:

```text
infancy
early childhood
school age
adolescence
young adulthood
independent adulthood
```

Different stages affect:

* childcare costs,
* education expenses,
* time requirements,
* housing,
* parental working hours,
* household stress.

---

# 11. Country-sensitive child costs

Child-related effects must interact with country context.

Examples:

```text
childcare availability
education costs
healthcare support
family benefits
housing pressures
parental leave environment
```

Do not hardcode US childcare economics globally.

Use the CountryProfile abstraction.

Where real data is absent, use explicitly labelled modelling assumptions.

---

# 12. Extended family

Implement lightweight family obligation systems:

```text
parental financial dependency
elder care
family support
remittances
family business obligations
inheritance possibility
```

Users may already specify these at onboarding.

Now make them active in simulation.

For example:

```text
Parent care requirement increases
↓
free time falls
↓
relocation becomes harder
↓
household expenses rise
```

---

# 13. Household engine

Make `HouseholdState` dynamic.

Track:

```text
household members
income earners
dependents
housing
combined income
shared expenses
child expenses
care expenses
housing requirements
household financial resilience
```

When a partner enters/leaves, household finances should change coherently.

---

# 14. Partner careers

Partner career should evolve in lightweight fashion.

Support:

* income progression,
* unemployment,
* career interruption,
* migration impact,
* parental/caregiving reduction,
* retirement.

This can materially affect the primary user's life.

---

# 15. Joint decisions

Introduce the architecture for decisions involving both partners.

Examples:

```text
Move country?
Have another child?
Buy a home?
One partner studies?
One partner stops working temporarily?
```

Full user-driven intervention system may be expanded later.

For now, allow the simulation to resolve these using preferences/state.

Store reasons.

---

# 16. Relationship events in timeline

Improve timeline visualization.

Relationship events should visually distinguish:

```text
met partner
relationship began
moved together
married/formalized partnership
child born/adopted
relationship stress period
separation
divorce
remarriage
widowhood
child left household
```

Avoid sensational design.

---

# 17. Family timeline layer

Add a timeline filter:

```text
Family
```

Potential visualization:

```text
Age 28   Met partner
Age 31   Moved together
Age 34   First child
Age 37   Second child
Age 44   Parent care obligation increased
Age 53   First child became independent
```

This will make the simulation feel much more human.

---

# 18. Household visualization

When selecting an age, show household composition.

Example:

```text
AGE 41

HOUSEHOLD

You                  41
Partner              39
Child                 8
Child                 4

Income earners         2
Dependents             2
Combined income        ...
Housing                Renting
```

Use elegant visualization rather than spreadsheets everywhere.

---

# 19. Relationship uncertainty UI

Never show:

```text
DIVORCE PROBABILITY: 54.738%
```

as authoritative.

If distribution statistics are shown, communicate uncertainty appropriately:

```text
Relationship ended in:
18% of comparable simulation runs
```

and explain that this reflects the current model assumptions rather than a prediction of the user's real relationship.

---

# 20. Outcome effects

Relationship/family systems should affect:

* money,
* career,
* location,
* housing,
* health/wellbeing,
* leisure,
* freedom,
* family-goal alignment,
* stability.

Do not automatically treat:

```text
married = good
divorced = bad
children = good
single = bad
```

Outcome interpretation should depend on user goals.

---

# 21. Stress tests

Test profiles such as:

```text
single + definitely no children
married + 3 children
divorced parent
single parent
partner earns much more
partner unemployed
elder-care obligations
living with extended family
child-free couple
high-income dual-career household
low-income household with dependents
```

Make sure all remain numerically stable.

---

# 22. Sprint 5 acceptance criteria

At the end:

* PartnerState exists.
* ChildState exists.
* partners persist.
* children age.
* household composition changes.
* relationship transitions are stateful.
* divorce/separation affects household.
* later relationships work.
* family obligations influence simulation.
* partner income affects household.
* family timeline works.
* deterministic replay still works.
* tests cover new state machines.
* no relationship state contradictions occur.
* build/lint/typecheck/tests pass.

Commit:

```text
feat(sprint-5): deepen relationships family and household simulation
```

Push.

STOP.

Ask me to run it.

---

# SPRINT 6 — CAREER REINVENTION, EDUCATION & LIFE DECISION LAB

## Goal

Make work and education deeply interactive.

At the end of this sprint users should be able to ask:

> What happens if I change jobs?

> What if I retrain?

> What if I enter another career?

> What if I study for another qualification?

> What if I start a business?

> What if I work less?

> What if I become unemployed?

And compare those futures against the baseline simulation.

This should become one of the game's strongest systems.

---

# 1. Occupation model

Expand occupation modelling without attempting to store every job title in the world.

Use generic occupation families plus attributes.

Each occupation/career path may include properties such as:

```text
skill requirements
education requirement
credential barrier
physical intensity
remote compatibility
income range
income ceiling
job stability
automation exposure
career mobility
entrepreneurial applicability
international transferability
```

These should be modelling dimensions, not universal truths.

---

# 2. CareerState

Expand career state to include:

```text
occupation family
industry
seniority
experience
career capital
specialized skills
transferable skills
credentials
earnings
job stability
job satisfaction
hours
remote compatibility
management experience
network strength
```

---

# 3. Career capital

Introduce a concept representing accumulated career advantages:

```text
experience
skills
reputation
network
credentials
industry knowledge
management experience
```

This persists even when salary falls.

Example:

```text
Age 32
startup failed

money ↓
debt ↑
stress ↑

but:

management skill ↑
network ↑
commercial experience ↑
```

Therefore later opportunities can improve.

This is important for path dependence.

---

# 4. Career-switch distance

Create a model measuring how difficult a transition is from Current Career A to Target Career B.

Factors might include:

```text
skill overlap
education gap
credential gap
experience transfer
salary reset
country-specific opportunity
industry demand
network relevance
training cost
time requirement
```

Return understandable classifications such as:

```text
Easy transition
Moderate transition
Difficult transition
Major retraining required
Credential-gated
```

Avoid false precision.

---

# 5. Career explorer

Create an interactive Career Lab.

The user should be able to browse/search occupation families and select a possible destination.

The UI should compare:

```text
CURRENT PATH
vs
TARGET PATH
```

Show:

* transition difficulty,
* skills already possessed,
* important gaps,
* likely training time,
* estimated training cost assumptions,
* initial income effect,
* long-term income potential,
* stability,
* flexibility,
* international mobility,
* major risks.

Use sliders/toggles where scenario manipulation makes sense.

---

# 6. Career scenario simulation

A user selects:

```text
Switch career at age 30
```

or:

```text
Begin retraining now
```

The simulation should fork from current state.

Create:

```text
Baseline
Career Switch
```

Run thousands of lives for both.

Compare distributions.

Do not simply calculate one expected salary.

---

# 7. Job change

Allow simpler intervention:

```text
Look for another job
```

Variables:

```text
target salary improvement
willingness to relocate
industry change allowed
remote only?
risk tolerance
maximum unemployment duration acceptable
```

Simulate consequences.

---

# 8. Education / retraining

Create a generic education intervention system.

Options:

```text
Short training
Vocational qualification
Short-cycle tertiary
Bachelor-equivalent
Master-equivalent
Doctoral/professional
Professional credential
Self-directed skill programme
```

Do not hardcode one country's degree system.

---

# 9. Education opportunity costs

Education should not magically increase success.

Account for:

```text
tuition/training cost
lost income
reduced work hours
debt
time
completion probability
skill improvement
credential value
career access
country context
```

Example:

```text
2-year retraining programme

Immediate:
Income ↓
Savings ↓

Later:
Career options ↑
Income ceiling ↑
Migration options ↑
```

---

# 10. Completion and dropout

Education pathways may:

```text
complete normally
take longer
be abandoned
```

depending on:

* household obligations,
* finances,
* discipline,
* health,
* work hours,
* stochastic shocks.

Do not moralize about dropout.

---

# 11. Business / self-employment

Introduce a first meaningful entrepreneurial pathway.

User scenario:

```text
Start a business
```

Parameters:

```text
starting capital
full-time / side business
industry family
risk tolerance
runway
```

Simulate states such as:

```text
early growth
stable small business
failure
high growth
shutdown
restart
```

Do not make startup success unrealistically common.

Business failure must create path-dependent consequences.

---

# 12. Side income

Support:

```text
freelance
gig work
side business
second job
```

Effects:

```text
income ↑
time ↓
stress ↑
skills/network potentially ↑
```

---

# 13. Working hours

Allow user intervention:

```text
Work less
Work more
```

This may affect:

* income,
* health,
* relationships,
* leisure,
* career progression,
* parenting/care obligations.

---

# 14. Unemployment resilience

Improve unemployment simulation.

Track:

```text
cash runway
household support
social protection
partner income
skills
network
local labour conditions
```

Two people losing the same job should not have identical consequences.

---

# 15. Career recommendation engine

Add a non-LLM recommendation layer.

It should identify potentially reachable paths from the user's state.

Do not merely rank by salary.

Consider:

```text
transition distance
time to qualify
expected income gain
career stability
skill overlap
training cost
country demand
user preferences
remote potential
migration potential
```

Possible output:

```text
Strong Fits

Operations → Project Management
Accounting → Financial Analysis
Sales → Account Management

Longer-Term Fits

Operations → Data Analysis
Finance → Software Engineering
```

Clearly explain why.

---

# 16. Recommendations should be interactive

Each suggested transition should support:

```text
Simulate this path
```

Clicking it should create a counterfactual branch.

---

# 17. Decision Lab architecture

Create a reusable scenario/fork system.

A `ScenarioBranch` should include something like:

```ts
id
name
parentScenario
forkDate
startingState
interventions
assumptions
simulationConfig
results
```

This architecture will power many future features.

---

# 18. Scenario interventions

Design typed interventions such as:

```text
ChangeJob
ChangeCareer
StartEducation
StartBusiness
ChangeSavingsRate
ChangeWorkingHours
Relocate
HaveChild
DelayChild
BuyHome
```

Not every intervention needs UI yet.

But create an extensible command/event model.

---

# 19. Baseline vs scenario comparison

Create a strong comparison interface.

Example conceptual design:

```text
BASELINE                CAREER SWITCH

Income age 40
P50  ...                ...

Net worth
P50  ...                ...

Career satisfaction
...                      ...

Stress
...                      ...

Relocation probability
...                      ...

Goal alignment
...                      ...
```

Use aligned plots/ranges.

Avoid giant tables.

---

# 20. Delta visualization

Show:

```text
+ higher
- lower
≈ similar
```

and ranges.

Example:

```text
By age 40

Median income        +18%
Median net worth      +4%
Career stability      +9%
Stress                +12%
Free time             -15%
```

Numbers must derive from simulation results.

---

# 21. Break-even analysis

For education or retraining, calculate things such as:

```text
When does the alternative path financially catch up with baseline?
```

Output:

```text
Median break-even:
Age 36

25th–75th percentile:
Age 34–42

19% of simulations never financially overtake baseline.
```

This is much more useful than:

```text
Degree pays off.
```

---

# 22. Tradeoff explanation

Explain scenario consequences in plain language.

Example:

```text
The retraining path increases long-term career mobility but creates a 3–5 year period of lower savings.
```

Do this using deterministic derived data/templates.

Do not require external LLMs.

---

# 23. Timeline branching

Visualize the scenario fork.

Example:

```text
                     BASELINE
                  ───────────────→
AGE 29 ─────────●
                  ───────────────→
                     RETRAIN
```

Allow jumping between branches.

---

# 24. Scenario naming

Default:

```text
Baseline
Career switch
Study again
Start business
```

Allow custom names.

---

# 25. Reset / duplicate

Users should be able to:

* duplicate branch,
* change one assumption,
* rerun,
* delete branch,
* reset.

Use deliberate safeguards where destructive.

---

# 26. Sprint 6 tests

Test:

* career transitions,
* impossible/credential-gated transitions,
* education completion,
* education dropout,
* opportunity cost,
* business failure/success states,
* baseline/scenario deterministic replay,
* scenario isolation,
* branch deletion,
* extreme incomes,
* unemployed users,
* students,
* retired users.

---

# 27. Sprint 6 acceptance criteria

At completion:

* Career Lab exists.
* Career-switch distance works.
* retraining works.
* education intervention works.
* business pathway exists.
* job-change scenario exists.
* working-hours intervention exists.
* non-LLM career recommendations work.
* baseline/scenario branching works.
* timelines display forks.
* outcome comparison works.
* break-even analysis works where appropriate.
* deterministic simulation remains intact.
* build/lint/typecheck/tests pass.

Commit:

```text
feat(sprint-6): add career education and counterfactual decision lab
```

Push.

STOP.

Ask me to run it.

---

# SPRINT 7 — GLOBAL MIGRATION ENGINE + COUNTRY COMPARISON + WORLD DYNAMICS

## Goal

Make geography truly matter.

At the end of this sprint, users should be able to explore questions such as:

> What happens if I remain where I am?

> What if I move to another city?

> What if I move abroad?

> Which countries might materially improve my career trajectory?

> Which countries improve financial security but reduce family proximity?

> Is migration worth the short-term cost?

This is not a visa advice product.

This is a life simulation system that models migration as a major life decision.

---

# 1. Separate concepts carefully

Model:

```text
Country of citizenship
Country of residence
Residency/immigration status
Region
Settlement type
```

separately.

A foreign resident and citizen in the same country may face different constraints.

---

# 2. CountryProfile expansion

Expand CountryProfile into coherent dimensions.

Suggested categories:

## Economy

```text
income level
wage distribution
economic growth regime
inflation regime
unemployment
economic volatility
```

## Employment

```text
labour demand
career mobility
employment protection
informal employment prevalence
entrepreneurship environment
remote-work compatibility
```

## Living costs

```text
general price level
housing burden
transport burden
healthcare burden
childcare burden
education cost burden
```

## Institutions

```text
institutional stability
personal safety
rule-of-law proxy
bureaucratic friction
```

## Social systems

```text
healthcare access
education access
unemployment protection
family benefits
retirement support
```

## Migration

```text
immigration accessibility
credential recognition friction
language barriers
long-term residency possibility
citizenship pathway abstraction
```

Do not pretend these temporary model coefficients are objective ratings.

---

# 3. Country data architecture

Strictly separate:

```text
raw factual datasets
```

from:

```text
derived normalized indicators
```

from:

```text
simulation coefficients
```

Example:

```text
raw:
unemployment = X

derived:
labourMarketStrength = ...

simulation:
jobLossModifier = ...
```

This separation is extremely important.

---

# 4. Data provenance

Create metadata allowing future real datasets to record:

```text
source
year
last updated
method
confidence
```

Temporary seed assumptions should explicitly say:

```text
source: internal placeholder model
```

Never disguise invented development values as live statistics.

---

# 5. Country presets

For development, provide broad country coverage.

Do not manually build every nation's detailed coefficients if this becomes unsustainable.

Instead use:

```text
country metadata
+
regional/economic archetypes
+
country overrides
```

Example conceptual archetypes:

```text
high-income strong welfare
high-income market-oriented
high-income high-cost
emerging industrial
rapid-growth emerging
middle-income volatile
resource-heavy economy
lower-income developing
small high-income economy
```

Countries should still retain multidimensional differences.

Do not create a simplistic:

```text
Country tier A/B/C
```

user-facing system.

---

# 6. Country clustering

Internally, clustering is acceptable for fallback modelling.

But use multiple dimensions.

Avoid:

```text
good country
bad country
```

Prefer:

```text
high wages
high housing costs
strong welfare
moderate labour mobility
high stability
```

---

# 7. Regional differences

Support at least:

```text
Rural
Small town
Secondary city
Major city
Global/megacity
```

Country + settlement archetype should alter:

* income opportunity,
* costs,
* housing,
* transport,
* labour access,
* social exposure.

Do not require detailed city databases yet.

---

# 8. Migration intervention

Create:

```text
Relocate
```

as a first-class scenario intervention.

Support:

```text
Domestic relocation
International relocation
```

---

# 9. Migration costs

Migration must include:

```text
travel
initial housing/deposit
administrative costs
temporary unemployment
credential conversion
language training
moving household
loss of local support network
```

Not every migration succeeds immediately.

---

# 10. Migration feasibility

Create a broad feasibility model considering:

```text
citizenship
education
occupation
credentials
language
age
income
savings
target country
family structure
partner career
```

Do NOT label this:

```text
visa approval probability
```

unless eventually grounded in jurisdiction-specific legal rules.

Use:

```text
migration feasibility
```

and clearly state that it is a simulation abstraction.

---

# 11. Language

Add language proficiency support if not already present.

Generic levels may be:

```text
none
basic
conversational
professional
fluent/native-like
```

Language can affect:

* migration feasibility,
* job options,
* integration,
* career progression.

Do not assume English everywhere.

---

# 12. Credential transferability

Occupations differ dramatically.

Model broad categories:

```text
highly transferable
moderately transferable
credential review required
strongly regulated
country-specific
```

Examples:

Technology may transfer relatively easily.

Medicine/law may require significant requalification.

Do not hardcode specific legal rules yet.

---

# 13. Migration impact on partner

If partnered:

```text
primary user's opportunity ↑
```

may coexist with:

```text
partner career ↓
```

Partner should have:

```text
migration willingness
career transferability
language compatibility
```

This affects household migration decisions.

---

# 14. Children and migration

Children should affect:

* moving cost,
* housing,
* education,
* stability preference,
* timing.

Again, broad modelling only.

---

# 15. Social network loss/rebuild

Migration should initially reduce local support/network.

Over time:

```text
integration
professional network
social network
community ties
```

can recover.

This adds path dependence.

---

# 16. Remittances

For globally realistic modelling, support:

```text
send money home
```

especially following migration.

This can affect:

* savings,
* family wellbeing,
* migration benefit.

Do not assume migrants always remit.

---

# 17. Migration recommendation engine

Create:

```text
Explore destinations
```

The engine should identify countries that may fit the user's current state.

Do NOT simply rank:

```text
highest GDP per capita
```

Consider:

```text
career compatibility
wage upside
cost of living
migration friction
language
credential transferability
family needs
user goals
partner impact
stability
```

---

# 18. Destination ranking should be goal-dependent

If user's priorities are:

```text
Career 10
Wealth 10
Family proximity 2
```

recommendations may differ from:

```text
Family 10
Security 9
Career 5
```

Do not universally claim one country is best.

---

# 19. Destination cards

Possible UI:

```text
GERMANY

Career fit        Strong
Migration friction Moderate
Language gap      High
Financial upside  Moderate
Family impact     Mixed
Stability         Strong

Why it appears:
• occupation transferability
• wage improvement
• user's relocation openness

Main friction:
• language
• initial moving cost

[Simulate move]
```

No fake official visa claims.

---

# 20. Country comparison

Allow selecting perhaps 2–4 destinations:

```text
Stay
Germany
UAE
Canada
```

Compare:

```text
income
purchasing power
net worth
career progression
housing burden
migration cost
family impact
healthcare burden
child-related cost
stability
goal alignment
```

Use percentile/distribution plots where possible.

---

# 21. Purchasing power

Do not compare salaries naïvely.

If salary rises from:

```text
₹X → €Y
```

the engine should care about:

```text
local prices
housing
tax/mandatory deductions assumption
household costs
savings potential
```

Create a generalized purchasing-power abstraction.

---

# 22. Local income position

A useful derived concept:

```text
income percentile / relative economic position
```

within target economy.

Even approximate archetype-based implementation is better than raw currency comparisons.

Do not expose unreliable precision.

---

# 23. WorldState expansion

Upgrade global simulation.

Possible global factors:

```text
global growth
inflation pressure
financial conditions
technology disruption
geopolitical tension
migration openness
climate pressure
```

World state should influence CountryState.

---

# 24. Macro regimes

Create deterministic global regimes such as:

```text
Expansion
Normal
Slowdown
Recession
Inflation shock
Technology disruption
Geopolitical stress
```

Regimes can transition through seeded processes.

Do not run 40 years of exactly constant economic conditions.

---

# 25. Country response

Different country archetypes respond differently.

Example:

```text
Global recession

Country A:
unemployment ↑ strongly

Country B:
unemployment ↑ moderately
social protection absorbs income loss

Country C:
currency/inflation stress ↑
```

Keep modelling transparent.

---

# 26. Industry shocks

Macro conditions should affect occupation sectors differently.

For example:

```text
technology boom
construction slowdown
tourism shock
manufacturing expansion
```

Use broad sector sensitivities.

---

# 27. Global rare events

Architecture should support rare world events such as:

```text
pandemic-like disruption
regional conflict
financial crisis
commodity boom
major technological shift
```

Do not simulate these constantly.

Use seeded low-frequency events.

---

# 28. Country timeline

Add a contextual timeline layer showing major external conditions affecting the selected life.

Example:

```text
2034
Global slowdown

2035
Local unemployment rises

2038
Technology boom benefits user's industry
```

Make clear these are simulated world events.

---

# 29. Migration fork visualization

Migration should be visually dramatic.

Example:

```text
                            STAY
                         ──────────────→

AGE 31 ────────────────●

                         ──────────────→
                         MOVE TO GERMANY
```

Show:

```text
initial cost
adaptation period
possible catch-up
long-run divergence
```

---

# 30. Moving again

A migrated person can later:

```text
return home
move onward
relocate domestically
```

Do not lock them permanently.

---

# 31. Reverse migration

Support scenarios where migration does not work well.

Potential outcomes:

```text
successful settlement
temporary stay
return after job loss
return for family reasons
move to third country
```

This makes the system much more realistic.

---

# 32. Country recommendation transparency

Every recommendation should explain:

```text
Why this destination appears
What assumptions matter
What the largest uncertainties are
```

Avoid black-box rankings.

---

# 33. Unsupported / low-confidence destinations

If country modelling quality is weak:

show:

```text
Model confidence: Limited
```

rather than hiding this.

Architecture should support:

```text
high
medium
low
placeholder
```

country-data confidence.

---

# 34. Scenario comparison example

User:

```text
Age 27
Country A
Career: Accounting
Savings: ...
```

Branches:

```text
Stay
Move to Country B
Move to Country C
```

Output may show:

```text
SHORT TERM (0–3 YEARS)

Stay
+ stability
+ family network

Country B
- moving costs
- credential friction

Country C
+ strong earnings
- higher housing


LONG TERM (10 YEARS)

Stay
Moderate career growth

Country B
Higher stability
Higher purchasing power

Country C
Highest gross income
Similar median savings after costs
```

Again, derive from actual simulation.

---

# 35. Interactive controls

Migration/country exploration should feel playful.

Allow controls such as:

```text
Prioritize

Career        ─────●────
Savings       ─────────●
Family        ──●───────
Stability     ───────●──
Adventure     ─────●────
```

As sliders change:

destination ranking should update immediately.

Do not rerun huge Monte Carlo simulations on every pointer movement if expensive.

Use:

* debounce,
* lightweight scoring,
* rerun button

appropriately.

---

# 36. Global map — optional

A tasteful interactive world map may be implemented if it materially improves destination exploration and performs well.

Do not spend the entire sprint building map infrastructure.

The core value is simulation, not cartography.

If implemented:

* highlight candidate countries,
* click to inspect,
* support keyboard/non-map alternative,
* do not encode "good/bad" via simplistic red/green colouring.

---

# 37. Sprint 7 test scenarios

Test:

```text
citizen staying home
single migrant
partnered migrant
migrant with children
low savings
high savings
regulated profession
transferable profession
language mismatch
strong language match
domestic relocation
international move
return migration
third-country move
```

Test deterministic replay under macro regimes.

---

# 38. Sprint 7 acceptance criteria

At completion:

* CountryProfile is significantly richer.
* migration is a true intervention.
* domestic relocation works.
* international relocation works.
* migration has costs.
* migration can fail/change course.
* partner and child effects are considered.
* occupation transferability matters.
* languages matter.
* migration recommendation engine exists.
* goal-sensitive destination ranking exists.
* country comparison works.
* purchasing-power logic exists.
* world macro regimes evolve.
* countries respond to macro conditions.
* timeline surfaces external events.
* deterministic replay remains stable.
* assumptions/data provenance are visible.
* build/lint/typecheck/tests pass.

Commit:

```text
feat(sprint-7): add global migration country and world simulation
```

Push.

STOP.

Ask me to run it.

---

# DESIGN REQUIREMENTS FOR SPRINTS 5–7

Continue using:

```text
https://github.com/ibelick/ui-skills
```

as design guidance.

Pay special attention to:

* progressive disclosure,
* complex forms,
* comparison UIs,
* slider ergonomics,
* tabs,
* contextual panels,
* responsive behaviour,
* motion,
* input affordances,
* accessibility.

Do not let increased complexity destroy the interface.

---

# CONTROL DESIGN

Prefer:

### Sliders

For continuous preferences such as:

```text
risk tolerance
relocation openness
career ambition
priority weighting
```

### Numeric inputs

For:

```text
income
savings
debt
moving budget
education cost
```

### Segmented controls

For small categorical decisions:

```text
Stay / Move
Full-time / Part-time
```

### Combobox/search

For:

```text
countries
occupation families
education fields
```

### Toggles

Only for genuinely binary settings.

Do not use toggles for actions.

---

# GAME FEEL

The project must increasingly feel interactive rather than analytical-only.

Add restrained polish to significant actions:

```text
New relationship formed
Child arrives
Career branch created
Migration begins
New country reached
Business started
Scenario forked
```

Potential techniques:

* subtle timeline pulse,
* animated branch growth,
* smooth metric interpolation,
* small milestone icon,
* contextual sound capability later,
* route/trajectory drawing,
* state transition animation.

Do not overload every event with confetti.

---

# LIFE TIMELINE EVOLUTION

By Sprint 7, timeline categories should support:

```text
Career
Money
Relationships
Family
Health
Education
Location
World
```

The user should be able to:

* filter domains,
* select an age,
* inspect life state,
* inspect external conditions,
* switch scenario branch,
* compare alternatives.

---

# PERFORMANCE

Simulation complexity is now increasing significantly.

Profile the engine.

Avoid:

```text
N simulations × every country × every month
```

unless genuinely needed.

Use appropriate techniques:

* yearly ticks where sufficient,
* event-driven updates,
* precomputed transition tables,
* Web Workers,
* memoization,
* typed arrays only if justified,
* summary-only storage for non-representative lives.

Do not retain huge event histories for every Monte Carlo run unnecessarily.

For example:

```text
10,000 runs
```

may only need:

```text
final metrics
selected checkpoints
key events
```

while representative paths retain full history.

---

# DETERMINISM

Never break seeded replay.

When adding new random systems:

prefer deterministic sub-streams.

For example:

```text
seed/profile
seed/career
seed/relationship
seed/children
seed/health
seed/macro
seed/migration
```

Adding a new child-related random event should not unnecessarily alter the entire unrelated career history.

Version the simulation engine.

---

# STORAGE

Persist:

* profile,
* baseline simulation configuration,
* branches,
* selected representative seeds,
* user scenario definitions.

Version stored schemas.

Provide migration/fallback handling for older local data.

Do not corrupt existing user profiles after upgrades.

---

# MODEL ASSUMPTIONS

Maintain a visible assumptions registry.

Examples:

```text
finance assumptions
career assumptions
relationship assumptions
family assumptions
country assumptions
migration assumptions
macro assumptions
```

Each important model coefficient should be traceable to a category.

Future dataset integration must be possible without searching the codebase for magic constants.

---

# DO NOT MAKE THESE MISTAKES

Do not create:

### "Rich country = success"

A wealthy destination can still have:

* expensive housing,
* credential barriers,
* weak social network,
* childcare costs,
* migration friction.

### "Marriage = happiness"

No.

### "Children = happiness"

No.

### "High income = best life"

No.

### "University = always profitable"

No.

### "Migration = automatically positive"

No.

### "Business = lottery"

No.

### "Career switch = instant salary increase"

No.

Every major choice should have:

* upside,
* downside,
* transition costs,
* uncertainty,
* path dependence.

---

# DO NOT YET IMPLEMENT FULLY

Reserve for Part 3 unless trivial foundations are needed:

* universal decision interruption while life is "playing",
* rewind to arbitrary year,
* deep butterfly-effect analysis,
* sensitivity analysis,
* variable importance,
* full "why did my life happen?" decomposition,
* Life Multiverse tree,
* sharing seeds,
* challenge/game modes,
* achievements,
* full save slots,
* advanced black swan system,
* large-scale calibrated real-world dataset pipeline,
* simulation history browser,
* final onboarding polish,
* extensive sound system,
* PWA/offline packaging if not already present,
* production deployment pipeline.

---

# QUALITY BAR

Before declaring any sprint complete, actively try to break the product.

Test:

* extreme but valid values,
* zero income,
* negative net worth,
* high debt,
* no partner,
* many children,
* no children,
* migration refusal,
* multiple citizenships,
* unemployed,
* retired,
* student,
* business owner,
* unusual age/career combinations,
* missing optional data,
* unknown fields.

The simulator should gracefully represent strange lives.

Reality is strange.

Do not overvalidate users into a narrow "normal person" template.

---

# FINAL INSTRUCTION

Inspect repository history and determine whether Sprint 5, Sprint 6, or Sprint 7 is the earliest incomplete sprint.

Execute ONLY that sprint.

Complete it thoroughly.

Test it.

Commit it.

Push it to:

```bash
git@github.com:shivam4tech/life-simulator.git
```

Then STOP.

Tell me exactly what changed and ask me to run/review it.

Do not begin the following sprint until I explicitly tell you to continue.
