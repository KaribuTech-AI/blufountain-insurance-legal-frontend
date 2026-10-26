import { z } from 'zod';
import { IsoDate, NationalId, Phone, Reason } from './fields.js';
import { ActionState, Language, MatterType, PageQuery, Province } from './legal.js';

/* ------------------------------------------------------------------------------------------
 * Legal aid operations (Phase 7): messages, letters, calendar, custody, advice, court work
 * ---------------------------------------------------------------------------------------- */

const Minor = z.number().int().min(0).max(100_000_000_00);
const Actions = z.record(z.string(), ActionState);
const Month = z.string().regex(/^\d{4}-\d{2}$/, 'Use the format YYYY-MM');
const Text = (min: number, max: number, message: string) =>
  z.string().trim().min(min, message).max(max);
/** Forms send "" for an empty optional field. */
const opt = <T extends z.ZodType>(schema: T) =>
  z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    schema.optional(),
  ) as unknown as z.ZodOptional<T>;

export const ListQuery = z.strictObject({ q: z.string().trim().max(100).optional(), ...PageQuery });
export type ListQuery = z.infer<typeof ListQuery>;

/* ----------------------------------------------------------------------------------- SMS */

export const SMS_STATUSES = [
  { code: 'sent', label: 'Sent' },
  { code: 'delivered', label: 'Delivered' },
  { code: 'failed', label: 'Failed' },
] as const;

export const SmsTemplateInfo = z.object({
  id: z.string(),
  label: z.string(),
  fields: z.array(z.string()),
});
export type SmsTemplateInfo = z.infer<typeof SmsTemplateInfo>;

export const Message = z.object({
  id: z.string(),
  caseId: z.string().nullable(),
  caseReference: z.string().nullable(),
  recipientName: z.string(),
  phone: z.string(),
  language: z.string(),
  template: z.string(),
  templateLabel: z.string(),
  text: z.string(),
  parts: z.number().int(),
  status: z.enum(['sent', 'delivered', 'failed']),
  error: z.string().nullable(),
  sentAt: z.string(),
  sentByName: z.string(),
  resendOf: z.string().nullable(),
  actions: Actions,
});
export type Message = z.infer<typeof Message>;

export const MessageListQuery = z.strictObject({
  status: z.enum(['sent', 'delivered', 'failed']).optional(),
  ...ListQuery.shape,
});
export type MessageListQuery = z.infer<typeof MessageListQuery>;

export const SmsSend = z.strictObject({
  template: z.string().min(1, 'Choose a template'),
  /** Fields the case does not supply, such as the documents to bring. */
  vars: z.record(z.string(), z.string().trim().max(200)).default({}),
});
export type SmsSend = z.infer<typeof SmsSend>;

export const Reminder = z.object({
  hearingId: z.string(),
  caseId: z.string(),
  caseReference: z.string(),
  clientName: z.string(),
  date: IsoDate,
  time: z.string(),
  court: z.string(),
  canSend: z.boolean(),
  /** Why no message can go: SMS off, or no phone. The client must be called instead. */
  reason: z.string().nullable(),
});
export type Reminder = z.infer<typeof Reminder>;

export const RemindersResult = z.object({
  reminders: z.array(Reminder),
  actions: Actions,
});
export type RemindersResult = z.infer<typeof RemindersResult>;

export const RemindersSent = z.object({ sent: z.number().int(), callInstead: z.number().int() });
export type RemindersSent = z.infer<typeof RemindersSent>;

/* ------------------------------------------------------------------------------ letters */

export const LetterTemplateInfo = z.object({ id: z.string(), label: z.string() });
export type LetterTemplateInfo = z.infer<typeof LetterTemplateInfo>;

export const LetterPreviewRequest = z.strictObject({
  template: z.string().min(1, 'Choose a template'),
  /** Fields the case does not supply: recipient, terms, result. */
  extra: z.record(z.string(), z.string().trim().max(2000)).default({}),
});
export type LetterPreviewRequest = z.infer<typeof LetterPreviewRequest>;

export const LetterPreview = z.object({ title: z.string(), body: z.string() });
export type LetterPreview = z.infer<typeof LetterPreview>;

