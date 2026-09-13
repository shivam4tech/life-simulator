import { useMemo, useRef, useState } from 'react'
import {
  Button,
  Progress,
  SegmentedControl,
  Skeleton,
  Slider,
  TextInput,
} from '@/components/ui'
import type { OccupationFamily, PersonProfile } from '@/domain'
import { OCCUPATION_FAMILIES, SETTLEMENT_TYPES } from '@/domain'
import { formatCurrencyValue } from '@/utils/format'
import {
  BUTTERFLY_PRESETS,
  createFork,
  createNestedFork,
  rewindTo,
  runButterfly,
  runSensitivity,
  SENSITIVITY_DIMENSIONS,
  SIMULATION_ENGINE_VERSION,
  type ButterflyDivergence,
  type ForkBranch,
  type Intervention,
  type SensitivityDimensionResult,
  type SensitivityMetric,
  type SimulationConfig,
  type SimulationResult,
} from '@/simulation'
import { listCountryProfiles } from '@/data/countries'
import { Section } from '@/features/shared/Section'
import { describeIntervention } from '@/simulation'
import { Combobox, Select } from '@/components/ui'

/**
 * ForkLab — rewind, fork, butterfly mode, sensitivity and the branch tree.
 * Everything derives from deterministic replay: a rewind reconstructs the
 * exact historical state; forks share history and shocks (common random
 * numbers) so differences come from the decision.
 */

export interface ForkLabProps {
  profile: PersonProfile
  config: SimulationConfig
  lifeSeed: number
  original: SimulationResult
  /** The scrubbed year index in the original life — the rewind target. */
  selectedYearIndex: number
  locale?: string
  currency: string
}

