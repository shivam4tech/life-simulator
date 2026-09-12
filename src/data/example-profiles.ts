import type { PersonProfile } from '@/domain/person'
import { known, monthlyMoney } from '@/domain'
import { DEMO_PROFILE } from './demo-profile'
import { DEMO_PROFILE_ID } from './demo-constants'

/**
 * Fictional example lives — meaningfully different contexts so the interface
 * gets exercised without onboarding. Every person here is invented; none of
 * these profiles encode beliefs about any real nationality or group.
 */

export interface ExampleProfile {
  profile: PersonProfile
  /** One-line story shown in the chooser. */
  blurb: string
}

const base = (id: string, displayName: string): Pick<PersonProfile, 'id' | 'displayName' | 'isFictional' | 'createdAt'> => ({
  id,
  displayName: `${displayName} (fictional example)`,
  isFictional: true,
  createdAt: '2026-01-01T00:00:00.000Z',
})

/** Young gig worker in a rapidly-growing emerging economy. */
const MINH: PersonProfile = {
  ...base('demo-minh-vn', 'Minh Nguyễn'),
  demographics: {
    age: known(22),
    countryOfResidence: 'VN',
    citizenships: ['VN'],
    residencyStatus: 'citizen',
    city: 'Da Nang',
    settlementType: 'secondary-city',
  },
  education: { level: 'upper-secondary', currentlyStudying: false, yearsSinceCompletion: known(3), retrainingWillingness: known(8) },
  employment: {
    status: 'gig-freelance',
    occupationFamily: 'transport-logistics',
    industry: 'App-based delivery',
    yearsExperience: known(3),
    grossIncome: known(monthlyMoney(9500000, 'VND')),
    hoursPerWeek: known(52),
    jobStability: known(3),
    careerSatisfaction: known(5),
    willingnessToChangeJobs: 7,
    willingnessToChangeCareers: 8,
  },
  finances: { savings: known(monthlyMoney(14000000, 'VND')), debt: known(monthlyMoney(6000000, 'VND')) },
  housing: { state: 'family-household' },
  household: { size: known(4), livingWithFamily: true, sendsFamilySupport: true, receivesFamilySupport: false },
  dependents: { count: known(0) },
  health: { overall: known(4), activity: known(7), sleepQuality: known(4), smoking: false, healthcareAccess: known(5) },
  behaviours: {
    riskTolerance: 7, discipline: 5, patience: 4, persistence: 7, adaptability: 8, sociability: 6,
    stressTolerance: 6, noveltySeeking: 7, careerAmbition: 7, financialRestraint: 4, familyOrientation: 8,
    geographicMobility: 7, learningInclination: 8, entrepreneurialTendency: 6,
  },
  relationshipStatus: 'single',
  relationshipPreferences: { desiresPartnership: 'yes', marriagePreference: 'open', childrenPreference: 'unsure' },
  goals: { financialSecurity: 9, wealth: 7, family: 7, freedom: 8, career: 6 },
  constraints: { familyCareObligations: false },
}

