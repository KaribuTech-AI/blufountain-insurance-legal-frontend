import { z } from 'zod';
import { IsoDate, NationalId, Phone, Reason } from './fields.js';
import { ActionState, MatterType, Province, PageQuery } from './legal.js';

/* ------------------------------------------------------------------------------------------
 * Legal cover: products, policies, cover check, premiums (Phase 4; BR-30 to BR-37)
 * Amounts are integer minor units (cents), like the legal aid figures.
 * ---------------------------------------------------------------------------------------- */

const Minor = z.number().int().min(0).max(100_000_000_00);

export const POLICY_STANDINGS = [
  { code: 'active', label: 'Active' },
  { code: 'grace_period', label: 'Grace period' },
  { code: 'lapsed', label: 'Lapsed' },
  { code: 'not_started', label: 'Not started' },
  { code: 'cancelled', label: 'Cancelled' },
] as const;
export const PolicyStanding = z.enum(
  POLICY_STANDINGS.map((s) => s.code) as [string, ...string[]],
) as z.ZodType<(typeof POLICY_STANDINGS)[number]['code']>;
export type PolicyStanding = z.infer<typeof PolicyStanding>;

export const PAYMENT_METHODS = [
  { code: 'ecocash', label: 'EcoCash' },
  { code: 'onemoney', label: 'OneMoney' },
  { code: 'bank_debit_order', label: 'Bank debit order' },
  { code: 'payroll_deduction', label: 'Payroll deduction' },
  { code: 'group_collection', label: 'Group collection' },
  { code: 'cash', label: 'Cash' },
] as const;
export const PaymentMethod = z.enum(PAYMENT_METHODS.map((m) => m.code) as [string, ...string[]], {
  error: 'Choose how the premium is paid',
});

/** How a premium was handed over when recorded at the office. */
export const PREMIUM_METHODS = [
  { code: 'ecocash', label: 'EcoCash' },
  { code: 'onemoney', label: 'OneMoney' },
  { code: 'bank_transfer', label: 'Bank transfer' },
  { code: 'cash', label: 'Cash' },
] as const;

export const RELATIONSHIPS = [
  'Spouse',
  'Son',
  'Daughter',
  'Mother',
  'Father',
  'Sibling',
  'Family member',
] as const;

/* ------------------------------------------------------------------------------------------
 * Products and schemes
 * ---------------------------------------------------------------------------------------- */

export const Product = z.object({
  id: z.string(),
  name: z.string(),
  monthlyPremiumMinor: Minor,
  annualLimitMinor: Minor,
  perMatterLimitMinor: Minor,
  coversDependants: z.boolean(),
  coverages: z.array(z.object({ matterType: z.string(), waitingDays: z.number().int() })),
  exclusionsText: z.string(),
});
export type Product = z.infer<typeof Product>;

export const Scheme = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(['payroll_deduction', 'group_collection']),
  productId: z.string(),
  contact: z.string(),
  memberCount: z.number().int(),
});
export type Scheme = z.infer<typeof Scheme>;

export const CoverReference = z.object({ products: z.array(Product), schemes: z.array(Scheme) });
export type CoverReference = z.infer<typeof CoverReference>;

/* ------------------------------------------------------------------------------------------
 * Policies
 * ---------------------------------------------------------------------------------------- */

export const PolicyListQuery = z.strictObject({
  ...PageQuery,
  standing: PolicyStanding.optional(),
  schemeId: z.string().optional(),
  agentId: z.string().optional(),
  q: z.string().trim().max(100).optional(),
});
export type PolicyListQuery = z.infer<typeof PolicyListQuery>;

export const PolicySummary = z.object({
  id: z.string(),
  number: z.string(),
  holderClientId: z.string(),
  holderName: z.string(),
  holderPhone: z.string().nullable(),
  province: z.string(),
  productId: z.string(),
  productName: z.string(),
  startDate: IsoDate,
  paidTo: IsoDate,
  standing: PolicyStanding,
  paymentMethod: PaymentMethod,
  schemeName: z.string().nullable(),
  agentName: z.string().nullable(),
  monthlyPremiumMinor: Minor,
  dependantCount: z.number().int(),
  kycComplete: z.boolean(),
});
export type PolicySummary = z.infer<typeof PolicySummary>;