export function ForkLab({ profile, config, lifeSeed, original, selectedYearIndex, locale, currency }: ForkLabProps) {
  const [forks, setForks] = useState<ForkBranch[]>([])
  const [selectedForkId, setSelectedForkId] = useState<string | null>(null)
  const [forkName, setForkName] = useState('')
  const [interventionType, setInterventionType] = useState<string>('change-career')
  const [careerTarget, setCareerTarget] = useState<OccupationFamily>('technology')
  const [savingsDelta, setSavingsDelta] = useState(0.1)
  const [hoursDelta, setHoursDelta] = useState(-5)
  const [relocateSettlement, setRelocateSettlement] = useState<'small-town' | 'major-city' | 'global-city'>('major-city')
  const [migrateTarget, setMigrateTarget] = useState('DE')
  const [activityDelta, setActivityDelta] = useState(2)

  const selectedFork = forks.find((fork) => fork.id === selectedForkId) ?? null
  const rewindState = useMemo(
    () => rewindTo(profile, config, lifeSeed, selectedYearIndex),
    [profile, config, lifeSeed, selectedYearIndex],
  )

  const buildIntervention = (): Intervention | null => {
    switch (interventionType) {
      case 'change-career':
        return { type: 'change-career', target: careerTarget, retrainingYears: 1 }
      case 'start-business':
        return { type: 'start-business', industry: state.occupationFamily, startingCapitalShare: 0.5, fullTime: true }
      case 'change-savings-rate':
        return { type: 'change-savings-rate', delta: savingsDelta }
      case 'change-working-hours':
        return { type: 'change-working-hours', deltaHours: hoursDelta }
      case 'relocate':
        return { type: 'relocate', settlement: relocateSettlement }
      case 'migrate':
        return { type: 'migrate', targetCountry: migrateTarget }
      case 'lifestyle-change':
        return { type: 'lifestyle-change', activityDelta: activityDelta, sleepDelta: 1 }
      case 'prioritize-relationship':
        return { type: 'prioritize-relationship' }
      case 'learn-skill':
        return { type: 'learn-skill' }
      case 'have-child':
        return { type: 'have-child' }
      default:
        return null
    }
  }

  const state = rewindState
  const intervention = buildIntervention()

  const createForkBranch = () => {
    if (!intervention) return
    const fork = createFork(
      profile,
      config,
      lifeSeed,
      {
        forkYearIndex: selectedYearIndex,
        name: forkName.trim() || interventionPreviewName(intervention),
        interventions: [intervention],
      },
      SIMULATION_ENGINE_VERSION,
    )
    setForks((current) => [fork, ...current])
    setSelectedForkId(fork.id)
    setForkName('')
  }

  const renameFork = (id: string, name: string) =>
    setForks((current) => current.map((fork) => (fork.id === id ? { ...fork, name } : fork)))
  const duplicateFork = (id: string) =>
    setForks((current) => {
      const original = current.find((fork) => fork.id === id)
      if (!original) return current
      const copy: ForkBranch = {
        ...original,
        id: `${original.id}-copy-${current.length}`,
        name: `${original.name} (copy)`,
      }
      return [copy, ...current]
    })
  const deleteFork = (id: string) =>
    setForks((current) => {
      // Guard: deleting a parent re-parents its children to the grandparent.
      const target = current.find((fork) => fork.id === id)
      return current
        .filter((fork) => fork.id !== id)
        .map((fork) =>
          fork.parentBranchId === id && target
            ? { ...fork, parentBranchId: target.parentBranchId, parentName: target.parentName, breadcrumbs: target.breadcrumbs }
            : fork,
        )
    })

  const fmt = (value: number | undefined): string =>
    value === undefined ? '—' : formatCurrencyValue(value, currency, locale, { compact: true, decimals: 0 })

  return (
    <div className="flex flex-col gap-2">
      {/* ------------------------- rewind panel ------------------------- */}
      <Section
        title={`Rewind — age ${state.age} (${state.calendarYear})`}
        aside={<span className="text-[11px] text-faint">exact historical state, replayed from the seed</span>}
      >
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-3">
          <div><dt className="text-faint">Career</dt><dd className="text-fg">{state.employment} · {state.occupationFamily.replace(/-/g, ' ')}</dd></div>
          <div><dt className="text-faint">Relationship</dt><dd className="text-fg">{state.relationship}</dd></div>
          <div><dt className="text-faint">Children at home</dt><dd className="text-fg">{state.children.filter((c) => c.livingWithUser).length}</dd></div>
          <div><dt className="text-faint">Savings</dt><dd className="text-fg tnum">{fmt(state.savings)}</dd></div>
          <div><dt className="text-faint">Debt</dt><dd className="text-fg tnum">{fmt(state.debt)}</dd></div>
          <div><dt className="text-faint">Location</dt><dd className="text-fg">{state.country.identity.name} · {state.settlement.replace(/-/g, ' ')}</dd></div>
        </dl>
      </Section>

      <Section title="Create a branch from here" className="mt-4">
        <div className="flex flex-col gap-4">
          <SegmentedControl
            aria-label="Intervention"
            options={[
              { value: 'change-career', label: 'Career' },
              { value: 'start-business', label: 'Business' },
              { value: 'change-savings-rate', label: 'Savings' },
              { value: 'change-working-hours', label: 'Hours' },
              { value: 'relocate', label: 'Move city' },
              { value: 'migrate', label: 'Move country' },
              { value: 'lifestyle-change', label: 'Habits' },
              { value: 'prioritize-relationship', label: 'Relationship' },
              { value: 'learn-skill', label: 'Skill' },
              { value: 'have-child', label: 'Child' },
            ]}
            value={interventionType}
            onChange={setInterventionType}
            size="sm"
          />
          <InterventionFields
            type={interventionType}
            careerTarget={careerTarget}
            setCareerTarget={setCareerTarget}
            savingsDelta={savingsDelta}
            setSavingsDelta={setSavingsDelta}
            hoursDelta={hoursDelta}
            setHoursDelta={setHoursDelta}
            relocateSettlement={relocateSettlement}
            setRelocateSettlement={setRelocateSettlement}
            migrateTarget={migrateTarget}
            setMigrateTarget={setMigrateTarget}
            activityDelta={activityDelta}
            setActivityDelta={setActivityDelta}
          />
          <div className="flex flex-wrap items-center gap-3">
            <TextInput
              aria-label="Branch name"
              value={forkName}
              onChange={(event) => setForkName(event.target.value)}
              placeholder={intervention ? interventionPreviewName(intervention) : 'Name this branch'}
              className="max-w-xs flex-1"
            />
            <Button variant="primary" onClick={createForkBranch} disabled={!intervention}>
              Create branch at age {state.age}
            </Button>
          </div>
        </div>
      </Section>

      {/* ------------------------- fork compare ------------------------- */}
      {selectedFork && (
        <ForkComparison
          original={original}
          fork={selectedFork}
          locale={locale}
          currency={currency}
        />
      )}

      {/* ------------------------- branch tree -------------------------- */}
      {forks.length > 0 && (
        <Section title="Life tree — your branches" className="mt-6">
          <BranchTree
            originalName="Original life"
            forks={forks}
            selectedId={selectedForkId}
            onSelect={setSelectedForkId}
            onRename={renameFork}
            onDuplicate={duplicateFork}
            onDelete={deleteFork}
            onForkFrom={(parent) => {
              const fork = createNestedFork(profile, parent, {
                forkYearIndex: Math.min(selectedYearIndex, parent.remainingYears - 1),
                name: `${parent.name} — forked`,
                interventions: [{ type: 'change-savings-rate', delta: 0.05 }],
              }, SIMULATION_ENGINE_VERSION)
              setForks((current) => [fork, ...current])
              setSelectedForkId(fork.id)
            }}
          />
        </Section>
      )}

      {/* ------------------------- butterfly ---------------------------- */}
      <ButterflySection profile={profile} config={config} lifeSeed={lifeSeed} selectedYearIndex={selectedYearIndex} locale={locale} currency={currency} />

      {/* ------------------------- sensitivity -------------------------- */}
      <SensitivitySection profile={profile} config={config} locale={locale} currency={currency} />
    </div>
  )
}