export const LetterCreate = z.strictObject({
  template: z.string().min(1),
  title: Text(3, 160, 'Give the letter a title'),
  body: Text(20, 20_000, 'The letter is empty'),
});
export type LetterCreate = z.infer<typeof LetterCreate>;

export const Letter = z.object({
  id: z.string(),
  caseId: z.string(),
  caseReference: z.string(),
  template: z.string(),
  templateLabel: z.string(),
  title: z.string(),
  body: z.string(),
  createdByName: z.string(),
  createdAt: z.string(),
  actions: Actions,
});
export type Letter = z.infer<typeof Letter>;

export const LetterExport = z.object({ filename: z.string(), content: z.string() });
export type LetterExport = z.infer<typeof LetterExport>;

/* ----------------------------------------------------------------------------- calendar */

export const CalendarQuery = z.strictObject({ from: IsoDate, to: IsoDate });
export type CalendarQuery = z.infer<typeof CalendarQuery>;

export const CalendarItem = z.object({
  id: z.string(),
  kind: z.enum(['hearing', 'deadline', 'appeal', 'mediation']),
  date: IsoDate,
  time: z.string().nullable(),
  title: z.string(),
  caseId: z.string().nullable(),
  caseReference: z.string().nullable(),
  clientName: z.string().nullable(),
  court: z.string().nullable(),
  lawyerName: z.string().nullable(),
  /** SMS is off or there is no phone, so a person must call the client. */
  callClient: z.boolean(),
});
export type CalendarItem = z.infer<typeof CalendarItem>;

/* --------------------------------------------------------------------------------- roster */

export const RosterQuery = z.strictObject({ month: Month });
export type RosterQuery = z.infer<typeof RosterQuery>;

export const RosterEntry = z.object({
  id: z.string(),
  date: IsoDate,
  lawyerId: z.string(),
  lawyerName: z.string(),
  officeId: z.string(),
  note: z.string().nullable(),
  /** The lawyer is on approved leave that day. */
  onLeave: z.boolean(),
  actions: Actions,
});
export type RosterEntry = z.infer<typeof RosterEntry>;

export const RosterView = z.object({
  month: Month,
  entries: z.array(RosterEntry),
  lawyers: z.array(z.object({ id: z.string(), name: z.string(), officeId: z.string() })),
  actions: Actions,
});
export type RosterView = z.infer<typeof RosterView>;

export const RosterAssign = z.strictObject({
  date: IsoDate,
  lawyerId: z.string().min(1, 'Choose a lawyer'),
  note: opt(Text(2, 200, 'Too short')),
  /** The warning about leave was shown and the supervisor went ahead. */
  confirmLeaveClash: z.boolean().default(false),
});
export type RosterAssign = z.infer<typeof RosterAssign>;

/* -------------------------------------------------------------------------------- custody */

export const CUSTODY_STATUSES = [
  { code: 'held', label: 'In custody' },
  { code: 'bailed', label: 'Out on bail' },
  { code: 'released', label: 'Released' },
  { code: 'transferred', label: 'Transferred' },
] as const;

export const Custody = z.object({
  caseId: z.string(),
  caseReference: z.string(),
  clientName: z.string(),
  facility: z.string(),
  detainedOn: IsoDate,
  daysHeld: z.number().int(),
  status: z.enum(['held', 'bailed', 'released', 'transferred']),
  bailMinor: Minor.nullable(),
  bailPaid: z.boolean(),
  remandUntil: IsoDate.nullable(),
  lawyerName: z.string().nullable(),
  notes: z.string().nullable(),
  concerns: z.array(z.object({ code: z.string(), label: z.string() })),
  actions: Actions,
});
export type Custody = z.infer<typeof Custody>;

export const CustodyListQuery = z.strictObject({
  concern: z.enum(['HELD_LONG', 'BAIL_UNPAID', 'REMAND_SOON', 'NO_LAWYER']).optional(),
  status: z.enum(['held', 'bailed', 'released', 'transferred']).optional(),
  ...ListQuery.shape,
});
export type CustodyListQuery = z.infer<typeof CustodyListQuery>;

