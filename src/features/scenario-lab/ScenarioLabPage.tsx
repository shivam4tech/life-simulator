import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Button,
  Combobox,
  EmptyState,
  InlineNotice,
  Progress,
  SegmentedControl,
  Select,
  Slider,
  TextInput,
} from '@/components/ui'
import { useProfileStore } from '@/app/store/profile'
import { useScenarioLabStore, type SavedBranch } from '@/app/store/scenario-lab'
import { OCCUPATION_FAMILIES, SETTLEMENT_TYPES } from '@/domain'
import type { EducationLevel, OccupationFamily } from '@/domain'
import { formatCompactNumber, formatCurrencyValue } from '@/utils/format'
import { getCountryProfile } from '@/data/countries'
import {
  DEFAULT_BRANCH_NAME,
  OCCUPATION_MODELS,
  recommendCareers,
  runScenarioComparison,
  assessSwitch,
  SIMULATION_ENGINE_VERSION,
  compareRuns as compareAnalysis,
  type AggregateMetricKey,
  type Intervention,
  type ScenarioComparison,
} from '@/simulation'
import { Section } from '@/features/shared/Section'
import { ComparisonChart } from './ComparisonChart'

type LabPhase = 'config' | 'running' | 'results'

const INTERVENTION_TYPES = [
  { value: 'change-career', label: 'Change career' },
  { value: 'start-education', label: 'Study' },
  { value: 'start-business', label: 'Start a business' },
  { value: 'change-job', label: 'Job hunt' },
  { value: 'change-savings-rate', label: 'Savings rate' },
  { value: 'change-working-hours', label: 'Working hours' },
  { value: 'relocate', label: 'Relocate' },
  { value: 'delay-children', label: 'Delay children' },
] as const

type InterventionType = (typeof INTERVENTION_TYPES)[number]['value']

const CHART_METRICS: readonly { value: AggregateMetricKey; label: string }[] = [
  { value: 'realNetWorth', label: 'Net worth' },
  { value: 'realIncome', label: 'Income' },
  { value: 'runwayMonths', label: 'Runway' },
  { value: 'goalAlignment', label: 'Alignment' },
]

const randomSeed = (): string => Math.floor(Math.random() * 0xffffffff).toString(36)