/* --------------------------- fork comparison ----------------------------- */

function ForkComparison({
  original,
  fork,
  locale,
  currency,
}: {
  original: SimulationResult
  fork: ForkBranch
  locale?: string
  currency: string
}) {
  const forkStartYear = fork.result.snapshots[0]?.year
  const originalPost = original.snapshots.find((snapshot) => snapshot.year === forkStartYear)
  const lastFork = fork.result.snapshots[fork.result.snapshots.length - 1]
  const matchingOriginal = original.snapshots[fork.forkYearIndex + fork.result.snapshots.length - 1]

  const fmt = (value: number | undefined): string =>
    value === undefined ? '—' : formatCurrencyValue(value, currency, locale, { compact: true, decimals: 0 })

  const divergenceWorth = matchingOriginal && lastFork ? lastFork.realNetWorth - matchingOriginal.realNetWorth : undefined
  const divergenceAlignment = matchingOriginal && lastFork ? lastFork.goalAlignment - matchingOriginal.goalAlignment : undefined

  return (
    <Section title={`"${fork.name}" vs the original life`} className="mt-4">
      <p className="mb-3 text-[11px] text-faint">
        Shared history through age {fork.forkState.age} · fork year {forkStartYear} · identical shocks
        after the fork (common random numbers) · replayable seed {fork.rootLifeSeed.toString(36)}
      </p>
      <ForkChart original={original} fork={fork} />
      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-4">
        <div><span className="text-faint">Original at {matchingOriginal?.age ?? '—'}: </span><span className="tnum text-fg">{fmt(matchingOriginal?.realNetWorth)}</span></div>
        <div><span className="text-faint">Branch: </span><span className="tnum text-fg">{fmt(lastFork?.realNetWorth)}</span></div>
        {divergenceWorth !== undefined && (
          <div>
            <span className="text-faint">Net worth: </span>
            <span className={divergenceWorth >= 0 ? 'text-success tnum' : 'text-danger tnum'}>
              {divergenceWorth >= 0 ? '+' : '−'}{fmt(Math.abs(divergenceWorth)).replace(/^[^.\d]*/, '')}
            </span>
          </div>
        )}
        {divergenceAlignment !== undefined && (
          <div>
            <span className="text-faint">Alignment: </span>
            <span className={divergenceAlignment >= 0 ? 'text-success tnum' : 'text-danger tnum'}>
              {divergenceAlignment >= 0 ? '+' : '−'}{Math.abs(Math.round(divergenceAlignment * 100))} pts
            </span>
          </div>
        )}
      </div>
      {originalPost === undefined && fork.forkYearIndex >= original.snapshots.length && (
        <p className="mt-2 text-[11px] text-faint">The fork extends beyond the original horizon.</p>
      )}
    </Section>
  )
}

