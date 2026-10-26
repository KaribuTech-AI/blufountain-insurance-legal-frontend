import { z } from 'zod';
import { IsoDate, Phone } from './fields.js';

/* ------------------------------------------------------------------------------------------
 * Public channels (Phase 10): the client portal and the member app. Everything here is
 * returned to people who are not staff, so each shape carries only what they may see.
 * ---------------------------------------------------------------------------------------- */

export const PUBLIC_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'sn', label: 'chiShona' },
  { code: 'nd', label: 'isiNdebele' },
] as const;
export const PublicLanguage = z.enum(['en', 'sn', 'nd']);
export type PublicLanguage = z.infer<typeof PublicLanguage>;

/* ------------------------------------------------------------------------ bot check */

export const Challenge = z.object({
  /** Send this back with the next request. It only works after a short wait. */
  token: z.string(),
  /** Seconds the page must wait before the token is accepted. */
  waitSeconds: z.number(),
});
export type Challenge = z.infer<typeof Challenge>;

/* ------------------------------------------------------------- one-time codes, sessions */

export const OtpRequest = z.strictObject({
  purpose: z.enum(['case', 'member'], { error: 'Choose what you want to do' }),
  /** The case number (LA-2026-0372) or the policy number (BF-POL-01033). */
  reference: z.string().trim().min(5, 'Enter your reference number').max(40),
  phone: Phone,
  challenge: z.string().min(10).max(200),
  /** A hidden field real people never fill in. */
  website: z.string().max(0).optional(),
});
export type OtpRequest = z.infer<typeof OtpRequest>;

export const OtpSent = z.object({
  /** The same answer whether or not the details matched, so nobody can probe for clients. */
  message: z.string(),
  expiresInSeconds: z.number(),
  /** Only in the sandbox, where no SMS is really sent. Never present in production. */
  sandboxCode: z.string().optional(),
});
export type OtpSent = z.infer<typeof OtpSent>;

export const OtpVerify = z.strictObject({
  purpose: z.enum(['case', 'member']),
  reference: z.string().trim().min(5).max(40),
  phone: Phone,
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter the 6 digit code'),
});
export type OtpVerify = z.infer<typeof OtpVerify>;

export const PublicSession = z.object({
  /** Kept in memory by the page and sent as `Authorization: Bearer`. Never stored. */
  token: z.string(),
  kind: z.enum(['case', 'member']),
  expiresInSeconds: z.number(),
});
export type PublicSession = z.infer<typeof PublicSession>;

/* ------------------------------------------------------------------------ client portal */

export const PortalCase = z.object({
  reference: z.string(),
  /** Plain words, not the internal stage. */
  stage: z.string(),
  stageCode: z.string(),
  nextCourtDate: IsoDate.nullable(),
  lawyerName: z.string().nullable(),
});
export type PortalCase = z.infer<typeof PortalCase>;

export const CallbackRequest = z.strictObject({
  message: z.string().trim().max(500).optional(),
  preferredTime: z.enum(['morning', 'afternoon', 'any']).default('any'),
});
export type CallbackRequest = z.infer<typeof CallbackRequest>;

export const PortalApplication = z.strictObject({
  fullName: z.string().trim().min(2, 'Enter your name').max(120),
  phone: Phone,
  matterType: z.string().trim().min(2, 'Choose what you need help with').max(40),
  summary: z.string().trim().min(10, 'Tell us a little about the problem').max(1000),
  language: PublicLanguage.default('en'),
  province: z.string().trim().max(40).optional(),
  challenge: z.string().min(10).max(200),
  website: z.string().max(0).optional(),
});
export type PortalApplication = z.infer<typeof PortalApplication>;

export const PublicAck = z.object({
  /** What to tell the person: we received it, and when to expect a call. */
  message: z.string(),
  reference: z.string(),
});
export type PublicAck = z.infer<typeof PublicAck>;

/* ------------------------------------------------------------------------ member app */

export const MemberPolicy = z.object({
  number: z.string(),
  holderFirstName: z.string(),
  product: z.string(),
  standing: z.enum(['active', 'grace_period', 'lapsed', 'cancelled', 'not_started']),
  /** One sentence in plain words about where the policy stands. */
  standingText: z.string(),
  paidTo: IsoDate,
  monthlyPremiumMinor: z.number().int(),
  monthsBehind: z.number().int(),
  amountToCatchUpMinor: z.number().int(),
  annualLimitMinor: z.number().int(),
  usedMinor: z.number().int(),
  remainingMinor: z.number().int(),
  dependants: z.number().int(),
  /** When each kind of matter becomes covered (waiting periods). */
  coveredFrom: z.array(z.object({ matterType: z.string(), from: IsoDate, covered: z.boolean() })),
});
export type MemberPolicy = z.infer<typeof MemberPolicy>;

export const MobileMoneyPayment = z.strictObject({
  method: z.enum(['ecocash', 'onemoney'], { error: 'Choose EcoCash or OneMoney' }),
  /** Whole months, 1 to 12. */
  months: z.number().int().min(1, 'Choose how many months').max(12),
  /** The wallet to charge. It may differ from the sign in number. */
  walletPhone: Phone,
});
export type MobileMoneyPayment = z.infer<typeof MobileMoneyPayment>;

export const PaymentAttempt = z.object({
  id: z.string(),
  status: z.enum(['pending', 'confirmed', 'failed', 'needs_review']),
  statusText: z.string(),
  amountMinor: z.number().int(),
  months: z.number().int(),
  method: z.string(),
  createdAt: z.string(),
});
export type PaymentAttempt = z.infer<typeof PaymentAttempt>;

/** What the mobile money provider posts when a payment settles. */
export const MobileMoneyCallback = z.strictObject({
  providerRef: z.string().min(4).max(80),
  status: z.enum(['success', 'failed']),
  amountMinor: z.number().int().min(0).max(100_000_000_00),
});
export type MobileMoneyCallback = z.infer<typeof MobileMoneyCallback>;

export const MemberRequest = z.strictObject({
  kind: z.enum(['claim', 'legal_aid'], { error: 'Choose what you are asking for' }),
  matterType: z.string().trim().min(2, 'Choose the kind of problem').max(40),
  summary: z.string().trim().min(10, 'Tell us a little about the problem').max(1000),
  forPerson: z.string().trim().max(120).optional(),
});
export type MemberRequest = z.infer<typeof MemberRequest>;

export const MemberClaim = z.object({
  number: z.string(),
  /** In plain words (REQ-100). */
  statusText: z.string(),
  status: z.string(),
  registeredOn: IsoDate,
});
export type MemberClaim = z.infer<typeof MemberClaim>;

/* ----------------------------------------------------------------- staff: call-backs */

export const Callback = z.object({
  id: z.string(),
  kind: z.enum(['callback', 'apply', 'claim', 'legal_aid']),
  name: z.string(),
  phone: z.string(),
  reference: z.string().nullable(),
  matterType: z.string().nullable(),
  summary: z.string().nullable(),
  preferredTime: z.string().nullable(),
  language: z.string(),
  receivedAt: z.string(),
  status: z.enum(['open', 'done']),
  doneByName: z.string().nullable(),
  note: z.string().nullable(),
  version: z.number(),
});
export type Callback = z.infer<typeof Callback>;

export const CallbackDone = z.strictObject({
  note: z.string().trim().min(3, 'Write what was agreed').max(1000),
});
export type CallbackDone = z.infer<typeof CallbackDone>;

export const CallbacksOverview = z.object({
  items: z.array(Callback),
  openCount: z.number(),
});
export type CallbacksOverview = z.infer<typeof CallbacksOverview>;