export const PolicyDependant = z.object({
  id: z.string(),
  fullName: z.string(),
  relationship: z.string(),
  /** Masked unless the viewer may see full identifiers (BR-15). */
  nationalId: z.string().nullable(),
  addedOn: IsoDate,
  removedOn: IsoDate.nullable(),
});
export type PolicyDependant = z.infer<typeof PolicyDependant>;

export const PolicyPayment = z.object({
  id: z.string(),
  receivedOn: IsoDate,
  amountMinor: Minor,
  monthsCovered: z.number().int(),
  method: z.string(),
  reference: z.string().nullable(),
  recordedBy: z.string(),
  /** The part of an overpayment held as credit (BD-12 proposed default). */
  creditMinor: Minor,
});
export type PolicyPayment = z.infer<typeof PolicyPayment>;

export const ENDORSEMENT_KINDS = [
  { code: 'cover_changed', label: 'Cover changed' },
  { code: 'dependant_added', label: 'Family member added' },
  { code: 'dependant_removed', label: 'Family member removed' },
  { code: 'payment_details_changed', label: 'Payment details changed' },
  { code: 'payment_plan_agreed', label: 'Payment plan agreed' },
  { code: 'holder_details_changed', label: 'Holder details changed' },
  { code: 'reinstated', label: 'Policy reinstated' },
  { code: 'cancelled', label: 'Policy cancelled' },
  { code: 'renewed', label: 'Policy renewed' },
  { code: 'not_renewing', label: 'Not renewing' },
] as const;

export const Endorsement = z.object({
  id: z.string(),
  number: z.string(),
  kind: z.string(),
  effectiveOn: IsoDate,
  detail: z.string(),
  premiumBeforeMinor: Minor,
  premiumAfterMinor: Minor,
  createdBy: z.string(),
  createdAt: z.number(),
});
export type Endorsement = z.infer<typeof Endorsement>;

export const PaymentPlan = z.object({
  id: z.string(),
  months: z.number().int(),
  instalmentMinor: Minor,
  startsOn: IsoDate,
  endsOn: IsoDate,
  broken: z.boolean(),
});
export type PaymentPlan = z.infer<typeof PaymentPlan>;

export const KycStatus = z.object({
  idSeen: z.boolean(),
  addressSeen: z.boolean(),
  isPep: z.boolean(),
  screeningResult: z.enum(['not_screened', 'clear', 'possible_match', 'confirmed_match']),
  updatedAt: z.number().nullable(),
  /** BR-40: both documents seen. */
  complete: z.boolean(),
});
export type KycStatus = z.infer<typeof KycStatus>;

export const PolicyDetail = PolicySummary.extend({
  version: z.number().int(),
  clientId: z.string(),
  holderNationalId: z.string().nullable(),
  waitingFrom: IsoDate,
  collectionDay: z.number().int().nullable(),
  annualLimitMinor: Minor,
  perMatterLimitMinor: Minor,
  excessMinor: Minor,
  waitingPct: z.number().int(),
  coversDependants: z.boolean(),
  exclusions: z.array(z.object({ matterType: z.string(), description: z.string() })),
  usedMinor: Minor,
  remainingMinor: Minor,
  creditMinor: Minor,
  /** Months owed up to now when the policy is behind. */
  monthsBehind: z.number().int(),
  dependants: z.array(PolicyDependant),
  payments: z.array(PolicyPayment),
  endorsements: z.array(Endorsement),
  plan: PaymentPlan.nullable(),
  kyc: KycStatus,
  cancelledOn: IsoDate.nullable(),
  cancelReason: z.string().nullable(),
  actions: z.record(z.string(), ActionState),
});
export type PolicyDetail = z.infer<typeof PolicyDetail>;

export const PolicyHolderInput = z.strictObject({
  fullName: z.string().trim().min(2, 'Enter the name').max(200),
  nationalId: NationalId,
  phone: Phone,
  province: Province,
});

export const DependantInput = z.strictObject({
  fullName: z.string().trim().min(2, 'Enter the name').max(200),
  relationship: z.string().trim().min(2, 'Say how they are related').max(40),
  nationalId: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    NationalId.optional(),
  ) as unknown as z.ZodOptional<typeof NationalId>,
});
export type DependantInput = z.infer<typeof DependantInput>;

