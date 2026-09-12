import type { PersonProfile } from '@/domain/person'
import { annualMoney, known, monthlyMoney } from '@/domain'
import { DEMO_PROFILE_ID } from './demo-constants'

/**
 * Bundled fictional example — lets the interface be explored without onboarding.
 * ⚠️ This person does not exist; every value is invented for demonstration.
 */
export const DEMO_PROFILE: PersonProfile = {
  id: DEMO_PROFILE_ID,
  displayName: 'Ada Mensah (fictional example)',
  isFictional: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  demographics: {
    age: known(28),
    sex: 'female',
    countryOfResidence: 'GH',
    citizenships: ['GH'],
    residencyStatus: 'citizen',
    region: 'Greater Accra',
    city: 'Accra',
    settlementType: 'major-city',
  },
  household: {
    size: known(1),
    livingWithFamily: false,
    sendsFamilySupport: true,
    receivesFamilySupport: false,
    hasCareObligations: true,
  },
  education: {
    level: 'bachelor',
    localQualificationName: 'BA Business Administration',
    field: 'Business administration',
    currentlyStudying: false,
    yearsSinceCompletion: known(5),
    retrainingWillingness: known(7),
  },
  employment: {
    status: 'employed',
    occupationFamily: 'finance',
    industry: 'Banking',
    seniority: 'mid',
    yearsExperience: known(5),
    grossIncome: known(monthlyMoney(9500, 'GHS')),
    hoursPerWeek: known(45),
    jobStability: known(6),
    careerSatisfaction: known(6),
    remoteCompatible: true,
    entrepreneurialInterest: known(6),
  },
  finances: {
    savings: known(annualMoney(42000, 'GHS')),
    investments: known(annualMoney(15000, 'GHS')),
    debt: known(annualMoney(8000, 'GHS')),
    housingCost: known(monthlyMoney(2500, 'GHS')),
    essentialMonthlyExpenses: known(monthlyMoney(3200, 'GHS')),
    discretionaryMonthlySpending: known(monthlyMoney(900, 'GHS')),
  },
  housing: {
    state: 'renting',
  },
  dependents: {
    count: known(0),
    notes: 'Contributes to a younger sibling’s school costs',
  },
  health: {
    overall: known(4),
    activity: known(6),
    sleepQuality: known(6),
    smoking: false,
    healthcareAccess: known(6),
  },
  behaviours: {
    riskTolerance: 6,
    discipline: 7,
    patience: 6,
    persistence: 7,
    adaptability: 7,
    sociability: 6,
    stressTolerance: 5,
    noveltySeeking: 6,
    careerAmbition: 8,
    financialRestraint: 6,
    familyOrientation: 7,
    geographicMobility: 6,
    learningInclination: 7,
    entrepreneurialTendency: 6,
  },
  relationshipStatus: 'single',
  goals: {
    freedom: 8,
    financialSecurity: 8,
    family: 7,
    wealth: 7,
    career: 6,
    health: 6,
    contribution: 5,
  },
  constraints: {
    unwillingToRelocateInternationally: false,
    familyCareObligations: true,
    debtObligations: false,
  },
}
