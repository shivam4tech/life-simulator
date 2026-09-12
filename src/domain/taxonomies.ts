/**
 * Generic, globally applicable taxonomies.
 *
 * These intentionally avoid country-specific terminology (B.Com, Abitur, GED…).
 * Local qualification names can be captured as descriptive free text elsewhere
 * and mapped onto these universal levels.
 */

export interface TaxonomyTerm<Id extends string = string> {
  readonly id: Id
  readonly label: string
}

const defineTaxonomy = <Id extends string>(terms: readonly TaxonomyTerm<Id>[]) => terms

/* ------------------------------ Education ------------------------------ */

export const EDUCATION_LEVELS = defineTaxonomy([
  { id: 'none', label: 'No formal education' },
  { id: 'primary', label: 'Primary / basic' },
  { id: 'lower-secondary', label: 'Lower secondary' },
  { id: 'upper-secondary', label: 'Upper secondary' },
  { id: 'vocational', label: 'Vocational / post-secondary' },
  { id: 'short-cycle-tertiary', label: 'Short-cycle tertiary' },
  { id: 'bachelor', label: 'Bachelor-equivalent' },
  { id: 'master', label: 'Master-equivalent' },
  { id: 'doctorate', label: 'Doctorate / professional doctorate' },
  { id: 'professional-certification', label: 'Professional certification' },
  { id: 'other', label: 'Other' },
] as const)

export type EducationLevel = (typeof EDUCATION_LEVELS)[number]['id']

/* ----------------------------- Employment ------------------------------ */

export const EMPLOYMENT_STATUSES = defineTaxonomy([
  { id: 'student', label: 'Student' },
  { id: 'unemployed', label: 'Unemployed' },
  { id: 'employed', label: 'Employed' },
  { id: 'self-employed', label: 'Self-employed' },
  { id: 'business-owner', label: 'Business owner' },
  { id: 'informal', label: 'Informal work' },
  { id: 'gig-freelance', label: 'Gig / freelance' },
  { id: 'caregiver', label: 'Caregiver' },
  { id: 'retired', label: 'Retired' },
  { id: 'unable-to-work', label: 'Unable to work' },
  { id: 'other', label: 'Other' },
] as const)

export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number]['id']

/* -------------------------- Occupation family -------------------------- */

export const OCCUPATION_FAMILIES = defineTaxonomy([
  { id: 'administration', label: 'Administration' },
  { id: 'agriculture', label: 'Agriculture' },
  { id: 'arts-media', label: 'Arts / media' },
  { id: 'business', label: 'Business' },
  { id: 'construction', label: 'Construction' },
  { id: 'education', label: 'Education' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'finance', label: 'Finance' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'hospitality', label: 'Hospitality' },
  { id: 'law-public-policy', label: 'Law / public policy' },
  { id: 'manufacturing', label: 'Manufacturing' },
  { id: 'sales-marketing', label: 'Sales / marketing' },
  { id: 'science-research', label: 'Science / research' },
  { id: 'skilled-trades', label: 'Skilled trades' },
  { id: 'technology', label: 'Technology' },
  { id: 'transport-logistics', label: 'Transport / logistics' },
  { id: 'service-work', label: 'Service work' },
  { id: 'military-security', label: 'Military / security' },
  { id: 'other', label: 'Other' },
] as const)

export type OccupationFamily = (typeof OCCUPATION_FAMILIES)[number]['id']

/* ------------------------------ Settlement ----------------------------- */

export const SETTLEMENT_TYPES = defineTaxonomy([
  { id: 'rural', label: 'Rural' },
  { id: 'small-town', label: 'Small town' },
  { id: 'secondary-city', label: 'Secondary city' },
  { id: 'major-city', label: 'Major city' },
  { id: 'global-city', label: 'Global / megacity' },
] as const)

export type SettlementType = (typeof SETTLEMENT_TYPES)[number]['id']

/* ---------------------------- Relationships ---------------------------- */

export const RELATIONSHIP_STATUSES = defineTaxonomy([
  { id: 'single', label: 'Single' },
  { id: 'dating', label: 'Dating' },
  { id: 'committed', label: 'Committed relationship' },
  { id: 'cohabiting', label: 'Cohabiting' },
  { id: 'married', label: 'Married / formal partnership' },
  { id: 'separated', label: 'Separated' },
  { id: 'divorced', label: 'Divorced' },
  { id: 'widowed', label: 'Widowed' },
  { id: 'other', label: 'Other' },
] as const)

export type RelationshipStatus = (typeof RELATIONSHIP_STATUSES)[number]['id']

/* -------------------------------- Housing ------------------------------ */

export const HOUSING_STATES = defineTaxonomy([
  { id: 'family-household', label: 'Family household' },
  { id: 'renting', label: 'Renting' },
  { id: 'owned-outright', label: 'Own outright' },
  { id: 'mortgage', label: 'Own with mortgage' },
  { id: 'shared', label: 'Shared housing' },
  { id: 'employer-provided', label: 'Employer-provided housing' },
  { id: 'temporary-informal', label: 'Temporary / informal' },
  { id: 'other', label: 'Other' },
] as const)

export type HousingState = (typeof HOUSING_STATES)[number]['id']

/* ------------------------------ Seniority ------------------------------ */

export const SENIORITY_LEVELS = defineTaxonomy([
  { id: 'entry', label: 'Entry' },
  { id: 'junior', label: 'Junior' },
  { id: 'mid', label: 'Mid-level' },
  { id: 'senior', label: 'Senior' },
  { id: 'lead', label: 'Lead' },
  { id: 'management', label: 'Management' },
  { id: 'executive-specialist', label: 'Executive / specialist' },
] as const)

export type Seniority = (typeof SENIORITY_LEVELS)[number]['id']

/* ------------------------------ Residency ------------------------------ */

export const RESIDENCY_STATUSES = defineTaxonomy([
  { id: 'citizen', label: 'Citizen' },
  { id: 'permanent-resident', label: 'Permanent resident' },
  { id: 'temporary-resident', label: 'Temporary resident' },
  { id: 'student-resident', label: 'Student (study permit)' },
  { id: 'worker-permit', label: 'Worker (work permit)' },
  { id: 'other', label: 'Other' },
] as const)

export type ResidencyStatus = (typeof RESIDENCY_STATUSES)[number]['id']

/* ------------------------------- Helpers ------------------------------- */

export const taxonomyLabel = <Id extends string>(
  terms: readonly TaxonomyTerm<Id>[],
  id: Id | undefined,
): string | undefined => terms.find((term) => term.id === id)?.label

export const taxonomyById = <Id extends string>(
  terms: readonly TaxonomyTerm<Id>[],
): ReadonlyMap<Id, TaxonomyTerm<Id>> => new Map(terms.map((term) => [term.id, term]))