export const CustodyUpdate = z
  .strictObject({
    facility: Text(2, 200, 'Enter the police station or prison'),
    detainedOn: IsoDate,
    status: z.enum(['held', 'bailed', 'released', 'transferred']),
    bailMinor: z.number().int().min(1).max(100_000_00).optional(),
    bailPaid: z.boolean().default(false),
    remandUntil: opt(IsoDate),
    notes: opt(Text(2, 2000, 'Too short')),
  })
  .refine((c) => !c.bailPaid || c.bailMinor !== undefined, {
    message: 'Enter the bail amount first.',
    path: ['bailMinor'],
  });
export type CustodyUpdate = z.infer<typeof CustodyUpdate>;

/* ---------------------------------------------------------------------------- prison visits */

export const DETAINEE_FLAGS = [
  { code: 'no_lawyer', label: 'No lawyer' },
  { code: 'juvenile', label: 'Under 18' },
  { code: 'medical', label: 'Needs medical care' },
  { code: 'long_remand', label: 'Long on remand' },
  { code: 'vulnerable', label: 'Vulnerable' },
] as const;

export const Detainee = z.object({
  id: z.string(),
  name: z.string(),
  nationalId: z.string().nullable(),
  flags: z.array(z.string()),
  notes: z.string().nullable(),
  caseId: z.string().nullable(),
  caseReference: z.string().nullable(),
  actions: Actions,
});
export type Detainee = z.infer<typeof Detainee>;

export const PrisonVisit = z.object({
  id: z.string(),
  facility: z.string(),
  date: IsoDate,
  lawyerName: z.string().nullable(),
  purpose: z.string().nullable(),
  status: z.enum(['planned', 'done']),
  detaineeCount: z.number().int(),
  flaggedCount: z.number().int(),
  detainees: z.array(Detainee),
  actions: Actions,
});
export type PrisonVisit = z.infer<typeof PrisonVisit>;

export const PrisonVisitListQuery = z.strictObject({
  status: z.enum(['planned', 'done']).optional(),
  ...ListQuery.shape,
});
export type PrisonVisitListQuery = z.infer<typeof PrisonVisitListQuery>;

export const PrisonVisitCreate = z.strictObject({
  facility: Text(2, 200, 'Enter the prison or station'),
  date: IsoDate,
  lawyerId: opt(z.string()),
  purpose: opt(Text(3, 300, 'Too short')),
});
export type PrisonVisitCreate = z.infer<typeof PrisonVisitCreate>;

export const DetaineeCreate = z.strictObject({
  name: Text(2, 200, 'Enter the name'),
  nationalId: opt(NationalId),
  flags: z.array(z.enum(DETAINEE_FLAGS.map((f) => f.code) as [string, ...string[]])).default([]),
  notes: opt(Text(2, 1000, 'Too short')),
});
export type DetaineeCreate = z.infer<typeof DetaineeCreate>;

/** Starting a case from a detainee: the visit gives the name, the lawyer adds the rest. */
export const DetaineeIntake = z.strictObject({
  matterType: MatterType,
  summary: z.string().trim().min(11, 'Describe the problem in a sentence or two').max(5000),
  province: Province,
  language: Language,
  gender: z.enum(['female', 'male', 'other', 'not_recorded']).default('not_recorded'),
  phone: opt(Phone),
  consentRead: z.literal(true, { error: 'Read the consent statement to the client first' }),
  consentAgreed: z.literal(true, { error: 'The client must agree before this can be saved' }),
});
export type DetaineeIntake = z.infer<typeof DetaineeIntake>;

/* ---------------------------------------------------------------------------- advice desk */

export const Advice = z.object({
  id: z.string(),
  reference: z.string(),
  officeId: z.string(),
  receivedOn: IsoDate,
  anonymous: z.boolean(),
  clientName: z.string().nullable(),
  phone: z.string().nullable(),
  language: z.string(),
  topic: z.string(),
  summary: z.string(),
  status: z.enum(['open', 'follow_up', 'referred', 'converted', 'closed']),
  followUpOn: IsoDate.nullable(),
  referredTo: z.string().nullable(),
  caseId: z.string().nullable(),
  caseReference: z.string().nullable(),
  notes: z.array(
    z.object({ id: z.string(), body: z.string(), byName: z.string(), at: z.string() }),
  ),
  createdByName: z.string(),
  actions: Actions,
});
export type Advice = z.infer<typeof Advice>;