/** Compact SVG: shared history line, then original vs fork futures. */
function ForkChart({ original, fork }: { original: SimulationResult; fork: ForkBranch }) {
  const W = 960
  const H = 220
  const PAD = { top: 12, right: 14, bottom: 22, left: 44 }
  const total = Math.max(original.snapshots.length, fork.forkYearIndex + fork.result.snapshots.length)
  let min = Infinity
  let max = -Infinity
  for (const snapshot of original.snapshots) {
    min = Math.min(min, snapshot.realNetWorth)
    max = Math.max(max, snapshot.realNetWorth)
  }
  for (const snapshot of fork.result.snapshots) {
    min = Math.min(min, snapshot.realNetWorth)
    max = Math.max(max, snapshot.realNetWorth)
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) { min = 0; max = 1 }
  if (min === max) { min -= 1; max += 1 }
  const pad = (max - min) * 0.1
  min -= pad
  max += pad
  const x = (t: number): number => PAD.left + (total <= 1 ? 1 : (t / (total - 1)) * (W - PAD.left - PAD.right))
  const y = (v: number): number => PAD.top + (H - PAD.top - PAD.bottom) - ((v - min) / (max - min)) * (H - PAD.top - PAD.bottom)

  const sharedValues = original.snapshots.slice(0, fork.forkYearIndex).map((s) => s.realNetWorth)
  const originalFuture = original.snapshots.slice(Math.max(0, fork.forkYearIndex)).map((s) => s.realNetWorth)
  const forkFuture = fork.result.snapshots.map((s) => s.realNetWorth)
  const sharedPath = sharedValues.map((v, t) => `${t === 0 ? 'M' : 'L'}${x(t).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const originalPath = originalFuture.map((v, t) => `${t === 0 ? 'M' : 'L'}${x(fork.forkYearIndex + t).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const forkPath = forkFuture.map((v, t) => `${t === 0 ? 'M' : 'L'}${x(fork.forkYearIndex + t).toFixed(1)},${y(v).toFixed(1)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Original versus forked life" className="w-full select-none">
      <line x1={x(fork.forkYearIndex)} y1={PAD.top} x2={x(fork.forkYearIndex)} y2={H - PAD.bottom} stroke="var(--accent)" strokeWidth={1} strokeDasharray="4 4" style={{ opacity: 0.7 }} />
      <text x={x(fork.forkYearIndex) + 4} y={PAD.top + 10} fontSize={10} fill="var(--accent-strong)">fork</text>
      {sharedValues.length > 1 && <path d={sharedPath} fill="none" stroke="var(--fg-muted)" strokeWidth={1.75} />}
      <path d={originalPath} fill="none" stroke="var(--fg-faint)" strokeWidth={1.75} strokeDasharray="5 4" />
      <path d={forkPath} fill="none" stroke="var(--accent)" strokeWidth={2} />
      <text x={W - PAD.right} y={PAD.top + 10} textAnchor="end" fontSize={10} fill="var(--fg-faint)">original</text>
      <text x={W - PAD.right} y={H - PAD.bottom - 6} textAnchor="end" fontSize={10} fill="var(--accent-strong)">branch</text>
    </svg>
  )
}

/* ------------------------------ branch tree ------------------------------ */

function BranchTree({
  originalName,
  forks,
  selectedId,
  onSelect,
  onRename,
  onDuplicate,
  onDelete,
  onForkFrom,
}: {
  originalName: string
  forks: ForkBranch[]
  selectedId: string | null
  onSelect: (id: string) => void
  onRename: (id: string, name: string) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  onForkFrom: (parent: ForkBranch) => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [nameDraft, setNameDraft] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const rows = useMemo(() => {
    // Depth = chain length via parent links (safe against corruption).
    const byId = new Map(forks.map((fork) => [fork.id, fork]))
    const depth = (fork: ForkBranch): number => {
      let level = 1
      let parentId = fork.parentBranchId
      const seen = new Set([fork.id])
      while (parentId !== 'root' && byId.has(parentId) && !seen.has(parentId)) {
        seen.add(parentId)
        level += 1
        parentId = byId.get(parentId)!.parentBranchId
      }
      return level
    }
    return [...forks]
      .sort((a, b) => depth(a) - depth(b) || a.forkYearIndex - b.forkYearIndex)
      .map((fork) => ({ fork, depth: depth(fork) }))
  }, [forks])

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs text-muted">
        <span className="font-medium text-fg">● {originalName}</span>
        {forks.length > 0 && <span className="text-faint"> — {forks.length} branch{forks.length === 1 ? '' : 'es'} </span>}
      </p>
      {rows.map(({ fork, depth }) => (
        <div key={fork.id} className="flex flex-wrap items-center gap-2" style={{ paddingLeft: depth * 20 }}>
          <button
            type="button"
            onClick={() => onSelect(fork.id)}
            aria-pressed={selectedId === fork.id}
            className={
              selectedId === fork.id
                ? 'cursor-pointer rounded-md border border-accent bg-accent-soft px-2.5 py-1 text-xs font-medium text-fg'
                : 'cursor-pointer rounded-md border border-line px-2.5 py-1 text-xs text-muted transition-colors hover:border-line-strong hover:text-fg'
            }
          >
            <span className="text-faint">└</span> {fork.name}
            <span className="ml-2 text-[10px] text-faint tnum">age {fork.forkState.age}</span>
          </button>
          {editingId === fork.id ? (
            <>
              <TextInput
                aria-label="Branch name"
                value={nameDraft}
                onChange={(event) => setNameDraft(event.target.value)}
                className="w-44"
              />
              <Button size="sm" onClick={() => { onRename(fork.id, nameDraft.trim() || fork.name); setEditingId(null) }}>Save</Button>
            </>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => { setEditingId(fork.id); setNameDraft(fork.name) }}>
              Rename
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => onDuplicate(fork.id)}>Duplicate</Button>
        <Button size="sm" variant="ghost" onClick={() => onForkFrom(fork)}>Fork this</Button>
          {confirmDeleteId === fork.id ? (
            <>
              <Button size="sm" variant="danger" onClick={() => { onDelete(fork.id); setConfirmDeleteId(null) }}>Confirm</Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteId(null)}>Keep</Button>
            </>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteId(fork.id)}>Delete</Button>
          )}
          {fork.breadcrumbs.length > 0 && (
            <span className="text-[10px] text-faint">
              {['Original life', ...fork.breadcrumbs].join(' → ')}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

/* ------------------------------- butterfly ------------------------------- */

function ButterflySection({
  profile,
  config,
  lifeSeed,
  selectedYearIndex,
  locale,
  currency,
}: {
  profile: PersonProfile
  config: SimulationConfig
  lifeSeed: number
  selectedYearIndex: number
  locale?: string
  currency: string
}) {
  const [divergence, setDivergence] = useState<ButterflyDivergence | null>(null)
  const fmtDelta = (value: number | null | undefined, money = true): string => {
    if (value === undefined || value === null) return '—'
    const sign = value >= 0 ? '+' : '−'
    return money
      ? `${sign}${formatCurrencyValue(Math.abs(value), currency, locale, { compact: true, decimals: 0 })}`
      : `${sign}${Math.abs(Math.round(value * 100) / 100)}`
  }

  const run = (key: string) => {
    const preset = BUTTERFLY_PRESETS.find((entry) => entry.key === key)
    if (!preset) return
    setDivergence(runButterfly(profile, config, lifeSeed, preset, Math.min(selectedYearIndex, config.horizonYears - 6)))
  }

  return (
    <Section
      title="Butterfly mode — one small change"
      className="mt-6"
      aside={<span className="text-[11px] text-faint">paired lives: same world, one tiny difference</span>}
    >
      <div className="flex flex-wrap gap-2">
        {BUTTERFLY_PRESETS.map((preset) => (
          <Button key={preset.key} size="sm" variant={divergence?.preset.key === preset.key ? 'primary' : 'secondary'} onClick={() => run(preset.key)}>
            {preset.label}
          </Button>
        ))}
      </div>
      {divergence && (
        <div className="mt-4">
          <p className="mb-2 text-xs text-muted">
            "{divergence.preset.label}" from age {divergence.fork.forkState.age}. Direct lever: {divergence.preset.directLabel}.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {([['After 5 years', divergence.atYear5], ['After 10 years', divergence.atYear10], ['At the end', divergence.atEnd]] as const).map(
              ([label, snapshot]) =>
                snapshot && (
                  <div key={label} className="rounded-md border border-line p-3">
                    <p className="mb-1.5 text-[10px] font-semibold tracking-widest text-faint uppercase">{label}</p>
                    <ul className="flex flex-col gap-1 text-[11px]">
                      <li className="flex justify-between"><span className="text-faint">Net worth</span><span className={snapshot.realNetWorth >= 0 ? 'text-success tnum' : 'text-danger tnum'}>{fmtDelta(snapshot.realNetWorth)}</span></li>
                      <li className="flex justify-between"><span className="text-faint">Real income</span><span className={snapshot.realIncome >= 0 ? 'text-success tnum' : 'text-danger tnum'}>{fmtDelta(snapshot.realIncome)}</span></li>
                      <li className="flex justify-between"><span className="text-faint">Health</span><span className={snapshot.healthIndex >= 0 ? 'text-success tnum' : 'text-danger tnum'}>{fmtDelta(snapshot.healthIndex, false)}</span></li>
                      <li className="flex justify-between"><span className="text-faint">Alignment</span><span className={snapshot.goalAlignment >= 0 ? 'text-success tnum' : 'text-danger tnum'}>{fmtDelta(snapshot.goalAlignment * 100, false)} pts</span></li>
                    </ul>
                  </div>
                ),
            )}
          </div>
          <p className="mt-3 text-[11px] text-faint">
            Measured differences between paired simulations — direct effects show up early
            ({divergence.preset.directLabel}), downstream effects accumulate. Small causes, visible
            ripples; nothing here is destiny.
          </p>
        </div>
      )}
    </Section>
  )
}

/* ------------------------------ sensitivity ------------------------------ */

function SensitivitySection({
  profile,
  config,
  locale,
  currency,
}: {
  profile: PersonProfile
  config: SimulationConfig
  locale?: string
  currency: string
}) {
  const [metric, setMetric] = useState<SensitivityMetric>('realNetWorth')
  const [results, setResults] = useState<SensitivityDimensionResult[] | null>(null)
  const [progress, setProgress] = useState(0)
  const [running, setRunning] = useState(false)
  const signalRef = useRef({ aborted: false })

  const metricLabels: Record<SensitivityMetric, string> = {
    realNetWorth: 'Net worth at the horizon',
    goalAlignment: 'Your-goal alignment',
    healthIndex: 'Health',
    runwayMonths: 'Emergency runway',
  }

  const runAll = () => {
    setRunning(true)
    setResults(null)
    setProgress(0)
    signalRef.current = { aborted: false }
    const lives = 60
    const horizon = Math.min(config.horizonYears, 20)
    const sliceConfig = { ...config, horizonYears: horizon }
    setTimeout(() => {
      const outcome = runSensitivity(profile, sliceConfig, metric, {
        numLivesPerLevel: lives,
        signal: signalRef.current,
        onProgress: (completed, total) => setProgress(completed / total),
      })
      setResults(outcome)
      setRunning(false)
    }, 30)
  }

  const fmt = (value: number): string => {
    if (metric === 'runwayMonths') return `${value.toFixed(0)} mo`
    if (metric === 'goalAlignment') return `${Math.round(value * 100)}%`
    if (metric === 'healthIndex') return `${Math.round(value)}`
    return formatCurrencyValue(value, currency, locale, { compact: true, decimals: 0 })
  }

  const maxSensitivity = results ? Math.max(...results.map((result) => result.sensitivity), 0.01) : 1

  return (
    <Section
      title="What matters most? — model sensitivity"
      className="mt-6"
      aside={<span className="text-[11px] text-faint">model sensitivity, not philosophical importance</span>}
    >
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl
          aria-label="Outcome metric"
          options={[
            { value: 'realNetWorth', label: 'Net worth' },
            { value: 'goalAlignment', label: 'Alignment' },
            { value: 'healthIndex', label: 'Health' },
            { value: 'runwayMonths', label: 'Runway' },
          ]}
          value={metric}
          onChange={(value) => { setMetric(value); setResults(null) }}
          size="sm"
        />
        <Button variant="primary" onClick={runAll} disabled={running}>
          {running ? 'Analysing…' : `Run sweep (${SENSITIVITY_DIMENSIONS.length} dimensions)`}
        </Button>
      </div>
      {running && (
        <div className="mt-3 max-w-sm">
          <Progress value={progress} aria-label="Sensitivity progress" />
        </div>
      )}
      {running && !results && (
        <div className="mt-3 flex flex-col gap-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      )}
      {results && !running && (
        <div className="mt-4 flex flex-col gap-3">
          {results.map((result) => (
            <div key={result.key}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-xs font-medium text-muted">{result.label}</span>
                <span className="text-[10px] text-faint tnum">{Math.round(result.sensitivity * 100)}% swing</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-line">
                <div
                  className="h-2 rounded-full bg-accent transition-[width] duration-200"
                  style={{ width: `${(result.sensitivity / maxSensitivity) * 100}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-faint tnum">
                {result.levels.map((level) => `${level.label}: ${fmt(level.median)}`).join(' · ')}
              </p>
            </div>
          ))}
          <p className="text-[11px] text-faint">
            {metricLabels[metric]} spread across discrete modelled levels of each dimension —
            how much the outcome moves, not what deserves to matter. Engine {SIMULATION_ENGINE_VERSION}.
          </p>
        </div>
      )}
    </Section>
  )
}