/** Mid-career professional in a high-income, high-cost economy. */
const LENA: PersonProfile = {
  ...base('demo-lena-de', 'Lena Hoffmann'),
  demographics: {
    age: known(41),
    countryOfResidence: 'DE',
    citizenships: ['DE'],
    residencyStatus: 'citizen',
    city: 'Hamburg',
    settlementType: 'major-city',
  },
  education: { level: 'master', localQualificationName: 'MSc Computer Science', field: 'Computer science', currentlyStudying: false, yearsSinceCompletion: known(16), retrainingWillingness: known(5) },
  employment: {
    status: 'employed',
    occupationFamily: 'technology',
    industry: 'Enterprise software',
    seniority: 'senior',
    yearsExperience: known(17),
    grossIncome: known(monthlyMoney(7400, 'EUR')),
    hoursPerWeek: known(40),
    jobStability: known(8),
    careerSatisfaction: known(6),
    remoteCompatible: true,
    entrepreneurialInterest: known(3),
    willingnessToChangeJobs: 4,
    willingnessToChangeCareers: 2,
  },
  finances: {
    savings: known(monthlyMoney(90000, 'EUR')),
    investments: known(monthlyMoney(120000, 'EUR')),
    debt: known(monthlyMoney(180000, 'EUR')),
    housingCost: known(monthlyMoney(1650, 'EUR')),
    essentialMonthlyExpenses: known(monthlyMoney(2600, 'EUR')),
    discretionaryMonthlySpending: known(monthlyMoney(700, 'EUR')),
  },
  housing: { state: 'mortgage' },
  household: { size: known(3), livingWithFamily: false, sendsFamilySupport: false, receivesFamilySupport: false },
  dependents: { count: known(1), notes: 'Daughter, age 9' },
  health: { overall: known(4), activity: known(5), sleepQuality: known(6), smoking: false, healthcareAccess: known(9) },
  behaviours: {
    riskTolerance: 4, discipline: 7, patience: 7, persistence: 7, adaptability: 5, sociability: 5,
    stressTolerance: 7, noveltySeeking: 4, careerAmbition: 6, financialRestraint: 8, familyOrientation: 7,
    geographicMobility: 3, learningInclination: 6, entrepreneurialTendency: 3,
  },
  relationshipStatus: 'married',
  relationshipPreferences: {
    desiresPartnership: 'yes', marriagePreference: 'important', currentRelationshipSatisfaction: known(7),
    childrenPreference: 'yes', desiredNumberOfChildren: known(1), childrenTiming: 'later', opennessToAdoption: false,
  },
  goals: { family: 9, financialSecurity: 8, health: 7, career: 5, leisure: 6 },
  constraints: { cannotRelocate: false, unwillingToRelocateInternationally: true, familyCareObligations: true },
}

/** Self-employed designer with irregular income in an emerging economy. */
const DIEGO: PersonProfile = {
  ...base('demo-diego-br', 'Diego Ferreira'),
  demographics: {
    age: known(35),
    countryOfResidence: 'BR',
    citizenships: ['BR'],
    residencyStatus: 'citizen',
    city: 'São Paulo',
    settlementType: 'global-city',
  },
  education: { level: 'bachelor', localQualificationName: 'Bacharel em Design Gráfico', field: 'Design', currentlyStudying: false, yearsSinceCompletion: known(11), retrainingWillingness: known(7) },
  employment: {
    status: 'self-employed',
    occupationFamily: 'arts-media',
    industry: 'Brand & web design',
    seniority: 'mid',
    yearsExperience: known(11),
    grossIncome: known(monthlyMoney(9200, 'BRL')),
    hoursPerWeek: known(45),
    jobStability: known(4),
    careerSatisfaction: known(8),
    remoteCompatible: true,
    entrepreneurialInterest: known(9),
    willingnessToChangeJobs: 8,
    willingnessToChangeCareers: 5,
  },
  finances: {
    savings: known(monthlyMoney(22000, 'BRL')),
    debt: known(monthlyMoney(15000, 'BRL')),
    housingCost: known(monthlyMoney(2800, 'BRL')),
    essentialMonthlyExpenses: known(monthlyMoney(4200, 'BRL')),
    discretionaryMonthlySpending: known(monthlyMoney(1200, 'BRL')),
  },
  housing: { state: 'renting' },
  household: { size: known(2), livingWithFamily: false, sendsFamilySupport: false, receivesFamilySupport: false },
  dependents: { count: known(0) },
  health: { overall: known(4), activity: known(6), sleepQuality: known(5), smoking: false, healthcareAccess: known(6) },
  behaviours: {
    riskTolerance: 8, discipline: 6, patience: 5, persistence: 8, adaptability: 8, sociability: 7,
    stressTolerance: 6, noveltySeeking: 8, careerAmbition: 7, financialRestraint: 4, familyOrientation: 6,
    geographicMobility: 6, learningInclination: 7, entrepreneurialTendency: 9,
  },
  relationshipStatus: 'cohabiting',
  relationshipPreferences: {
    desiresPartnership: 'yes', marriagePreference: 'not-for-me', currentRelationshipSatisfaction: known(8),
    childrenPreference: 'no', opennessToAdoption: false,
  },
  goals: { freedom: 9, creativity: 9, career: 7, wealth: 6, adventure: 6 },
  constraints: { debtObligations: true },
}