export const AdviceListQuery = z.strictObject({
  status: z.enum(['open', 'follow_up', 'referred', 'converted', 'closed']).optional(),
  topic: z.string().optional(),
  ...ListQuery.shape,
});
export type AdviceListQuery = z.infer<typeof AdviceListQuery>;

export const AdviceCreate = z
  .strictObject({
    anonymous: z.boolean().default(false),
    clientName: opt(Text(2, 200, 'Enter the name')),
    phone: opt(Phone),
    language: Language,
    topic: MatterType,
    summary: Text(11, 5000, 'Say what the advice was about'),
  })
  .refine((a) => a.anonymous || Boolean(a.clientName), {
    message: 'Enter a name, or tick anonymous.',
    path: ['clientName'],
  });
export type AdviceCreate = z.infer<typeof AdviceCreate>;

export const AdviceNote = z.strictObject({ body: Text(1, 5000, 'Write the note') });
export const AdviceFollowUp = z.strictObject({ dueOn: IsoDate });
export type AdviceFollowUp = z.infer<typeof AdviceFollowUp>;
export const AdviceReferral = z.strictObject({
  partnerOrgId: z.string().min(1, 'Choose an organisation'),
  reason: Reason,
});
export type AdviceReferral = z.infer<typeof AdviceReferral>;

export const AdviceConvert = z.strictObject({
  province: Province,
  gender: z.enum(['female', 'male', 'other', 'not_recorded']).default('not_recorded'),
  nationalId: opt(NationalId),
  consentRead: z.literal(true, { error: 'Read the consent statement to the client first' }),
  consentAgreed: z.literal(true, { error: 'The client must agree before this can be saved' }),
});
export type AdviceConvert = z.infer<typeof AdviceConvert>;

export const Clinic = z.object({
  id: z.string(),
  name: z.string(),
  town: z.string(),
  officeId: z.string(),
  date: IsoDate,
  peopleSeen: z.number().int(),
  topics: z.string().nullable(),
  status: z.enum(['planned', 'held']),
  actions: Actions,
});
export type Clinic = z.infer<typeof Clinic>;

export const ClinicCreate = z.strictObject({
  name: Text(3, 160, 'Name the clinic'),
  town: Text(2, 80, 'Enter the town'),
  date: IsoDate,
  topics: opt(Text(2, 300, 'Too short')),
});
export type ClinicCreate = z.infer<typeof ClinicCreate>;

export const ClinicSeen = z.strictObject({ peopleSeen: z.number().int().min(0).max(2000) });
export type ClinicSeen = z.infer<typeof ClinicSeen>;

/* ------------------------------------------------------------------------------- courts */

export const Court = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.string(),
  town: z.string(),
  hearingCount: z.number().int(),
  actions: Actions,
});
export type Court = z.infer<typeof Court>;

export const CourtCreate = z.strictObject({
  name: Text(3, 160, 'Enter the court name'),
  kind: Text(3, 60, 'Enter the kind of court'),
  town: Text(2, 80, 'Enter the town'),
});
export type CourtCreate = z.infer<typeof CourtCreate>;

/* ----------------------------------------------------------------- judgments and appeals */

export const JUDGMENT_OUTCOMES = [
  { code: 'for_client', label: 'In the client’s favour' },
  { code: 'partly', label: 'Partly in the client’s favour' },
  { code: 'against_client', label: 'Against the client' },
  { code: 'dismissed', label: 'Case dismissed' },
  { code: 'withdrawn', label: 'Withdrawn' },
] as const;

export const Judgment = z.object({
  id: z.string(),
  caseId: z.string(),
  caseReference: z.string(),
  clientName: z.string(),
  date: IsoDate,
  court: z.string(),
  outcome: z.string(),
  summary: z.string(),
  appealDays: z.number().int(),
  appealDeadline: IsoDate,
  daysToDeadline: z.number().int(),
  appeal: z.enum(['undecided', 'noted', 'abandoned']),
  appealReason: z.string().nullable(),
  /** The deadline passed with no decision. */
  overdue: z.boolean(),
  enforcement: z.enum(['none', 'ordered', 'executed']),
  enforcementNote: z.string().nullable(),
  actions: Actions,
});
export type Judgment = z.infer<typeof Judgment>;

export const JudgmentListQuery = z.strictObject({
  appeal: z.enum(['undecided', 'noted', 'abandoned']).optional(),
  ...ListQuery.shape,
});
export type JudgmentListQuery = z.infer<typeof JudgmentListQuery>;

