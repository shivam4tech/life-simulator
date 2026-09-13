import type { SimulationResult } from './types'

/**
 * "Why did this life happen?" — major model contributors.
 *
 * Everything here is *derived from the actual run output* (events, snapshot
 * deltas): no invented causality, no false precision. We rank the model
 * systems that visibly shaped this trajectory and cite the evidence.
 */

export interface LifeDriver {
  key: string
  label: string
  /** Rough model weight for ordering only — not shown as a percentage. */
  weight: number
  tone: 'positive' | 'negative' | 'mixed'
  evidence: string[]
}

export const deriveLifeDrivers = (result: SimulationResult): LifeDriver[] => {
  const { events, snapshots } = result
  const first = snapshots[0]
  const last = snapshots[snapshots.length - 1]
  if (!first || !last) return []

  const countByType = (types: string[]): number =>
    events.filter((event) => types.includes(event.type)).length

  const majors = (domain: string): number =>
    events.filter((event) => event.domain === domain && event.severity === 'major').length

  const drivers: LifeDriver[] = []

  // --- Career ---
  const promotions = countByType(['promotion'])
  const jobChanges = countByType(['job-change', 're-employed'])
  const jobLosses = countByType(['job-loss'])
  const seniorityDelta = last.seniorityIndex - first.seniorityIndex
  if (promotions + jobChanges + jobLosses > 0 || seniorityDelta !== 0) {
    const realGrowth =
      first.realIncome > 0 ? last.realIncome / first.realIncome - 1 : 0
    drivers.push({
      key: 'career',
      label: 'Career progression',
      weight: promotions * 2 + jobChanges * 1.5 + jobLosses * 2 + Math.abs(seniorityDelta),
      tone: jobLosses > promotions + jobChanges ? 'negative' : realGrowth >= 0 ? 'positive' : 'mixed',
      evidence: [
        promotions > 0 ? `${promotions} promotion${promotions > 1 ? 's' : ''}` : '',
        jobChanges > 0 ? `${jobChanges} employer move${jobChanges > 1 ? 's' : ''}` : '',
        jobLosses > 0 ? `${jobLosses} job loss${jobLosses > 1 ? 'es' : ''}` : '',
        `real income ${realGrowth >= 0 ? 'grew' : 'fell'} ~${Math.abs(Math.round(realGrowth * 100))}% across the run`,
      ].filter(Boolean),
    })
  }

  // --- Savings behaviour ---
  const runwayStart = first.runwayMonths
  const runwayEnd = last.runwayMonths
  const crunches = countByType(['financial-emergency', 'unexpected-expense'])
  if (runwayEnd !== runwayStart || crunches > 0) {
    drivers.push({
      key: 'savings',
      label: 'Savings behaviour & buffers',
      weight: Math.min(6, Math.abs(runwayEnd - runwayStart) / 6) + crunches * 0.8,
      tone: runwayEnd >= runwayStart ? 'positive' : 'negative',
      evidence: [
        `emergency runway went from ~${runwayStart.toFixed(0)} to ~${runwayEnd.toFixed(0)} months`,
        crunches > 0 ? `${crunches} unexpected financial shock${crunches > 1 ? 's' : ''}` : '',
      ],
    })
  }

  // --- World & country conditions ---
  const recessions = events.filter((event) => event.type === 'recession').length
  if (recessions > 0) {
    drivers.push({
      key: 'world',
      label: 'Country & world conditions',
      weight: recessions * 1.6,
      tone: 'negative',
      evidence: [
        `${recessions} recession year${recessions > 1 ? 's' : ''} hit this universe`,
        `scenario: ${result.config.worldScenario}`,
      ],
    })
  }

  // --- Relationships ---
  const relationshipEvents = countByType([
    'relationship-start',
    'relationship-committed',
    'relationship-cohabiting',
    'relationship-married',
    'separation',
    'divorce',
    'widowhood',
  ])
  if (relationshipEvents > 0) {
    drivers.push({
      key: 'relationships',
      label: 'Relationship transitions',
      weight: relationshipEvents * 1.3,
      tone: countByType(['separation', 'divorce', 'widowhood']) > 0 ? 'mixed' : 'positive',
      evidence: events
        .filter((event) =>
          ['relationship-married', 'divorce', 'separation', 'widowhood', 'relationship-start'].includes(event.type),
        )
        .slice(0, 3)
        .map((event) => `${event.title.toLowerCase()} at age ${event.age}`),
    })
  }

  // --- Health stability ---
  const majorHealth = majors('health')
  if (majorHealth > 0 || last.healthIndex < 55) {
    drivers.push({
      key: 'health',
      label: 'Health stability',
      weight: majorHealth * 2,
      tone: majorHealth > 0 ? ('negative' as const) : ('mixed' as const),
      evidence: [
        majorHealth > 0 ? `${majorHealth} major health event${majorHealth > 1 ? 's' : ''}` : '',
        `health index ended at ${Math.round(last.healthIndex)}/100`,
      ].filter(Boolean),
    })
  }

  // --- Family ---
  const children = countByType(['child'])
  const leavingChild = events.filter((event) => event.type === 'child').length
  if (children > 0) {
    drivers.push({
      key: 'family',
      label: 'Family & dependents',
      weight: children * 1.4,
      tone: 'mixed',
      evidence: [
        `${leavingChild} child${leavingChild > 1 ? 'ren' : ''} arrived (first at age ${events.find((event) => event.type === 'child')?.age ?? '—'})`,
        `${last.childrenCount} dependent${last.childrenCount === 1 ? '' : 's'} at the end`,
      ],
    })
  }

  // --- Macro shock recency (a late shock shapes the ending strongly) ---
  const lateMajor = events.filter(
    (event) => event.severity === 'major' && event.age >= last.age - 5 && ['career', 'health', 'world', 'money'].includes(event.domain),
  )
  if (lateMajor.length >= 2) {
    drivers.push({
      key: 'late-shocks',
      label: 'Late-run shocks',
      weight: lateMajor.length,
      tone: 'negative',
      evidence: lateMajor.slice(0, 2).map((event) => `${event.title.toLowerCase()} at age ${event.age}`),
    })
  }

  return drivers.sort((a, b) => b.weight - a.weight).slice(0, 5)
}

