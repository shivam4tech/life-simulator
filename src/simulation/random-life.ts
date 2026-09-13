import type { CountryProfile, PersonProfile } from '@/domain'
import { known, monthlyMoney, annualMoney } from '@/domain'
import { OCCUPATION_FAMILIES, EDUCATION_LEVELS, SETTLEMENT_TYPES, RELATIONSHIP_STATUSES } from '@/domain/taxonomies'
import { listCountryProfiles } from '@/data/countries'
import { hashString, mulberry32, type Rng } from './rng'
import { GOAL_KEYS } from '@/domain/person'

/**
 * Random Life generator (Sprint 10) — creates a coherent fictional starting
 * state from a seed, drawing from the real country registry. Avoids
 * stereotyping: attributes are drawn independently with sanity constraints.
 * The result is always clearly marked fictional.
 */

export function generateRandomLife(seed: string | number): PersonProfile {
  const rng = mulberry32(typeof seed === 'number' ? seed : hashString(seed))
  const countries = listCountryProfiles()
  const country = pick(rng, countries)
  return buildLife(rng, country, seed)
}

function buildLife(rng: Rng, country: CountryProfile, seed: string | number): PersonProfile {
  const id = `random-${(typeof seed === 'number' ? seed : hashString(seed)).toString(36)}`
  const age = int(rng, 18, 64)
  const incomeLevel = country.assumptions.incomeLevel
  const median = 1000 * Math.pow(incomeLevel, 1.2)
  const grossMonthly = median * (0.5 + rng() * 1.8)

  // Demographics
  const settlementType = pick(rng, SETTLEMENT_TYPES.map((s) => s.id))
  const sex = pick(rng, ['female', 'male', 'other', 'prefer-not-to-answer'] as const)
  const relationshipStatus = pick(rng, RELATIONSHIP_STATUSES.filter((r) => r.id !== 'other').map((r) => r.id))

  // Education — realistically correlated with age but never deterministic
  const educationPool = EDUCATION_LEVELS.filter((e) => !['none', 'other'].includes(e.id))
  const maxEduForAge = age < 25 ? 5 : age < 30 ? 7 : EDUCATION_LEVELS.length
  const educationLevel = pick(rng, educationPool.slice(0, maxEduForAge).map((e) => e.id))

  // Work
  const employed = age >= 18 && age < 68 && roll(rng, 0.75)
  const occupationFamily = employed ? pick(rng, OCCUPATION_FAMILIES.filter((o) => o.id !== 'other').map((o) => o.id)) : undefined
  const status = !employed
    ? (age >= 62 ? 'retired' : roll(rng, 0.3) ? 'student' : 'unemployed')
    : pick(rng, ['employed', 'employed', 'employed', 'self-employed', 'informal', 'gig-freelance'] as const)
  const seniority = !employed || status === 'student'
    ? undefined
    : int(rng, 0, 6) < 2 ? 'entry' : int(rng, 0, 6) < 4 ? 'mid' : int(rng, 0, 6) < 5 ? 'senior' : pick(rng, ['lead', 'management', 'executive-specialist'] as const)

  // Income: country baseline × occupation × seniority with spread
  const occupationMult = median * (0.5 + rng() * 1.8)
  const monthlyGross = Math.max(median * 0.3, occupationMult * (0.5 + (index(seniority) + 1) * 0.15))
  const grossIncome = employed && status !== 'student'
    ? known(monthlyMoney(Math.round(monthlyGross), country.identity.currency))
    : undefined

  // Finances
  const savingsMonths = rng() * 12
  const essentialMonthly = grossMonthly ? monthlyGross * (0.5 + rng() * 0.3) : median * 0.5
  const savings = known(annualMoney(Math.round(essentialMonthly * savingsMonths), country.identity.currency))
  const debt = roll(rng, 0.4) ? known(annualMoney(Math.round(essentialMonthly * rng() * 8), country.identity.currency)) : undefined

  // Children
  const childCount = roll(rng, 0.5) ? int(rng, 0, 3) : 0
  const dependents = childCount > 0 ? { count: known(childCount) } : undefined

  // Behaviours: uniform random — no moral ordering
  const behaviours: PersonProfile['behaviours'] = {}
  for (const key of ['riskTolerance', 'discipline', 'patience', 'persistence', 'adaptability', 'sociability', 'stressTolerance', 'noveltySeeking', 'careerAmbition', 'financialRestraint', 'familyOrientation', 'geographicMobility', 'learningInclination', 'entrepreneurialTendency'] as const) {
    behaviours[key] = int(rng, 0, 10)
  }

  // Goals: 3–6 nonzero picks
  const goals: PersonProfile['goals'] = {}
  const goalCount = int(rng, 3, 6)
  const shuffledGoals = [...GOAL_KEYS].sort(() => rng() - 0.5)
  for (const key of shuffledGoals.slice(0, goalCount)) {
    goals[key] = int(rng, 2, 10)
  }

  return {
    id,
    displayName: undefined, // user names it in the UI
    isFictional: true,
    createdAt: new Date().toISOString(),
    demographics: {
      age: known(age),
      sex,
      countryOfResidence: country.identity.code,
      citizenships: [country.identity.code],
      residencyStatus: 'citizen',
      settlementType,
    },
    household: {
      size: known(1 + childCount + (relationshipStatus === 'married' || relationshipStatus === 'cohabiting' ? 1 : 0)),
      sendsFamilySupport: roll(rng, 0.2),
      receivesFamilySupport: roll(rng, 0.1),
      hasCareObligations: roll(rng, 0.15),
    },
    education: {
      level: educationLevel,
      currentlyStudying: status === 'student',
    },
    employment: {
      status,
      occupationFamily,
      seniority,
      yearsExperience: known(Math.max(0, Math.min(age - 20, int(rng, 0, age - 18)))),
      grossIncome,
      hoursPerWeek: known(int(rng, 20, 55)),
      jobStability: known(int(rng, 0, 10)),
      careerSatisfaction: known(int(rng, 0, 10)),
      remoteCompatible: roll(rng, 0.35),
    },
    finances: {
      savings,
      debt,
      housingCost: roll(rng, 0.6) ? known(monthlyMoney(Math.round(essentialMonthly * (0.2 + rng() * 0.25)), country.identity.currency)) : undefined,
    },
    housing: {
      state: pick(rng, ['renting', 'renting', 'family-household', 'mortgage', 'owned-outright', 'shared'] as const),
    },
    dependents,
    health: {
      overall: known(int(rng, 1, 5)),
      activity: known(int(rng, 0, 10)),
      sleepQuality: known(int(rng, 0, 10)),
      smoking: roll(rng, 0.2),
      healthcareAccess: known(int(rng, 0, 10)),
    },
    behaviours,
    relationshipStatus,
    goals,
    constraints: {},
  }
}

function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]!
}
function int(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min
}
function roll(rng: Rng, p: number): boolean {
  return rng() < p
}
function index(seniority: string | undefined): number {
  const order = ['entry', 'junior', 'mid', 'senior', 'lead', 'management', 'executive-specialist']
  const i = order.indexOf(seniority ?? 'mid')
  return i >= 0 ? i : 2
}