/** University student in a rapidly-growing economy, supported by family. */
const PRIYA: PersonProfile = {
  ...base('demo-priya-in', 'Priya Sharma'),
  demographics: {
    age: known(20),
    countryOfResidence: 'IN',
    citizenships: ['IN'],
    residencyStatus: 'citizen',
    city: 'Pune',
    settlementType: 'major-city',
  },
  education: {
    level: 'bachelor', localQualificationName: 'B.Tech (in progress)', field: 'Mechanical engineering',
    currentlyStudying: true, institutionSelectivity: 'selective', retrainingWillingness: known(8),
  },
  employment: {
    status: 'student',
    hoursPerWeek: known(10),
    jobStability: known(5),
    careerSatisfaction: known(6),
    willingnessToChangeCareers: 6,
    entrepreneurialInterest: known(5),
  },
  finances: { savings: known(monthlyMoney(30000, 'INR')) },
  housing: { state: 'family-household' },
  household: { size: known(5), livingWithFamily: true, sendsFamilySupport: false, receivesFamilySupport: true },
  dependents: { count: known(0) },
  health: { overall: known(4), activity: known(5), sleepQuality: known(4), smoking: false, healthcareAccess: known(5) },
  behaviours: {
    riskTolerance: 5, discipline: 7, patience: 6, persistence: 7, adaptability: 6, sociability: 6,
    stressTolerance: 5, noveltySeeking: 6, careerAmbition: 8, financialRestraint: 5, familyOrientation: 8,
    geographicMobility: 7, learningInclination: 9, entrepreneurialTendency: 5,
  },
  relationshipStatus: 'single',
  relationshipPreferences: { desiresPartnership: 'unsure', marriagePreference: 'open', childrenPreference: 'unsure' },
  goals: { career: 9, knowledge: 8, family: 8, financialSecurity: 7, contribution: 5 },
  constraints: { educationConstraints: true },
}

/** Parent with dependents, informal-sector work, sending support home. */
const GRACE: PersonProfile = {
  ...base('demo-grace-ke', 'Grace Achieng'),
  demographics: {
    age: known(38),
    countryOfResidence: 'KE',
    citizenships: ['KE'],
    residencyStatus: 'citizen',
    city: 'Kisumu',
    settlementType: 'secondary-city',
  },
  education: { level: 'vocational', localQualificationName: 'Diploma in Business Studies', field: 'Business', currentlyStudying: false, yearsSinceCompletion: known(15), retrainingWillingness: known(6) },
  employment: {
    status: 'informal',
    occupationFamily: 'sales-marketing',
    industry: 'Market trading',
    yearsExperience: known(14),
    grossIncome: known(monthlyMoney(32000, 'KES')),
    hoursPerWeek: known(55),
    jobStability: known(3),
    careerSatisfaction: known(5),
    willingnessToChangeJobs: 6,
    willingnessToChangeCareers: 5,
  },
  finances: {
    savings: known(monthlyMoney(45000, 'KES')),
    debt: known(monthlyMoney(60000, 'KES')),
    housingCost: known(monthlyMoney(9000, 'KES')),
    essentialMonthlyExpenses: known(monthlyMoney(21000, 'KES')),
    discretionaryMonthlySpending: known(monthlyMoney(2000, 'KES')),
  },
  housing: { state: 'renting' },
  household: { size: known(6), livingWithFamily: true, sendsFamilySupport: true, receivesFamilySupport: false, hasCareObligations: true },
  dependents: { count: known(3), notes: 'Ages 14, 11 and 7' },
  health: { overall: known(3), activity: known(6), sleepQuality: known(4), smoking: false, healthcareAccess: known(4) },
  behaviours: {
    riskTolerance: 4, discipline: 8, patience: 7, persistence: 9, adaptability: 7, sociability: 8,
    stressTolerance: 7, noveltySeeking: 3, careerAmbition: 6, financialRestraint: 7, familyOrientation: 9,
    geographicMobility: 4, learningInclination: 6, entrepreneurialTendency: 7,
  },
  relationshipStatus: 'widowed',
  relationshipPreferences: { desiresPartnership: 'unsure', marriagePreference: 'prefer-not', childrenPreference: 'no' },
  goals: { family: 10, financialSecurity: 9, health: 8, community: 6, contribution: 6 },
  constraints: { familyCareObligations: true, debtObligations: true },
}