export function ScenarioLabPage() {
  const navigate = useNavigate()
  const profile = useProfileStore((state) => state.profile)
  const { branches, saveBranch, renameBranch, duplicateBranch, deleteBranch } = useScenarioLabStore()

  const [phase, setPhase] = useState<LabPhase>('config')
  const [interventionType, setInterventionType] = useState<InterventionType>('change-career')
  const [branchName, setBranchName] = useState<string>('')
  const [horizon, setHorizon] = useState<'10' | '20' | '30'>('20')
  const [lives, setLives] = useState<'500' | '2000'>('500')
  const [seed] = useState<string>(() => randomSeed())

  // intervention config state
  const [careerTarget, setCareerTarget] = useState<OccupationFamily | undefined>('technology')
  const [educationLevel, setEducationLevel] = useState<EducationLevel>('bachelor')
  const [educationYears, setEducationYears] = useState(2)
  const [educationMode, setEducationMode] = useState<'full-time' | 'part-time'>('part-time')
  const [businessIndustry, setBusinessIndustry] = useState<OccupationFamily>('service-work')
  const [businessCapitalShare, setBusinessCapitalShare] = useState(0.4)
  const [businessFullTime, setBusinessFullTime] = useState(false)
  const [jobTargetIncrease, setJobTargetIncrease] = useState(0.15)
  const [jobIntensity, setJobIntensity] = useState(6)
  const [savingsDelta, setSavingsDelta] = useState(0.1)
  const [hoursDelta, setHoursDelta] = useState(-5)
  const [relocateSettlement, setRelocateSettlement] = useState<(typeof SETTLEMENT_TYPES)[number]['id']>('major-city')
  const [delayYears, setDelayYears] = useState(3)

  const [comparison, setComparison] = useState<ScenarioComparison | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState({ completed: 0, total: 0 })
  const signalRef = useRef<{ aborted: boolean }>({ aborted: false })

  const country = profile ? getCountryProfile(profile.demographics.countryOfResidence) : undefined
  const currency = country?.identity.currency ?? ''
  const locale = country?.identity.locale

  const recommendations = useMemo(() => (profile ? recommendCareers({ profile }) : []), [profile])

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
        <EmptyState
          title="No life to experiment on yet"
          description="The Decision Lab forks your current state into alternative paths — build a life first."
          action={
            <Button variant="primary" onClick={() => navigate('/create')}>
              Create my life
            </Button>
          }
        />
      </div>
    )
  }

  const currentOccupation = profile.employment?.occupationFamily ?? 'other'

  const buildIntervention = (): Intervention | null => {
    switch (interventionType) {
      case 'change-career': {
        const target = careerTarget ?? 'technology'
        const assessment = assessSwitch(currentOccupation, target, profile.education?.level)
        return { type: 'change-career', target, retrainingYears: Math.round(assessment.trainingYears) }
      }
      case 'start-education':
        return {
          type: 'start-education',
          level: educationLevel,
          years: educationYears,
          mode: educationMode,
        }
      case 'start-business':
        return {
          type: 'start-business',
          industry: businessIndustry,
          startingCapitalShare: businessCapitalShare,
          fullTime: businessFullTime,
        }
      case 'change-job':
        return { type: 'change-job', targetSalaryIncrease: jobTargetIncrease, searchIntensity: jobIntensity }
      case 'change-savings-rate':
        return { type: 'change-savings-rate', delta: savingsDelta }
      case 'change-working-hours':
        return { type: 'change-working-hours', deltaHours: hoursDelta }
      case 'relocate':
        return { type: 'relocate', settlement: relocateSettlement }
      case 'delay-children':
        return { type: 'delay-children', years: delayYears }
      default:
        return null
    }
  }

  const selectedIntervention = useMemo(() => buildIntervention(), [
    interventionType, careerTarget, educationLevel, educationYears, educationMode,
    businessIndustry, businessCapitalShare, businessFullTime, jobTargetIncrease, jobIntensity,
    savingsDelta, hoursDelta, relocateSettlement, delayYears, profile,
  ])

  const run = () => {
    const intervention = selectedIntervention
    if (!intervention) return
    setError(null)
    const total = Number(lives)
    setProgress({ completed: 0, total })
    setPhase('running')
    const baseConfig = {
      seed,
      worldScenario: 'stable' as const,
      horizonYears: Number(horizon),
      startCalendarYear: new Date().getFullYear(),
    }
    signalRef.current = { aborted: false }
    setTimeout(() => {
      try {
        const result = runScenarioComparison(profile, baseConfig, [intervention], {
          numLives: total,
          batchSize: 200,
          signal: signalRef.current,
          onProgress: (completed, totalLives) => setProgress({ completed: completed, total: totalLives }),
        })
        if (signalRef.current.aborted) {
          setPhase('config')
          return
        }
        setComparison(result)
        const branch: SavedBranch = {
          id: '',
          name: branchName.trim() || DEFAULT_BRANCH_NAME([intervention]),
          createdAt: new Date().toISOString(),
          horizonYears: Number(horizon),
          seed,
          worldScenario: 'stable',
          interventions: [intervention],
        }
        saveBranch(branch)
        setPhase('results')
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'The comparison failed.')
        setPhase('config')
      }
    }, 30)
  }

  const cancel = () => {
    signalRef.current.aborted = true
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <header className="mb-6">
        <p className="text-[11px] font-medium tracking-[0.2em] text-accent-strong uppercase">Scenario Lab</p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-fg">What if…?</h1>
        <p className="mt-1 text-sm text-muted">
          Fork your present into alternative paths. Baseline and scenario share the same seeded
          world, so differences come from the decision — not from luck.
        </p>
      </header>

      {error && (
        <InlineNotice tone="danger" title="Comparison failed" className="mb-5">
          {error}
        </InlineNotice>
      )}

      {phase === 'config' && (
        <>
          <Section title="Choose an intervention">
            <div className="flex flex-col gap-4">
              <SegmentedControl
                aria-label="Intervention type"
                options={INTERVENTION_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                value={interventionType}
                onChange={(value) => setInterventionType(value)}
              />
              <InterventionConfig
                type={interventionType}
                profile={profile}
                careerTarget={careerTarget}
                setCareerTarget={setCareerTarget}
                educationLevel={educationLevel}
                setEducationLevel={setEducationLevel}
                educationYears={educationYears}
                setEducationYears={setEducationYears}
                educationMode={educationMode}
                setEducationMode={setEducationMode}
                businessIndustry={businessIndustry}
                setBusinessIndustry={setBusinessIndustry}
                businessCapitalShare={businessCapitalShare}
                setBusinessCapitalShare={setBusinessCapitalShare}
                businessFullTime={businessFullTime}
                setBusinessFullTime={setBusinessFullTime}
                jobTargetIncrease={jobTargetIncrease}
                setJobTargetIncrease={setJobTargetIncrease}
                jobIntensity={jobIntensity}
                setJobIntensity={setJobIntensity}
                savingsDelta={savingsDelta}
                setSavingsDelta={setSavingsDelta}
                hoursDelta={hoursDelta}
                setHoursDelta={setHoursDelta}
                relocateSettlement={relocateSettlement}
                setRelocateSettlement={setRelocateSettlement}
                delayYears={delayYears}
                setDelayYears={setDelayYears}
              />
              {interventionType === 'change-career' && careerTarget && (
                <SwitchPreview from={currentOccupation} to={careerTarget} education={profile.education?.level} />
              )}
            </div>
          </Section>

          <Section title="Universe" className="mt-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted">Horizon</span>
                <SegmentedControl
                  aria-label="Horizon"
                  options={[
                    { value: '10', label: '10y' },
                    { value: '20', label: '20y' },
                    { value: '30', label: '30y' },
                  ]}
                  value={horizon}
                  onChange={setHorizon}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted">Lives per branch</span>
                <SegmentedControl
                  aria-label="Lives per branch"
                  options={[
                    { value: '500', label: '500' },
                    { value: '2000', label: '2,000' },
                  ]}
                  value={lives}
                  onChange={setLives}
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-xs font-medium text-muted">Branch name (optional)</span>
                <TextInput
                  aria-label="Branch name"
                  value={branchName}
                  onChange={(event) => setBranchName(event.target.value)}
                  placeholder={DEFAULT_BRANCH_NAME(selectedIntervention ? [selectedIntervention] : [])}
                />
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button variant="primary" size="lg" onClick={run} disabled={!selectedIntervention}>
                Compare against baseline
              </Button>
              <span className="text-[11px] text-faint">
                runs {formatCompactNumber(Number(lives) * 2)} lives · engine {SIMULATION_ENGINE_VERSION}
              </span>
            </div>
          </Section>

          <Section title="Career Lab — reachable paths from your current state" className="mt-6">
            <RecommendationPanel
              recommendations={recommendations}
              onSimulate={(target) => {
                setInterventionType('change-career')
                setCareerTarget(target)
                setBranchName(`Switch to ${target.replace(/-/g, ' ')}`)
              }}
            />
          </Section>

          {branches.length > 0 && (
            <Section title="Saved branches (this session)" className="mt-6">
              <div className="flex flex-col gap-2">
                {branches.map((branch) => (
                  <BranchRow
                    key={branch.id}
                    branch={branch}
                    onRename={(name) => renameBranch(branch.id, name)}
                    onDuplicate={() => duplicateBranch(branch.id)}
                    onDelete={() => deleteBranch(branch.id)}
                  />
                ))}
              </div>
            </Section>
          )}
        </>
      )}

      {phase === 'running' && (
        <section aria-label="Comparison running" className="mx-auto max-w-md py-14 text-center">
          <p className="font-display text-base font-semibold tracking-wide text-fg uppercase">
            Simulating both branches
          </p>
          <p className="tnum mt-2 text-sm text-muted">
            {formatCompactNumber(progress.completed)} / {formatCompactNumber(progress.total)} paired lives
          </p>
          <div className="mt-4">
            <Progress value={progress.total > 0 ? progress.completed / progress.total : 0} aria-label="Comparison progress" />
          </div>
          <p className="mt-4 text-[11px] text-faint">
            Baseline and scenario lives share the same seeded world, so the differences you'll see
            come from the decision, not from different luck.
          </p>
          <Button variant="danger" className="mt-5" onClick={cancel}>
            Cancel
          </Button>
        </section>
      )}

      {phase === 'results' && comparison && (
        <Results comparison={comparison} onBack={() => setPhase('config')} locale={locale} currency={currency} />
      )}
    </div>
  )
}

