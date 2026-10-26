import { z } from 'zod';
import { IsoDate, NationalId, Phone, Reason } from './fields.js';
import { ActionState, MatterType, PageQuery, Province } from './legal.js';
import {
  DependantInput,
  PaymentMethod,
  PolicyDetail,
  PolicyStanding,
  WAITING_PERCENTAGES,
} from './cover.js';

/* ------------------------------------------------------------------------------------------
 * Sales, renewals and collections (Phase 6; BR-35 to BR-39, BR-46, BR-47)
 * ---------------------------------------------------------------------------------------- */

const Minor = z.number().int().min(0).max(100_000_000_00);

/* ------------------------------------------------------------------------------- agents */

export const AGENT_KINDS = [
  { code: 'direct', label: 'Direct sale' },
  { code: 'agent', label: 'Agent' },
  { code: 'broker', label: 'Broker' },
] as const;

export const Agent = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(['direct', 'agent', 'broker']),
  licenceNo: z.string().nullable(),
  phone: z.string().nullable(),
  active: z.boolean(),
  policyCount: z.number().int(),
});
export type Agent = z.infer<typeof Agent>;

export const AgentCreate = z
  .strictObject({
    name: z.string().trim().min(2, 'Enter the name').max(120),
    kind: z.enum(['agent', 'broker']),
    licenceNo: z.preprocess(
      (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
      z.string().trim().min(3).max(40).optional(),
    ) as unknown as z.ZodOptional<z.ZodString>,
    phone: Phone.optional(),
  })
  // Brokers are licensed; the number is on the commission statement.
  .refine((a) => a.kind !== 'broker' || Boolean(a.licenceNo), {
    message: 'Enter the broker’s licence number.',
    path: ['licenceNo'],
  });
export type AgentCreate = z.infer<typeof AgentCreate>;
export type AgentCreateInput = z.input<typeof AgentCreate>;

export const CommissionStatement = z.object({
  id: z.string(),
  agentId: z.string(),
  agentName: z.string(),
  month: z.string(),
  paymentCount: z.number().int(),
  premiumsMinor: Minor,
  commissionMinor: Minor,
  status: z.enum(['accrued', 'paid']),
  paidOn: IsoDate.nullable(),
  actions: z.record(z.string(), ActionState),
});
export type CommissionStatement = z.infer<typeof CommissionStatement>;

export const CommissionQuery = z.strictObject({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'Use the format YYYY-MM')
    .optional(),
});
export type CommissionQuery = z.infer<typeof CommissionQuery>;

export const AgentsOverview = z.object({
  agents: z.array(Agent),
  month: z.string(),
  statements: z.array(CommissionStatement),
});
export type AgentsOverview = z.infer<typeof AgentsOverview>;

/* ------------------------------------------------------------------------------- quotes */

export const QuoteOptions = z
  .object({
    productId: z.string().min(1, 'Choose a product'),
    annualLimitMinor: z
      .number()
      .int()
      .min(500_00, 'At least $500')
      .max(10_000_00, 'At most $10,000')
      .refine((v) => v % 250_00 === 0, 'In steps of $250'),
    perMatterLimitMinor: z.number().int().min(100_00),
    dependants: z.number().int().min(0).max(8),
    holderAge: z
      .number()
      .int()
      .min(18, 'The holder must be 18 or over')
      .max(75, 'The oldest age we cover is 75'),
    excessMinor: z
      .number()
      .int()
      .min(0)
      .max(200_00)
      .refine((v) => v % 10_00 === 0, 'In steps of $10'),
    waitingPct: z.union(WAITING_PERCENTAGES.map((p) => z.literal(p)) as never) as z.ZodType<number>,
    frequency: z.enum(['monthly', 'annual']).default('monthly'),
    schemeId: z.string().optional(),
  })
  .refine((o) => o.perMatterLimitMinor <= o.annualLimitMinor, {
    message: 'The limit for one matter cannot be more than the annual limit.',
    path: ['perMatterLimitMinor'],
  });
export type QuoteOptions = z.infer<typeof QuoteOptions>;
export type QuoteOptionsInput = z.input<typeof QuoteOptions>;

