import type { CountryProfile } from '@/domain/country'
import { getCountryProfile } from '@/data/countries'
import { OCCUPATION_MODELS } from './careers'
import { countryMedianIncome, ECONOMIC_ASSUMPTIONS } from './assumptions'
import { SETTLEMENT_ECONOMICS } from '@/domain/country'
import { clamp, chance, rngFor } from './rng'
import type { LifeState, SimEventDraft } from './types'
import type { MacroYear } from './world'

/**
 * Migration engine (Sprint 7).
 *
 * Principles:
 *  - moving countries is a first-class life event with real costs, friction
 *    and an adaptation period — never a free win;
 *  - salaries RECALIBRATE to the destination market (never plain FX of the old
 *    salary); personal ability carries over, market price does not;
 *  - savings and debts convert at PURCHASING POWER (median-to-median), keeping
 *    economic meaning — historical snapshots stay denominated in the currency
 *    of their year, and the migration event documents the conversion;
 *  - feasibility is a simulation abstraction (NOT a visa-probability claim);
 *  - the partner's willingness and the children's needs shape the move;
 *  - networks are cut and slowly rebuild through integration;
 *  - migration can fail: a return-home path exists.
 */

export interface FeasibilityAssessment {
  score: number // 0–1
  band: 'difficult' | 'moderate' | 'smooth'
  reasons: string[]
  frictions: string[]
}

/**
 * Broad feasibility of moving to `target` from the person's current position.
 * Deterministic: same state + same target = same assessment. Clearly a
 * modelling abstraction — never presented as visa advice.
 */
export const assessMigrationFeasibility = (state: LifeState, target: CountryProfile): FeasibilityAssessment => {
  const reasons: string[] = []
  const frictions: string[] = []
  const occupation = OCCUPATION_MODELS[state.occupationFamily]

  const transferability = occupation?.internationalTransferability ?? 0.5
  const credentialFactor = clamp(0.5 + target.assumptions.credentialRecognition * 0.5 * (0.5 + transferability * 0.5), 0.15, 1)

  const targetMedian = countryMedianIncome(target)

  // Savings: the move consumes months of destination costs up front.
  const movingCost = targetMedian * clamp(4 + state.children.filter((c) => c.livingWithUser).length * 1.2, 3, 10)
  const savingsRatio = clamp(state.savings / Math.max(movingCost, 1), 0, 2)

  const ageFactor = state.age <= 30 ? 1 : state.age <= 40 ? 0.92 : state.age <= 50 ? 0.78 : 0.6
  const eduFactor = clamp(state.educationMultiplier / 1.2, 0.4, 1.3)
  const openness = clamp(target.assumptions.immigrationAccessibility * 0.6 + target.assumptions.migrationAttractiveness * 0.4, 0, 1)
  const stability = clamp(target.assumptions.institutionalStability, 0, 1)

  let score = clamp(
    credentialFactor * 0.26 +
      clamp(savingsRatio, 0, 1) * 0.24 +
      clamp(eduFactor, 0.4, 1.1) * 0.06 +
      openness * 0.14 +
      clamp(state.languageFit, 0, 1) * 0.18 +
      ageFactor * 0.12,
    0.05,
    0.98,
  )

  // Multiplicative shortfalls bite — partial readiness is not readiness.
  if (savingsRatio < 1) score *= 0.4 + 0.6 * savingsRatio * savingsRatio
  if (state.age > 45) score *= 0.85
  if (target.assumptions.credentialRecognition < 0.5 && transferability < 0.5) score *= 0.85
  if (state.householdSize >= 4) score *= 0.92
  void stability

  reasons.push(`occupation transferability ${Math.round(transferability * 100)}%`)
  reasons.push(`credential recognition in destination ${Math.round(target.assumptions.credentialRecognition * 100)}%`)
  reasons.push(`language fit ${Math.round(clamp(state.languageFit, 0, 1) * 100)}% (modelled)`)
  if (savingsRatio >= 1) reasons.push('savings cover the full move')
  else frictions.push(`savings cover ~${Math.round(savingsRatio * 100)}% of the move's cost`)
  if (state.age > 45) frictions.push('age makes settlement slower in the model')
  if (state.householdSize >= 4) frictions.push('larger households face higher moving costs')
  if (target.assumptions.immigrationAccessibility < 0.3) frictions.push('restrictive immigration system (modelled)')

  return {
    score,
    band: score >= 0.66 ? 'smooth' : score >= 0.44 ? 'moderate' : 'difficult',
    reasons,
    frictions,
  }
}