/* ------------------------------ config bits ------------------------------ */

interface InterventionConfigProps {
  type: InterventionType
  profile: NonNullable<ReturnType<typeof useProfileStore.getState>['profile']>
  careerTarget: OccupationFamily | undefined
  setCareerTarget: (t: OccupationFamily) => void
  educationLevel: EducationLevel
  setEducationLevel: (l: EducationLevel) => void
  educationYears: number
  setEducationYears: (y: number) => void
  educationMode: 'full-time' | 'part-time'
  setEducationMode: (m: 'full-time' | 'part-time') => void
  businessIndustry: OccupationFamily
  setBusinessIndustry: (o: OccupationFamily) => void
  businessCapitalShare: number
  setBusinessCapitalShare: (v: number) => void
  businessFullTime: boolean
  setBusinessFullTime: (v: boolean) => void
  jobTargetIncrease: number
  setJobTargetIncrease: (v: number) => void
  jobIntensity: number
  setJobIntensity: (v: number) => void
  savingsDelta: number
  setSavingsDelta: (v: number) => void
  hoursDelta: number
  setHoursDelta: (v: number) => void
  relocateSettlement: (typeof SETTLEMENT_TYPES)[number]['id']
  setRelocateSettlement: (s: (typeof SETTLEMENT_TYPES)[number]['id']) => void
  delayYears: number
  setDelayYears: (v: number) => void
}