export const QuotePrice = z.object({
  lines: z.array(z.object({ code: z.string(), label: z.string(), amountMinor: z.number().int() })),
  monthlyMinor: Minor,
  annualMinor: Minor,
});
export type QuotePrice = z.infer<typeof QuotePrice>;

export const QuoteCreate = QuoteOptions.and(
  z.object({
    prospectName: z.string().trim().min(2, 'Enter the name').max(120),
    prospectPhone: Phone.optional(),
    agentId: z.string().optional(),
  }),
);
export type QuoteCreate = z.infer<typeof QuoteCreate>;
export type QuoteCreateInput = z.input<typeof QuoteCreate>;

export const Quote = z.object({
  id: z.string(),
  number: z.string(),
  prospectName: z.string(),
  prospectPhone: z.string().nullable(),
  productId: z.string(),
  productName: z.string(),
  options: z.object({
    annualLimitMinor: Minor,
    perMatterLimitMinor: Minor,
    dependants: z.number().int(),
    holderAge: z.number().int(),
    excessMinor: Minor,
    waitingPct: z.number().int(),
    frequency: z.enum(['monthly', 'annual']),
    schemeId: z.string().nullable(),
  }),
  price: QuotePrice,
  createdOn: IsoDate,
  validUntil: IsoDate,
  status: z.enum(['sent', 'accepted', 'expired', 'withdrawn']),
  agentName: z.string().nullable(),
  createdByName: z.string(),
  applicationId: z.string().nullable(),
  actions: z.record(z.string(), ActionState),
});
export type Quote = z.infer<typeof Quote>;

export const QuoteListQuery = z.strictObject({
  ...PageQuery,
  status: z.enum(['sent', 'accepted', 'expired', 'withdrawn']).optional(),
  agentId: z.string().optional(),
  q: z.string().trim().max(100).optional(),
});
export type QuoteListQuery = z.infer<typeof QuoteListQuery>;

/* ------------------------------------------------------------------------------- applications */

export const DECLARATIONS = [
  { key: 'existingProblem', label: 'Do you already have a legal problem you may want help with?' },
  { key: 'courtLast12Months', label: 'Have you been to court in the last 12 months?' },
  { key: 'employerDispute', label: 'Do you have a dispute with your employer now?' },
] as const;

export const ApplicationCreate = z.strictObject({
  holder: z.strictObject({
    fullName: z.string().trim().min(2, 'Enter the name').max(200),
    nationalId: NationalId,
    phone: Phone,
    province: Province,
  }),
  dependants: z.array(DependantInput).max(8).default([]),
  startDate: IsoDate,
  paymentMethod: PaymentMethod.default('ecocash'),
  declarations: z.strictObject({
    existingProblem: z.boolean({ error: 'Answer this question' }),
    courtLast12Months: z.boolean({ error: 'Answer this question' }),
    employerDispute: z.boolean({ error: 'Answer this question' }),
  }),
  notes: z.string().trim().max(1000).optional(),
});
export type ApplicationCreate = z.infer<typeof ApplicationCreate>;
export type ApplicationCreateInput = z.input<typeof ApplicationCreate>;

export const APPLICATION_STATUSES = [
  { code: 'pending', label: 'Waiting for a decision' },
  { code: 'accepted', label: 'Accepted' },
  { code: 'accepted_with_exclusion', label: 'Accepted with an exclusion' },
  { code: 'declined', label: 'Declined' },
] as const;

export const Application = z.object({
  id: z.string(),
  number: z.string(),
  quoteId: z.string(),
  quoteNumber: z.string(),
  productName: z.string(),
  holderName: z.string(),
  holderNationalId: z.string().nullable(),
  holderPhone: z.string(),
  province: z.string(),
  monthlyPremiumMinor: Minor,
  startDate: IsoDate,
  dependants: z.array(z.object({ fullName: z.string(), relationship: z.string() })),
  declarations: z.object({
    existingProblem: z.boolean(),
    courtLast12Months: z.boolean(),
    employerDispute: z.boolean(),
  }),
  needsReview: z.boolean(),
  notes: z.string().nullable(),
  status: z.enum(APPLICATION_STATUSES.map((s) => s.code) as [string, ...string[]]),
  takenOn: IsoDate,
  takenByName: z.string(),
  decidedByName: z.string().nullable(),
  decidedOn: IsoDate.nullable(),
  exclusion: z.object({ matterType: z.string(), description: z.string() }).nullable(),
  declineReason: z.string().nullable(),
  policyId: z.string().nullable(),
  policyNumber: z.string().nullable(),
  actions: z.record(z.string(), ActionState),
});
export type Application = z.infer<typeof Application>;

