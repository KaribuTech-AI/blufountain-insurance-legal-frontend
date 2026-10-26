import { z } from 'zod';
import { IsoDate } from './fields.js';
import { PaymentAttempt } from './public.js';

/* ------------------------------------------------------------------------------------------
 * What a signed-in member sees (docs/member-portal-design.md sections 5 and 7). These are
 * allow-lists: the server builds each one field by field, so nothing that staff add to a
 * record later reaches a member unless it is added here on purpose.
 *
 * Words are not sent. The server sends codes and values, and the portal says them in the
 * member's language.
 * ---------------------------------------------------------------------------------------- */

const Tone = z.enum(['bad', 'warn', 'ok']);
const Params = z.record(z.string(), z.union([z.string(), z.number()]));

/** Where a button on an item leads inside the member area. */
export const MemberTarget = z.enum(['payments', 'cover', 'case', 'claim', 'claims']);
export type MemberTarget = z.infer<typeof MemberTarget>;

const Link = z.object({ to: MemberTarget, id: z.string().optional() });

/* ----------------------------------------------------------------------------- upcoming */

export const UPCOMING_KINDS = [
  'premium_due',
  'plan_instalment',
  'renewal',
  'waiting_ends',
  'hearing',
] as const;

/** One dated thing the member should know about. */
export const UpcomingItem = z.object({
  /** Stable: kind, source and date. */
  id: z.string(),
  kind: z.enum(UPCOMING_KINDS),
  date: IsoDate,
  time: z.string().optional(),
  tone: Tone,
  /** Values for the sentence: policy number, amount in minor units, matter type, court. */
  params: Params,
  link: Link.optional(),
});
export type UpcomingItem = z.infer<typeof UpcomingItem>;

export const ATTENTION_KINDS = ['pay_overdue', 'pay_soon', 'claim_open'] as const;

export const AttentionItem = z.object({
  id: z.string(),
  kind: z.enum(ATTENTION_KINDS),
  tone: Tone,
  params: Params,
  link: Link,
});
export type AttentionItem = z.infer<typeof AttentionItem>;

export const ActivityItem = z.object({
  id: z.string(),
  kind: z.enum(['payment_received', 'claim_registered', 'case_opened']),
  date: IsoDate,
  params: Params,
  link: Link.optional(),
});
export type ActivityItem = z.infer<typeof ActivityItem>;

/* ----------------------------------------------------------------------------- policies */

export const MEMBER_STANDINGS = [
  'active',
  'grace_period',
  'lapsed',
  'cancelled',
  'not_started',
] as const;

export const MemberPolicyCard = z.object({
  id: z.string(),
  number: z.string(),
  product: z.string(),
  standing: z.enum(MEMBER_STANDINGS),
  paidTo: IsoDate,
  monthlyPremiumMinor: z.number().int(),
  monthsBehind: z.number().int(),
  amountToCatchUpMinor: z.number().int(),
  annualLimitMinor: z.number().int(),
  usedMinor: z.number().int(),
  remainingMinor: z.number().int(),
  dependants: z.number().int(),
  /** The next anniversary of the start date, when the policy renews. */
  renewsOn: IsoDate.nullable(),
});
export type MemberPolicyCard = z.infer<typeof MemberPolicyCard>;

export const MemberPolicyDetail = MemberPolicyCard.extend({
  startDate: IsoDate,
  excessMinor: z.number().int(),
  perMatterLimitMinor: z.number().int(),
  paymentMethod: z.string(),
  collectionDay: z.number().int().nullable(),
  /** The employer or group that collects the premium, if any. */
  scheme: z.string().nullable(),
  coveredFrom: z.array(z.object({ matterType: z.string(), from: IsoDate, covered: z.boolean() })),
  family: z.array(z.object({ name: z.string(), relationship: z.string(), since: IsoDate })),
  exclusions: z.array(z.object({ matterType: z.string(), description: z.string() })),
});
export type MemberPolicyDetail = z.infer<typeof MemberPolicyDetail>;