export const PolicyCreate = z.strictObject({
  holder: PolicyHolderInput,
  productId: z.string().min(1, 'Choose a product'),
  startDate: IsoDate,
  paymentMethod: PaymentMethod,
  schemeId: z.string().optional(),
  agentId: z.string().optional(),
  dependants: z.array(DependantInput).max(8).default([]),
});
export type PolicyCreate = z.infer<typeof PolicyCreate>;
export type PolicyCreateInput = z.input<typeof PolicyCreate>;

/* ------------------------------------------------------------------------------------------
 * Cover check (BR-31, BR-32)
 * ---------------------------------------------------------------------------------------- */

export const COVER_REASON_CODES = [
  'LAPSED',
  'CANCELLED',
  'NOT_STARTED',
  'NOT_COVERED_TYPE',
  'WAITING_PERIOD',
  'DEPENDANTS_NOT_COVERED',
  'ANNUAL_LIMIT_USED',
  'POLICY_EXCLUSION',
  'PREVIOUS_CLAIM_DECLINED',
] as const;
export const COVER_WARNING_CODES = [
  'GRACE_PERIOD',
  'LIMIT_LOW',
  'EXCESS_APPLIES',
  'PAYMENT_PLAN',
] as const;

export const CoverCheck = z.object({
  ok: z.boolean(),
  reasons: z.array(z.object({ code: z.enum(COVER_REASON_CODES), message: z.string() })),
  warnings: z.array(z.object({ code: z.enum(COVER_WARNING_CODES), message: z.string() })),
  person: z.object({ name: z.string(), relationship: z.string() }),
  usedMinor: Minor,
  remainingMinor: Minor,
  maxThisMatterMinor: Minor,
  coverStartsOn: IsoDate.optional(),
});
export type CoverCheck = z.infer<typeof CoverCheck>;

export const CoverCheckRequest = z.strictObject({
  /** A dependant's id; the policyholder when absent. */
  personId: z.string().optional(),
  matterType: MatterType,
  onDate: IsoDate.optional(),
});
export type CoverCheckRequest = z.infer<typeof CoverCheckRequest>;

/** The result with the policy it was run against, shown in the cover panel on a case. */
export const CasePolicyCover = z.object({
  policy: PolicySummary.nullable(),
  check: CoverCheck.nullable(),
  /** How the policy was found: the holder or a family member's national ID, or a number given at intake. */
  linkedBy: z.enum(['id', 'number']).nullable(),
  claimId: z.string().nullable(),
});
export type CasePolicyCover = z.infer<typeof CasePolicyCover>;

export const LinkPolicy = z.strictObject({
  policyNumber: z.string().regex(/^BF-POL-\d{5,}$/, 'Use the format BF-POL-01027'),
});
export type LinkPolicy = z.infer<typeof LinkPolicy>;

/* ------------------------------------------------------------------------------------------
 * Premiums (BR-33)
 * ---------------------------------------------------------------------------------------- */