/** Purchasing-power conversion: preserves economic meaning across currencies. */
export const purchasingPowerFactor = (from: CountryProfile, to: CountryProfile): number =>
  clamp(countryMedianIncome(to) / Math.max(countryMedianIncome(from), 1), 0.05, 40)

/**
 * Apply a migration to the working state. Called from the intervention fork.
 * Deterministic; the stochastic part (settlement success, return home) plays
 * out during the run via migrationTick.
 */
export const applyMigration = (state: LifeState, targetCode: string, settlement?: LifeState['settlement']): void => {
  const target = getCountryProfile(targetCode)
  if (!target || target.identity.code === state.country.identity.code) return
  const origin = state.country

  const feasibility = assessMigrationFeasibility(state, target)
  const occupation = OCCUPATION_MODELS[state.occupationFamily]
  const credentialFactor = clamp(
    0.45 + target.assumptions.credentialRecognition * 0.45 * (0.5 + (occupation?.internationalTransferability ?? 0.5) * 0.5),
    0.15,
    1.15,
  )

  // --- convert balances at purchasing power ---
  const conversion = purchasingPowerFactor(origin, target)
  state.savings *= conversion
  state.investments *= conversion
  state.assets *= conversion
  state.debt *= conversion

  // --- moving costs: travel, deposit, admin, family size ---
  const targetMedian = countryMedianIncome(target)
  const newSettlement = settlement ?? state.settlement
  const movingMonths = clamp(4 + state.children.filter((c) => c.livingWithUser).length * 1.1 + (state.partner ? 0.5 : 0), 3, 10)
  const movingCost = targetMedian * SETTLEMENT_ECONOMICS[newSettlement].costFactor * movingMonths
  state.savings = Math.max(0, state.savings - movingCost)

  // --- salary recalibration to the destination market ---
  const wageRatio = SETTLEMENT_ECONOMICS[newSettlement].wageFactor
  const targetMedianAdj = targetMedian * (0.9 + wageRatio * 0.1)
  const expected =
    targetMedianAdj *
    (ECONOMIC_ASSUMPTIONS.occupationMultiplier[state.occupationFamily] ?? 0.9) *
    (ECONOMIC_ASSUMPTIONS.seniorityMultiplier[state.seniorityIndex] ?? 1) *
    state.educationMultiplier
  const languageFactor = clamp(0.55 + state.languageFit * 0.45, 0.2, 1)
  const entryFactor = clamp(0.72 + feasibility.score * 0.28, 0.5, 1)
  state.monthlyIncome = expected * clamp(state.incomeMultiplier, 0.2, 4) * credentialFactor * languageFactor * entryFactor
  state.incomeMultiplier = clamp(state.incomeMultiplier * credentialFactor * languageFactor * entryFactor, 0.1, 6)

  // --- costs re-anchor automatically (householdExpenses uses state.country);
  // cost multiplier re-anchored partially: keep relative frugality, absorb shocks
  state.costMultiplier = clamp(state.costMultiplier * 0.85 + 0.15, 0.2, 5)

  // --- settlement economics ---
  state.settlement = newSettlement
  state.country = target
  state.inflationIndex = 1 // price base restarts in the destination currency

  // --- network shock + integration start ---
  state.network = clamp(state.network * 0.3, 0, 100)
  const integrationStart = clamp(0.22 + feasibility.score * 0.3, 0.15, 0.55)

  // --- partner decision (their willingness counts) ---
  let partnerStayedBehind = false
  if (state.partner) {
    const willingness = state.partner.migrationWillingness
    const migrates = chance(rngFor(0, -1, 'relationships'), clamp(0.2 + willingness / 12, 0.15, 0.95))
    if (migrates) {
      state.partner.monthlyIncome *= conversion * clamp(0.7 + credentialFactor * 0.3, 0.5, 1.05) * 0.9
      state.partner.incomeMultiplier *= 0.85
    } else {
      partnerStayedBehind = true
      state.partner = null
      state.householdSize = Math.max(1, state.householdSize - 1)
      // Money flows home to them.
      if (state.sendsSupport) state.supportShare = clamp(state.supportShare + 0.05, 0, 0.2)
      else {
        state.sendsSupport = true
        state.supportShare = 0.06
      }
    }
  }

  state.migration = {
    targetCode: target.identity.code,
    year: state.calendarYear,
    feasibility: feasibility.score,
    integration: integrationStart,
    languageFit: clamp(state.languageFit, 0, 1),
    credentialFactor,
    yearsSince: 0,
    partnerStayedBehind,
  }

  // Short-run scar: the first years pay an adaptation penalty through the tick.
  state.migration.integration = integrationStart
}