/** Skilled professional actively considering a move abroad. */
const MARCO: PersonProfile = {
  ...base('demo-marco-ph', 'Marco Reyes'),
  demographics: {
    age: known(29),
    countryOfResidence: 'PH',
    citizenships: ['PH'],
    residencyStatus: 'citizen',
    city: 'Manila',
    settlementType: 'global-city',
  },
  education: { level: 'bachelor', localQualificationName: 'BS Nursing', field: 'Nursing', currentlyStudying: false, yearsSinceCompletion: known(6), retrainingWillingness: known(7) },
  employment: {
    status: 'employed',
    occupationFamily: 'healthcare',
    industry: 'Private hospital',
    seniority: 'junior',
    yearsExperience: known(6),
    grossIncome: known(monthlyMoney(38000, 'PHP')),
    hoursPerWeek: known(48),
    jobStability: known(6),
    careerSatisfaction: known(4),
    remoteCompatible: false,
    willingnessToChangeJobs: 8,
    willingnessToChangeCareers: 4,
  },
  finances: {
    savings: known(monthlyMoney(260000, 'PHP')),
    debt: known(monthlyMoney(90000, 'PHP')),
    housingCost: known(monthlyMoney(12000, 'PHP')),
    essentialMonthlyExpenses: known(monthlyMoney(18000, 'PHP')),
    discretionaryMonthlySpending: known(monthlyMoney(5000, 'PHP')),
  },
  housing: { state: 'renting' },
  household: { size: known(1), livingWithFamily: false, sendsFamilySupport: true, receivesFamilySupport: false, hasCareObligations: false },
  dependents: { count: known(0) },
  health: { overall: known(4), activity: known(5), sleepQuality: known(5), smoking: false, healthcareAccess: known(5) },
  behaviours: {
    riskTolerance: 6, discipline: 7, patience: 6, persistence: 8, adaptability: 7, sociability: 6,
    stressTolerance: 6, noveltySeeking: 7, careerAmbition: 8, financialRestraint: 6, familyOrientation: 8,
    geographicMobility: 9, learningInclination: 7, entrepreneurialTendency: 4,
  },
  relationshipStatus: 'dating',
  relationshipPreferences: {
    desiresPartnership: 'yes', marriagePreference: 'open', currentRelationshipSatisfaction: known(7),
    childrenPreference: 'unsure', childrenTiming: 'unsure', opennessToAdoption: false,
  },
  goals: { career: 8, financialSecurity: 9, family: 8, adventure: 7, freedom: 7 },
  constraints: { unwillingToRelocateInternationally: false, familyCareObligations: false },
}

export const EXAMPLE_PROFILES: readonly ExampleProfile[] = [
  { profile: DEMO_PROFILE, blurb: 'Mid-level finance professional in Accra, saving for freedom and family.' },
  { profile: MINH, blurb: '22, app-based delivery rider in Vietnam — high hours, big ambitions.' },
  { profile: LENA, blurb: 'Senior software engineer near Hamburg — mortgage, family, settled career.' },
  { profile: DIEGO, blurb: 'Self-employed designer in São Paulo — irregular income, high freedom.' },
  { profile: PRIYA, blurb: 'Engineering student in Pune — family-supported, career-focused.' },
  { profile: GRACE, blurb: 'Market trader and widowed parent of three in Kisumu — resilience under pressure.' },
  { profile: MARCO, blurb: 'Nurse in Manila actively weighing a move abroad.' },
]

export const findExampleById = (id: string): ExampleProfile | undefined =>
  EXAMPLE_PROFILES.find((example) => example.profile.id === id)

export { DEMO_PROFILE_ID }