export const RecordPremium = z
  .strictObject({
    amountMinor: z.number().int().min(1, 'Enter the amount received').max(100_000_000_00),
    method: z.enum(PREMIUM_METHODS.map((m) => m.code) as [string, ...string[]], {
      error: 'Choose how it was paid',
    }),
    reference: z.preprocess(
      (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
      z.string().trim().min(3, 'Add the payment reference').max(64).optional(),
    ) as unknown as z.ZodOptional<z.ZodString>,
    receivedOn: IsoDate,
  })
  .refine((p) => p.method === 'cash' || Boolean(p.reference), {
    message: 'Add the EcoCash, OneMoney or bank reference.',
    path: ['reference'],
  });
export type RecordPremium = z.infer<typeof RecordPremium>;
export type RecordPremiumInput = z.input<typeof RecordPremium>;

export const PremiumResult = z.object({
  payment: PolicyPayment,
  policy: PolicyDetail,
  reinstated: z.boolean(),
});
export type PremiumResult = z.infer<typeof PremiumResult>;

export const SchemePayment = z.strictObject({
  amountMinor: z.number().int().min(1).max(100_000_000_00),
  reference: z.string().trim().min(3, 'Add the payment reference').max(64),
  receivedOn: IsoDate,
});
export type SchemePayment = z.infer<typeof SchemePayment>;

export const PremiumListQuery = z.strictObject({
  ...PageQuery,
  /** Policies that owe premium now, or the payments received. */
  view: z.enum(['due', 'received']).default('due'),
  q: z.string().trim().max(100).optional(),
});
export type PremiumListQuery = z.infer<typeof PremiumListQuery>;

export const PremiumDue = z.object({
  policyId: z.string(),
  number: z.string(),
  holderName: z.string(),
  holderPhone: z.string().nullable(),
  standing: PolicyStanding,
  paidTo: IsoDate,
  monthsBehind: z.number().int(),
  owedMinor: Minor,
});
export type PremiumDue = z.infer<typeof PremiumDue>;

export const PremiumReceived = PolicyPayment.extend({
  policyId: z.string(),
  number: z.string(),
  holderName: z.string(),
});
export type PremiumReceived = z.infer<typeof PremiumReceived>;

export const PremiumTotals = z.object({
  dueCount: z.number().int(),
  owedMinor: Minor,
  receivedThisMonthMinor: Minor,
});
export type PremiumTotals = z.infer<typeof PremiumTotals>;

export const PremiumsPage = z.object({
  view: z.enum(['due', 'received']),
  totals: PremiumTotals,
  due: z.array(PremiumDue),
  received: z.array(PremiumReceived),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
});
export type PremiumsPage = z.infer<typeof PremiumsPage>;

/* ------------------------------------------------------------------------------------------
 * Endorsements, payment plans and member checks (BR-37, BR-40)
 * ---------------------------------------------------------------------------------------- */

export const WAITING_PERCENTAGES = [25, 50, 75, 100] as const;

export const EndorsementCreate = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('change_cover'),
    annualLimitMinor: Minor.min(50_000, 'The annual limit must be at least $500'),
    perMatterLimitMinor: Minor.min(10_000),
    excessMinor: Minor.max(200_00),
    waitingPct: z.union(WAITING_PERCENTAGES.map((p) => z.literal(p)) as never) as z.ZodType<number>,
    reason: Reason,
  }),
  z.strictObject({ kind: z.literal('add_dependant'), dependant: DependantInput, reason: Reason }),
  z.strictObject({
    kind: z.literal('remove_dependant'),
    dependantId: z.string().min(1),
    reason: Reason,
  }),
  z.strictObject({
    kind: z.literal('payment_details'),
    paymentMethod: PaymentMethod,
    collectionDay: z.number().int().min(1).max(28).optional(),
    reason: Reason,
  }),
  z.strictObject({
    kind: z.literal('holder_details'),
    phone: Phone.optional(),
    province: Province.optional(),
    reason: Reason,
  }),
]);
export type EndorsementCreate = z.infer<typeof EndorsementCreate>;
export type EndorsementCreateInput = z.input<typeof EndorsementCreate>;

export const PaymentPlanCreate = z.strictObject({
  months: z.number().int().min(1).max(6),
});
export type PaymentPlanCreate = z.infer<typeof PaymentPlanCreate>;

export const KycUpdate = z.strictObject({
  idSeen: z.boolean().optional(),
  addressSeen: z.boolean().optional(),
  isPep: z.boolean().optional(),
});
export type KycUpdate = z.infer<typeof KycUpdate>;

export const KycListQuery = z.strictObject({
  ...PageQuery,
  filter: z.enum(['missing', 'all']).default('missing'),
});
export type KycListQuery = z.infer<typeof KycListQuery>;

export const KycRow = z.object({
  policyId: z.string(),
  number: z.string(),
  holderName: z.string(),
  standing: PolicyStanding,
  kyc: KycStatus,
});
export type KycRow = z.infer<typeof KycRow>;

export const EndorsementListQuery = z.strictObject({ ...PageQuery });
export type EndorsementListQuery = z.infer<typeof EndorsementListQuery>;

export const EndorsementRow = Endorsement.extend({
  policyId: z.string(),
  policyNumber: z.string(),
  holderName: z.string(),
});
export type EndorsementRow = z.infer<typeof EndorsementRow>;