/** Yearly migration aftermath: integration, remittance drift, return home. */
export const migrationTick = (state: LifeState, macro: MacroYear, lifeSeed: number, year: number): SimEventDraft[] => {
  const events: SimEventDraft[] = []
  const migration = state.migration
  if (!migration) return []
  const rng = rngFor(lifeSeed, year, 'life-events')
  migration.yearsSince += 1

  // --- integration rebuilds; network follows ---
  const growthRate = 0.06 + state.behaviours.sociability * 0.012 + state.country.assumptions.integrationSupport * 0.05
  const opennessPenalty = macro.migrationOpenness < 0.6 ? 0.5 : 1
  migration.integration = clamp(migration.integration + growthRate * opennessPenalty, 0, 0.95)
  const networkTarget = 25 + migration.integration * 65
  state.network = clamp(state.network + (networkTarget - state.network) * 0.25, 0, 100)

  if (migration.yearsSince === 3 && migration.integration > 0.55) {
    events.push({
      year,
      age: state.age,
      domain: 'location',
      type: 'integration-progress',
      title: 'Putting down roots',
      description: 'Language, community and professional network are coming together in the new country.',
      severity: 'minor',
      causes: [`+ integration ${Math.round(migration.integration * 100)}%`, `+ integration support ${Math.round(state.country.assumptions.integrationSupport * 100)}%`],
    })
  }

  // --- return migration: struggles + weak feasibility + early years ---
  if (migration.yearsSince <= 4) {
    const struggle =
      (state.employment === 'unemployed' ? 0.6 : 0) +
      (state.annualExpenses > 0 && state.savings + state.investments < state.annualExpenses * 0.25 ? 0.4 : 0) +
      (migration.partnerStayedBehind ? 0.25 : 0)
    if (struggle > 0) {
      const returnHazard = clamp((0.06 + (1 - migration.feasibility) * 0.2) * struggle, 0, 0.4)
      if (chance(rng, returnHazard)) {
        returnHome(state, events, year, 'Migration did not take hold — returning home with experience in hand.')
        return events
      }
    }
  }

  // Family reasons can also pull people home later (care obligations deepened).
  if (migration.yearsSince >= 5 && state.careLevel >= 2 && chance(rng, 0.05)) {
    returnHome(state, events, year, 'Family care responsibilities pulled the household back home.')
    return events
  }

  return events
}

/** Reverse migration: reciprocal recalibration back to the origin country. */
const returnHome = (state: LifeState, events: SimEventDraft[], year: number, why: string): void => {
  const origin = getCountryProfile(state.originCountry)
  if (!origin) {
    state.migration = null
    return
  }
  const migration = state.migration!
  const conversion = purchasingPowerFactor(state.country, origin)

  state.savings *= conversion
  state.investments *= conversion
  state.assets *= conversion
  state.debt *= conversion

  // Coming home values local experience: no credential/language penalty.
  const originMedian = countryMedianIncome(origin)
  const expected =
    originMedian *
    (ECONOMIC_ASSUMPTIONS.occupationMultiplier[state.occupationFamily] ?? 0.9) *
    (ECONOMIC_ASSUMPTIONS.seniorityMultiplier[state.seniorityIndex] ?? 1) *
    state.educationMultiplier *
    (SETTLEMENT_ECONOMICS[state.settlement].wageFactor * 0.9 + 0.1)
  state.monthlyIncome = expected * clamp(state.incomeMultiplier, 0.2, 4) * clamp(0.9 + migration.integration * 0.2, 0.9, 1.15)
  state.country = origin
  state.inflationIndex = 1
  // Networks partially rebuild fast at home; experience gained abroad helps.
  state.network = clamp(state.network + 20, 0, 100)
  state.careerCapital = clamp(state.careerCapital + 5, 0, 100)
  if (migration.partnerStayedBehind && state.partner === null) {
    // Reunification is common on return — keep the household smaller; the
    // partner may rejoin in later sprints with proper family modelling.
    state.sendsSupport = false
  }
  state.migration = null

  events.push({
    year,
    age: state.age,
    domain: 'location',
    type: 'return-migration',
    title: 'Returned home',
    description: `${why} Savings converted at purchasing power; international experience counts at home.`,
    severity: 'major',
    causes: [
      `- feasibility was ${Math.round(migration.feasibility * 100)}%`,
      migration.yearsSince <= 2 ? '- left within the first years' : `+ stayed ${migration.yearsSince} years`,
    ],
  })
}