function InterventionConfig(props: InterventionConfigProps) {
  switch (props.type) {
    case 'change-career':
      return (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Target occupation family</span>
          <Combobox
            options={OCCUPATION_FAMILIES.filter((f) => f.id !== props.profile.employment?.occupationFamily).map((f) => ({
              value: f.id,
              label: f.label,
              detail: `ceiling ${(OCCUPATION_MODELS[f.id]?.incomeCeiling ?? 2).toFixed(1)}×`,
            }))}
            value={props.careerTarget}
            onChange={(value) => props.setCareerTarget(value)}
            placeholder="Choose a destination field…"
            searchPlaceholder="Search fields…"
            aria-label="Target occupation"
          />
        </div>
      )
    case 'start-education':
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">Qualification</span>
            <Select
              aria-label="Qualification level"
              options={[
                { value: 'vocational', label: 'Vocational' },
                { value: 'short-cycle-tertiary', label: 'Short-cycle tertiary' },
                { value: 'bachelor', label: 'Bachelor-equivalent' },
                { value: 'master', label: 'Master-equivalent' },
                { value: 'professional-certification', label: 'Professional credential' },
              ]}
              value={props.educationLevel}
              onChange={(level) => props.setEducationLevel(level)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">Duration: {props.educationYears}y</span>
            <Slider aria-label="Duration" value={props.educationYears} onChange={props.setEducationYears} min={1} max={6} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">Mode</span>
            <SegmentedControl
              aria-label="Study mode"
              options={[
                { value: 'part-time', label: 'Part-time' },
                { value: 'full-time', label: 'Full-time' },
              ]}
              value={props.educationMode}
              onChange={(mode) => props.setEducationMode(mode)}
            />
          </div>
        </div>
      )
    case 'start-business':
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5 sm:col-span-1">
            <span className="text-xs font-medium text-muted">Industry family</span>
            <Combobox
              options={OCCUPATION_FAMILIES.map((f) => ({ value: f.id, label: f.label }))}
              value={props.businessIndustry}
              onChange={(industry) => props.setBusinessIndustry(industry)}
              placeholder="Choose industry…"
              aria-label="Business industry"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">
              Starting capital: {Math.round(props.businessCapitalShare * 100)}% of savings
            </span>
            <Slider aria-label="Starting capital share" value={props.businessCapitalShare} onChange={props.setBusinessCapitalShare} min={0.1} max={0.9} step={0.05} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">Commitment</span>
            <SegmentedControl
              aria-label="Business commitment"
              options={[
                { value: 'side', label: 'Side business' },
                { value: 'full', label: 'Full-time' },
              ]}
              value={props.businessFullTime ? 'full' : 'side'}
              onChange={(v) => props.setBusinessFullTime(v === 'full')}
            />
          </div>
        </div>
      )
    case 'change-job':
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">Target raise: +{Math.round(props.jobTargetIncrease * 100)}%</span>
            <Slider aria-label="Target salary increase" value={props.jobTargetIncrease} onChange={props.setJobTargetIncrease} min={0.05} max={0.4} step={0.01} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">Search intensity: {Math.round(props.jobIntensity)}/10</span>
            <Slider aria-label="Search intensity" value={props.jobIntensity} onChange={props.setJobIntensity} min={1} max={10} />
          </div>
        </div>
      )
    case 'change-savings-rate':
      return (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">
            Redirect {props.savingsDelta >= 0 ? '+' : ''}{Math.round(props.savingsDelta * 100)}% of income into savings/investments
          </span>
          <Slider aria-label="Savings delta" value={props.savingsDelta} onChange={props.setSavingsDelta} min={-0.15} max={0.3} step={0.05} />
        </div>
      )
    case 'change-working-hours':
      return (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">
            {props.hoursDelta > 0 ? '+' : ''}{props.hoursDelta} hours per week
          </span>
          <Slider aria-label="Working hours delta" value={props.hoursDelta} onChange={props.setHoursDelta} min={-20} max={20} step={1} />
        </div>
      )
    case 'relocate':
      return (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Move to a different kind of place</span>
          <Select
            aria-label="Settlement type"
            options={SETTLEMENT_TYPES.filter((s) => s.id !== 'global-city').map((s) => ({ value: s.id, label: s.label }))}
            value={props.relocateSettlement}
            onChange={(settlement) => props.setRelocateSettlement(settlement)}
          />
        </div>
      )
    case 'delay-children':
      return (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Wait ~{props.delayYears} years before trying</span>
          <Slider aria-label="Delay years" value={props.delayYears} onChange={props.setDelayYears} min={1} max={10} />
        </div>
      )
    default:
      return null
  }
}