export const ApplicationListQuery = z.strictObject({
  ...PageQuery,
  status: z.enum(APPLICATION_STATUSES.map((s) => s.code) as [string, ...string[]]).optional(),
});
export type ApplicationListQuery = z.infer<typeof ApplicationListQuery>;

export const ApplicationDecision = z.discriminatedUnion('decision', [
  z.strictObject({ decision: z.literal('accept') }),
  z.strictObject({
    decision: z.literal('accept_with_exclusion'),
    exclusion: z.strictObject({
      matterType: MatterType,
      description: z.string().trim().min(5, 'Say what is excluded').max(300),
    }),
  }),
  z.strictObject({ decision: z.literal('decline'), reason: Reason }),
]);
export type ApplicationDecision = z.infer<typeof ApplicationDecision>;

export const ApplicationResult = z.object({
  application: Application,
  policy: PolicyDetail.nullable(),
});
export type ApplicationResult = z.infer<typeof ApplicationResult>;

/* ------------------------------------------------------------------------------- cancellation and refunds */

export const CANCELLATION_REASON_LABELS = [
  { id: 'non_payment', label: 'Non-payment of premium' },
  { id: 'member_request', label: 'Member asked to cancel' },
  { id: 'moved_away', label: 'Member moved away' },
  { id: 'deceased', label: 'Policyholder has died' },
  { id: 'other', label: 'Other reason' },
] as const;

export const CancellationRequest = z.strictObject({
  reason: z.enum(['non_payment', 'member_request', 'moved_away', 'deceased', 'other'], {
    error: 'Choose the reason',
  }),
  /** The cancellation takes effect after this many days (0 to 60). */
  endsInDays: z.number().int().min(0).max(60),
  note: z.string().trim().max(500).optional(),
});
export type CancellationRequest = z.infer<typeof CancellationRequest>;

export const CancellationQuote = z.object({
  endsOn: IsoDate,
  refundMinor: Minor,
  basis: z.enum(['non_payment', 'cooling_off', 'pro_rata']),
  coolingOff: z.boolean(),
});
export type CancellationQuote = z.infer<typeof CancellationQuote>;

export const Refund = z.object({
  id: z.string(),
  policyId: z.string(),
  policyNumber: z.string(),
  holderName: z.string(),
  amountMinor: Minor,
  basis: z.enum(['non_payment', 'cooling_off', 'pro_rata']),
  status: z.enum(['to_pay', 'paid']),
  cancelledByName: z.string(),
  createdOn: IsoDate,
  paidOn: IsoDate.nullable(),
  actions: z.record(z.string(), ActionState),
});
export type Refund = z.infer<typeof Refund>;

export const RefundListQuery = z.strictObject({
  ...PageQuery,
  status: z.enum(['to_pay', 'paid']).optional(),
});
export type RefundListQuery = z.infer<typeof RefundListQuery>;

export const CancellationResult = z.object({
  policy: PolicyDetail,
  refund: Refund.nullable(),
});
export type CancellationResult = z.infer<typeof CancellationResult>;

/* ------------------------------------------------------------------------------- renewals */

export const RenewalListQuery = z.strictObject({
  window: z.enum(['60d', '12m']).default('60d'),
});
export type RenewalListQuery = z.infer<typeof RenewalListQuery>;