export const JudgmentCreate = z.strictObject({
  date: IsoDate,
  courtId: opt(z.string()),
  courtText: opt(Text(2, 200, 'Too short')),
  outcome: z.enum(JUDGMENT_OUTCOMES.map((o) => o.code) as [string, ...string[]], {
    error: 'Choose the outcome',
  }),
  summary: Text(5, 3000, 'Summarise the judgment'),
});
export type JudgmentCreate = z.infer<typeof JudgmentCreate>;

export const AppealDecision = z.discriminatedUnion('decision', [
  z.strictObject({ decision: z.literal('noted') }),
  z.strictObject({ decision: z.literal('abandoned'), reason: Reason }),
]);
export type AppealDecision = z.infer<typeof AppealDecision>;

export const EnforcementUpdate = z.strictObject({
  status: z.enum(['ordered', 'executed']),
  note: opt(Text(2, 1000, 'Too short')),
});
export type EnforcementUpdate = z.infer<typeof EnforcementUpdate>;

export const AppealRules = z.object({
  /** Days to note an appeal, by kind of court. */
  days: z.record(z.string(), z.number().int()),
  otherDays: z.number().int(),
  actions: Actions,
});
export type AppealRules = z.infer<typeof AppealRules>;

export const AppealRulesUpdate = z.strictObject({
  days: z.record(z.string(), z.number().int().min(1).max(120)),
  otherDays: z.number().int().min(1).max(120),
});
export type AppealRulesUpdate = z.infer<typeof AppealRulesUpdate>;

/* -------------------------------------------------------------- negotiations, settlements */

export const Offer = z.object({
  id: z.string(),
  direction: z.enum(['ours', 'theirs']),
  amountMinor: Minor,
  note: z.string().nullable(),
  at: z.string(),
  byName: z.string(),
});

export const Instalment = z.object({
  n: z.number().int(),
  dueOn: IsoDate,
  amountMinor: Minor,
  receivedOn: IsoDate.nullable(),
  overdue: z.boolean(),
});

export const Negotiation = z.object({
  id: z.string(),
  caseId: z.string(),
  caseReference: z.string(),
  clientName: z.string(),
  opponent: z.string(),
  status: z.enum(['open', 'agreed', 'failed']),
  offers: z.array(Offer),
  /** What the client has said about the last offer. */
  instruction: z
    .object({ accepted: z.boolean(), text: z.string(), at: z.string(), byName: z.string() })
    .nullable(),
  settlement: z
    .object({
      totalMinor: Minor,
      receivedMinor: Minor,
      instalments: z.array(Instalment),
    })
    .nullable(),
  actions: Actions,
});
export type Negotiation = z.infer<typeof Negotiation>;

export const NegotiationListQuery = z.strictObject({
  status: z.enum(['open', 'agreed', 'failed']).optional(),
  ...ListQuery.shape,
});
export type NegotiationListQuery = z.infer<typeof NegotiationListQuery>;

export const NegotiationCreate = z.strictObject({
  opponent: Text(2, 200, 'Who is the other side?'),
});
export type NegotiationCreate = z.infer<typeof NegotiationCreate>;

export const OfferCreate = z.strictObject({
  direction: z.enum(['ours', 'theirs']),
  amountMinor: z.number().int().min(1, 'Enter the amount').max(100_000_000_00),
  note: opt(Text(2, 500, 'Too short')),
});
export type OfferCreate = z.infer<typeof OfferCreate>;

export const ClientInstruction = z.strictObject({
  accepted: z.boolean(),
  text: Text(3, 1000, 'Write what the client said'),
});
export type ClientInstruction = z.infer<typeof ClientInstruction>;

export const SettleRequest = z.strictObject({
  instalments: z.number().int().min(1).max(36),
  firstDueOn: IsoDate,
});
export type SettleRequest = z.infer<typeof SettleRequest>;

export const InstalmentReceipt = z.strictObject({ receivedOn: IsoDate.optional() });
export type InstalmentReceipt = z.infer<typeof InstalmentReceipt>;

export const NegotiationFail = z.strictObject({ reason: Reason });
export type NegotiationFail = z.infer<typeof NegotiationFail>;