function SwitchPreview({
  from,
  to,
  education,
}: {
  from: OccupationFamily
  to: OccupationFamily
  education: EducationLevel | undefined
}) {
  const assessment = assessSwitch(from, to, education)
  const labels: Record<string, string> = {
    easy: 'Easy transition',
    moderate: 'Moderate transition',
    difficult: 'Difficult transition',
    'major-retraining': 'Major retraining required',
    'credential-gated': 'Credential-gated',
  }
  return (
    <InlineNotice tone={assessment.distance >= 0.65 ? 'warning' : 'info'} title={labels[assessment.difficulty]}>
      <ul className="list-disc pl-4">
        {assessment.reasons.map((reason, index) => (
          <li key={index}>{reason.replace(/^[+-]\s/, '')}</li>
        ))}
      </ul>
    </InlineNotice>
  )
}

function RecommendationPanel({
  recommendations,
  onSimulate,
}: {
  recommendations: ReturnType<typeof recommendCareers>
  onSimulate: (target: OccupationFamily) => void
}) {
  const strong = recommendations.filter((r) => r.tier === 'strong').slice(0, 3)
  const longer = recommendations.filter((r) => r.tier === 'longer-term').slice(0, 3)
  const stretch = recommendations.filter((r) => r.tier === 'stretch').slice(0, 2)

  const tierDefs: [string, typeof strong, string][] = [
    ['Strong fits', strong, 'close enough to reach without upending your life'],
    ['Longer-term fits', longer, 'real potential, but expect meaningful retraining'],
    ['Ambitious leaps', stretch, 'high distance — shown for exploration, not advice'],
  ]

  return (
    <div className="flex flex-col gap-5">
      {tierDefs.map(([title, entries, hint]) => (
        <div key={title}>
          <p className="mb-1 text-[11px] font-semibold tracking-wide text-faint uppercase">
            {title} <span className="normal-case">— {hint}</span>
          </p>
          {entries.length === 0 ? (
            <p className="text-xs text-faint">None stand out in the current model.</p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {entries.map((rec) => (
                <div key={rec.target} className="flex flex-col gap-1.5 rounded-md border border-line p-3">
                  <p className="text-sm font-medium text-fg first-letter:uppercase">{rec.target.replace(/-/g, ' ')}</p>
                  <p className="text-[11px] leading-snug text-muted">{rec.reasons[0]?.replace(/^[+-]\s/, '')}</p>
                  <Button size="sm" onClick={() => onSimulate(rec.target)}>
                    Simulate this path
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      <p className="text-[11px] text-faint">
        Rule-based model output — reachability and promise from your current state, never salary
        alone, never advice.
      </p>
    </div>
  )
}

function BranchRow({
  branch,
  onRename,
  onDuplicate,
  onDelete,
}: {
  branch: SavedBranch
  onRename: (name: string) => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(branch.name)
  const [confirmDelete, setConfirmDelete] = useState(false)
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-line px-3 py-2">
      {editing ? (
        <>
          <TextInput
            aria-label="Branch name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-48"
          />
          <Button size="sm" onClick={() => { onRename(name.trim() || branch.name); setEditing(false) }}>
            Save
          </Button>
        </>
      ) : (
        <>
          <span className="text-sm text-fg">{branch.name}</span>
          <span className="text-[11px] text-faint tnum">
            {branch.horizonYears}y · seed {branch.seed}
          </span>
        </>
      )}
      <span className="ml-auto flex gap-1.5">
        {!editing && (
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
            Rename
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onDuplicate}>
          Duplicate
        </Button>
        {confirmDelete ? (
          <>
            <Button size="sm" variant="danger" onClick={onDelete}>
              Confirm delete
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
              Keep
            </Button>
          </>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(true)}>
            Delete
          </Button>
        )}
      </span>
    </div>
  )
}

/* -------------------------------- results -------------------------------- */

function Results({
  comparison,
  onBack,
  locale,
  currency,
}: {
  comparison: ScenarioComparison
  onBack: () => void
  locale?: string
  currency: string
}) {
  const analysis = useMemo(
    () => compareAnalysis(comparison.baseline, comparison.scenario, comparison.paired),
    [comparison],
  )
  const [metric, setMetric] = useState<AggregateMetricKey>('realNetWorth')
  const [selectedYearIndex, setSelectedYearIndex] = useState(comparison.baseline.aggregates.length - 1)

  const fmt = (value: number | undefined): string => {
    if (value === undefined) return '—'
    return formatCurrencyValue(value, currency, locale, { compact: true, decimals: 0 })
  }


  return (
    <div className="flex flex-col gap-2">
      <header>
        <p className="font-display text-lg font-semibold text-fg">Baseline vs alternative</p>
        <p className="mt-1 text-[11px] text-faint tnum">
          fork at current age · {comparison.baseline.numLives.toLocaleString()} paired lives · seed {String(comparison.baseline.config.seed)} · {(comparison.elapsedMs / 1000).toFixed(1)}s
        </p>
      </header>

      <Section title="Trade-off summary" className="mt-4">
        <p className="text-sm leading-relaxed text-pretty text-muted">{analysis.tradeoffSummary}</p>
      </Section>

      <Section title="Median paths" className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentedControl
            aria-label="Comparison metric"
            options={CHART_METRICS.map((m) => ({ value: m.value, label: m.label }))}
            value={metric}
            onChange={setMetric}
            size="sm"
          />
          <div className="flex items-center gap-4 text-[11px] text-faint">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-5 border-t-2 border-dashed" style={{ borderColor: 'var(--fg-faint)' }} /> baseline
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-5 bg-accent" /> scenario
            </span>
          </div>
        </div>
        <div className="mt-3">
          <ComparisonChart
            baseline={comparison.baseline.aggregates}
            scenario={comparison.scenario.aggregates}
            metric={metric}
            selectedYearIndex={selectedYearIndex}
            onScrub={setSelectedYearIndex}
            scenarioLabel="Scenario"
            ariaLabel="Baseline versus scenario trajectories"
          />
        </div>
        <p className="mt-2 text-[11px] text-faint">
          At age {comparison.baseline.aggregates[selectedYearIndex]?.age ?? '—'}: baseline{' '}
          {fmt(comparison.baseline.aggregates[selectedYearIndex]?.metrics[metric]?.p50)} vs scenario{' '}
          {fmt(comparison.scenario.aggregates[selectedYearIndex]?.metrics[metric]?.p50)} (medians).
        </p>
      </Section>

      <Section title="Where the branches differ at the horizon" className="mt-6">
        <div className="flex flex-col gap-3">
          {analysis.deltas.map((delta) => (
            <div key={delta.key} className="flex items-baseline justify-between gap-4 border-b border-line pb-2">
              <span className="text-xs text-muted">{delta.label}</span>
              <span
                className={
                  delta.tone === 'up'
                    ? 'text-xs font-medium text-success tnum'
                    : delta.tone === 'down'
                      ? 'text-xs font-medium text-danger tnum'
                      : 'text-xs text-faint tnum'
                }
              >
                {delta.tone === 'flat'
                  ? '≈ similar'
                  : `${delta.tone === 'up' ? '+' : '−'}${
                      delta.format === 'percent'
                        ? `${Math.abs(Math.round(delta.deltaAbs * 100))} pts`
                        : formatCompactNumber(Math.abs(delta.deltaAbs))
                    }${
                      delta.deltaPct !== null && delta.format !== 'percent'
                        ? ` (${Math.round(Math.abs(delta.deltaPct * 100))}%)`
                        : ''
                    }`}
              </span>
            </div>
          ))}
        </div>
        {analysis.breakEven.overtakenAtYearIndex !== null && (
          <InlineNotice tone="info" title="Break-even" className="mt-4">
            The scenario's median net worth overtakes the baseline around{' '}
            <strong>year {analysis.breakEven.overtakenAtYearIndex + 1}</strong> (age{' '}
            {analysis.breakEven.overtakenAtAge}) and stays ahead. About{' '}
            {Math.round(analysis.breakEven.shareAheadAtHorizon * 100)}% of paired lives end ahead.
          </InlineNotice>
        )}
        {analysis.breakEven.overtakenAtYearIndex === null && (
          <InlineNotice tone="warning" title="Break-even" className="mt-4">
            Within this horizon the scenario never sustainably overtakes the baseline's median net
            worth — it ends ahead in about {Math.round(analysis.breakEven.shareAheadAtHorizon * 100)}%
            of paired lives.
          </InlineNotice>
        )}
      </Section>

      <div className="mt-4">
        <Button variant="secondary" onClick={onBack}>
          Configure another branch
        </Button>
      </div>
    </div>
  )
}