export const RenewalRow = z.object({
  policyId: z.string(),
  number: z.string(),
  holderName: z.string(),
  standing: PolicyStanding,
  anniversary: IsoDate,
  currentPremiumMinor: Minor,
  newPremiumMinor: Minor,
  claimsThisYear: z.number().int(),
  status: z.enum(['due', 'notice_sent', 'renewed', 'not_renewing']),
  noticeSentOn: IsoDate.nullable(),
  /** The notice should have gone at least 30 days before the anniversary (BR-39). */
  noticeOverdue: z.boolean(),
  reason: z.string().nullable(),
  actions: z.record(z.string(), ActionState),
});
export type RenewalRow = z.infer<typeof RenewalRow>;

export const RenewalDecision = z
  .strictObject({
    renew: z.boolean(),
    reason: Reason.optional(),
  })
  .refine((d) => d.renew || Boolean(d.reason), {
    message: 'Say why the policy is not being renewed.',
    path: ['reason'],
  });
export type RenewalDecision = z.infer<typeof RenewalDecision>;

/* ------------------------------------------------------------------------------- debit orders */

export const DebitOrderCreate = z.strictObject({
  periodMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Use the format YYYY-MM'),
});
export type DebitOrderCreate = z.infer<typeof DebitOrderCreate>;

export const DebitOrderItem = z.object({
  id: z.string(),
  policyId: z.string(),
  policyNumber: z.string(),
  holderName: z.string(),
  amountMinor: Minor,
  status: z.enum(['pending', 'collected', 'bounced']),
  reason: z.string().nullable(),
});
export type DebitOrderItem = z.infer<typeof DebitOrderItem>;

export const DebitOrderBatch = z.object({
  id: z.string(),
  number: z.string(),
  periodMonth: z.string(),
  status: z.enum(['draft', 'submitted', 'completed']),
  totalMinor: Minor,
  collectedMinor: Minor,
  bouncedCount: z.number().int(),
  items: z.array(DebitOrderItem),
  actions: z.record(z.string(), ActionState),
});
export type DebitOrderBatch = z.infer<typeof DebitOrderBatch>;

export const DebitOrderResults = z.strictObject({
  items: z
    .array(
      z.strictObject({
        itemId: z.string(),
        outcome: z.enum(['collected', 'bounced']),
        reason: z.string().trim().min(3).max(200).optional(),
      }),
    )
    .min(1)
    .max(500),
});
export type DebitOrderResults = z.infer<typeof DebitOrderResults>;

export const DebitOrderFile = z.object({ filename: z.string(), content: z.string() });
export type DebitOrderFile = z.infer<typeof DebitOrderFile>;

/* ------------------------------------------------------------------------------- product designer */

export const ProductUpdate = z
  .strictObject({
    monthlyPremiumMinor: z.number().int().min(100, 'At least $1').max(1_000_00),
    annualLimitMinor: z.number().int().min(100_00).max(50_000_00),
    perMatterLimitMinor: z.number().int().min(100_00).max(50_000_00),
    coversDependants: z.boolean(),
    coverages: z
      .array(
        z.strictObject({
          matterType: MatterType,
          waitingDays: z.number().int().min(0).max(730),
        }),
      )
      .min(1, 'A product must cover at least one type of matter'),
    exclusionsText: z.string().trim().min(3).max(1000),
    effectiveFrom: IsoDate,
    reason: Reason,
  })
  .refine((p) => p.perMatterLimitMinor <= p.annualLimitMinor, {
    message: 'The limit for one matter cannot be more than the annual limit.',
    path: ['perMatterLimitMinor'],
  });
export type ProductUpdate = z.infer<typeof ProductUpdate>;
export type ProductUpdateInput = z.input<typeof ProductUpdate>;

export const ProductImpactRequest = ProductUpdate;

export const ProductImpact = z.object({
  policiesOnProduct: z.number().int(),
  /** Policies that follow the product at renewal; policies keep the terms they were sold on. */
  newBusinessMonthlyMinor: Minor,
  currentMonthlyMinor: Minor,
  changes: z.array(z.string()),
});
export type ProductImpact = z.infer<typeof ProductImpact>;

export const ProductChange = z.object({
  id: z.string(),
  effectiveFrom: IsoDate,
  reason: z.string(),
  changedByName: z.string(),
  summary: z.string(),
});
export type ProductChange = z.infer<typeof ProductChange>;