/* ----------------------------------------------------------------------------- payments */

export const MemberPayments = z.object({
  policyId: z.string(),
  policyNumber: z.string(),
  monthlyPremiumMinor: z.number().int(),
  paymentMethod: z.string(),
  collectionDay: z.number().int().nullable(),
  /** `pay_online` shows the pay button; the others are collected by someone else. */
  how: z.enum(['pay_online', 'debit_order', 'payroll']),
  next: z.object({ date: IsoDate, amountMinor: z.number().int() }).nullable(),
  arrears: z.object({ monthsBehind: z.number().int(), amountToCatchUpMinor: z.number().int() }),
  plan: z
    .object({
      months: z.number().int(),
      instalmentMinor: z.number().int(),
      startsOn: IsoDate,
      endsOn: IsoDate,
      broken: z.boolean(),
    })
    .nullable(),
  history: z.array(
    z.object({
      id: z.string(),
      receivedOn: IsoDate,
      amountMinor: z.number().int(),
      monthsCovered: z.number().int(),
      method: z.string(),
      reference: z.string().nullable(),
    }),
  ),
  /** Mobile money attempts that have not been paid, newest first. */
  attempts: z.array(PaymentAttempt),
  cancelled: z.boolean(),
});
export type MemberPayments = z.infer<typeof MemberPayments>;

/* ------------------------------------------------------------------------------- cases */

export const MemberCaseCard = z.object({
  id: z.string(),
  reference: z.string(),
  matterType: z.string(),
  /** The internal stage code; the portal says it in plain words. */
  stage: z.string(),
  open: z.boolean(),
  openedOn: IsoDate,
  lawyerName: z.string().nullable(),
  nextHearing: z
    .object({ date: IsoDate, time: z.string(), court: z.string().nullable() })
    .nullable(),
});
export type MemberCaseCard = z.infer<typeof MemberCaseCard>;

export const TIMELINE_KINDS = [
  'opened',
  'accepted',
  'lawyer_assigned',
  'work_started',
  'referred',
  'declined',
  'hearing',
  'closed',
] as const;

export const MemberCaseDetail = MemberCaseCard.extend({
  timeline: z.array(
    z.object({
      id: z.string(),
      kind: z.enum(TIMELINE_KINDS),
      date: IsoDate,
      params: Params,
    }),
  ),
  claims: z.array(z.object({ id: z.string(), number: z.string(), status: z.string() })),
});
export type MemberCaseDetail = z.infer<typeof MemberCaseDetail>;

/* ------------------------------------------------------------------------------ claims */

export const MemberClaimCard = z.object({
  id: z.string(),
  number: z.string(),
  /** registered, accepted, declined or closed. */
  status: z.string(),
  open: z.boolean(),
  registeredOn: IsoDate,
  policyNumber: z.string(),
  caseReference: z.string().nullable(),
  /** Who the claim is for, when it is not the policyholder. */
  forName: z.string().nullable(),
});
export type MemberClaimCard = z.infer<typeof MemberClaimCard>;

export const MemberClaimDetail = MemberClaimCard.extend({
  caseId: z.string().nullable(),
  steps: z.array(
    z.object({
      kind: z.enum(['registered', 'decided', 'closed']),
      date: IsoDate,
      outcome: z.string().optional(),
    }),
  ),
});
export type MemberClaimDetail = z.infer<typeof MemberClaimDetail>;

/* ---------------------------------------------------------------------------- overview */

export const MemberOverview = z.object({
  firstName: z.string(),
  /** How many policies there are, and how many are not in good standing. */
  policyCount: z.number().int(),
  policiesNeedingAttention: z.number().int(),
  attention: z.array(AttentionItem),
  upcoming: z.array(UpcomingItem),
  policies: z.array(MemberPolicyCard),
  cases: z.array(MemberCaseCard),
  activity: z.array(ActivityItem),
});
export type MemberOverview = z.infer<typeof MemberOverview>;