/* ----------------------------------------------------------------------------- mediation */

export const Mediation = z.object({
  id: z.string(),
  caseId: z.string(),
  caseReference: z.string(),
  clientName: z.string(),
  scheduledOn: IsoDate,
  mediator: z.string(),
  venue: z.string().nullable(),
  status: z.enum(['scheduled', 'agreed', 'failed', 'adjourned']),
  terms: z.string().nullable(),
  actions: Actions,
});
export type Mediation = z.infer<typeof Mediation>;

export const MediationListQuery = z.strictObject({
  status: z.enum(['scheduled', 'agreed', 'failed', 'adjourned']).optional(),
  ...ListQuery.shape,
});
export type MediationListQuery = z.infer<typeof MediationListQuery>;

export const MediationCreate = z.strictObject({
  scheduledOn: IsoDate,
  mediator: Text(2, 160, 'Who is the mediator?'),
  venue: opt(Text(2, 200, 'Too short')),
});
export type MediationCreate = z.infer<typeof MediationCreate>;

export const MediationOutcome = z.discriminatedUnion('outcome', [
  z.strictObject({ outcome: z.literal('agreed'), terms: Text(10, 5000, 'Write the agreed terms') }),
  z.strictObject({ outcome: z.literal('failed'), reason: Reason }),
  z.strictObject({ outcome: z.literal('adjourned'), scheduledOn: IsoDate }),
]);
export type MediationOutcome = z.infer<typeof MediationOutcome>;

/* ------------------------------------------------------------------------------- costs */

export const CostItem = z.object({
  id: z.string(),
  caseId: z.string(),
  caseReference: z.string(),
  kind: z.enum(['costs_order', 'undertaking']),
  description: z.string(),
  amountMinor: Minor.nullable(),
  dueOn: IsoDate.nullable(),
  givenByName: z.string(),
  status: z.enum(['open', 'closed']),
  closedNote: z.string().nullable(),
  actions: Actions,
});
export type CostItem = z.infer<typeof CostItem>;

export const CostListQuery = z.strictObject({
  kind: z.enum(['costs_order', 'undertaking']).optional(),
  status: z.enum(['open', 'closed']).optional(),
  ...ListQuery.shape,
});
export type CostListQuery = z.infer<typeof CostListQuery>;

export const CostCreate = z.strictObject({
  kind: z.enum(['costs_order', 'undertaking']),
  description: Text(5, 1000, 'Describe it'),
  amountMinor: z.number().int().min(1).max(100_000_000_00).optional(),
  dueOn: opt(IsoDate),
});
export type CostCreate = z.infer<typeof CostCreate>;

export const CostClose = z.strictObject({ note: Text(3, 500, 'Say how it was dealt with') });
export type CostClose = z.infer<typeof CostClose>;

/* --------------------------------------------------------------------------- referrals */

export const REFERRAL_STATUSES = [
  { code: 'sent', label: 'Sent' },
  { code: 'acknowledged', label: 'Acknowledged' },
  { code: 'taken_on', label: 'Taken on' },
  { code: 'declined_by_partner', label: 'Declined by partner' },
] as const;

export const Referral = z.object({
  id: z.string(),
  caseId: z.string(),
  caseReference: z.string(),
  clientName: z.string(),
  partner: z.string(),
  sentOn: IsoDate,
  reason: z.string(),
  status: z.enum(['sent', 'acknowledged', 'taken_on', 'declined_by_partner']),
  stale: z.boolean(),
  actions: Actions,
});
export type Referral = z.infer<typeof Referral>;

export const ReferralListQuery = z.strictObject({
  status: z.enum(['sent', 'acknowledged', 'taken_on', 'declined_by_partner']).optional(),
  stale: z.enum(['true']).optional(),
  ...ListQuery.shape,
});
export type ReferralListQuery = z.infer<typeof ReferralListQuery>;

export const ReferralCreate = z.strictObject({
  partnerOrgId: z.string().min(1, 'Choose an organisation'),
  reason: Reason,
});
export type ReferralCreate = z.infer<typeof ReferralCreate>;

export const ReferralStatusChange = z.strictObject({
  status: z.enum(['acknowledged', 'taken_on', 'declined_by_partner']),
});
export type ReferralStatusChange = z.infer<typeof ReferralStatusChange>;