/* ------------------------------- palette --------------------------------- */

function InterventionFields({
  type,
  careerTarget,
  setCareerTarget,
  savingsDelta,
  setSavingsDelta,
  hoursDelta,
  setHoursDelta,
  relocateSettlement,
  setRelocateSettlement,
  migrateTarget,
  setMigrateTarget,
  activityDelta,
  setActivityDelta,
}: {
  type: string
  careerTarget: string
  setCareerTarget: (value: OccupationFamily) => void
  savingsDelta: number
  setSavingsDelta: (value: number) => void
  hoursDelta: number
  setHoursDelta: (value: number) => void
  relocateSettlement: 'small-town' | 'major-city' | 'global-city'
  setRelocateSettlement: (value: 'small-town' | 'major-city' | 'global-city') => void
  migrateTarget: string
  setMigrateTarget: (value: string) => void
  activityDelta: number
  setActivityDelta: (value: number) => void
}) {
  switch (type) {
    case 'change-career':
      return (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">New field</span>
          <Combobox
            options={OCCUPATION_FAMILIES.map((f) => ({ value: f.id, label: f.label }))}
            value={careerTarget}
            onChange={(value) => setCareerTarget(value as OccupationFamily)}
            placeholder="Choose a field…"
            aria-label="Target occupation"
          />
        </div>
      )
    case 'change-savings-rate':
      return (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Savings rate {savingsDelta >= 0 ? '+' : ''}{Math.round(savingsDelta * 100)}%</span>
          <Slider aria-label="Savings delta" value={savingsDelta} onChange={setSavingsDelta} min={-0.15} max={0.3} step={0.05} />
        </div>
      )
    case 'change-working-hours':
      return (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Hours {hoursDelta >= 0 ? '+' : ''}{hoursDelta}/week</span>
          <Slider aria-label="Hours delta" value={hoursDelta} onChange={setHoursDelta} min={-20} max={20} step={1} />
        </div>
      )
    case 'relocate':
      return (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Move to</span>
          <Select
            aria-label="Settlement"
            options={SETTLEMENT_TYPES.map((s) => ({ value: s.id, label: s.label }))}
            value={relocateSettlement}
            onChange={(value) => setRelocateSettlement(value as 'small-town' | 'major-city' | 'global-city')}
          />
        </div>
      )
    case 'migrate':
      return (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Destination country</span>
          <Combobox
            options={listCountryProfiles().map((c) => ({ value: c.identity.code, label: c.identity.name, detail: c.identity.currency }))}
            value={migrateTarget}
            onChange={(code) => setMigrateTarget(code)}
            placeholder="Choose a country…"
            aria-label="Destination country"
          />
        </div>
      )
    case 'lifestyle-change':
      return (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Activity {activityDelta >= 0 ? '+' : ''}{activityDelta} levels</span>
          <Slider aria-label="Activity delta" value={activityDelta} onChange={setActivityDelta} min={-3} max={3} step={1} />
        </div>
      )
    default:
      return <p className="text-xs text-faint">This change applies as configured — no parameters needed.</p>
  }
}

function interventionPreviewName(intervention: Intervention): string {
  return describeIntervention(intervention).title
}