export interface LifePressures {
  label: string
  detail: string
}

/** "Top active pressures" at a given age — derived from the snapshot + nearby events. */
export const derivePressures = (result: SimulationResult, snapshotIndex: number): LifePressures[] => {
  const snapshot = result.snapshots[snapshotIndex]
  if (!snapshot) return []
  const pressures: LifePressures[] = []

  if (snapshot.employment === 'unemployed') {
    pressures.push({ label: 'Unemployment', detail: 'No wage income this year' })
  }
  if (snapshot.runwayMonths < 3) {
    pressures.push({ label: 'Thin buffer', detail: `Only ~${snapshot.runwayMonths.toFixed(1)} months of reserves` })
  }
  if (snapshot.debt > snapshot.realIncome) {
    pressures.push({ label: 'Debt burden', detail: 'Debt exceeds a year of income' })
  }
  if (snapshot.healthIndex < 55) {
    pressures.push({ label: 'Health strain', detail: `Health index ${Math.round(snapshot.healthIndex)}/100` })
  }

  const nearby = result.events.filter(
    (event) =>
      event.severity === 'major' &&
      Math.abs(event.year - snapshot.year) <= 2 &&
      ['career', 'health', 'relationships', 'family', 'money'].includes(event.domain),
  )
  for (const event of nearby.slice(0, 3 - Math.min(3, pressures.length))) {
    pressures.push({ label: event.title, detail: `Age ${event.age} — still resonating` })
  }

  return pressures.slice(0, 3)
}
