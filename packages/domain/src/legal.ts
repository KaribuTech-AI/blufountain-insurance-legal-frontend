import { z } from 'zod';
import { NationalId, Phone, Reason } from './fields.js';

/* ------------------------------------------------------------------------------------------
 * Reference data shared by the API and the apps (prototype lines 714 to 722).
 * ---------------------------------------------------------------------------------------- */

export const MATTER_TYPES = [
  { code: 'criminal_defence', label: 'Criminal defence' },
  { code: 'family_maintenance', label: 'Family and maintenance' },
  { code: 'inheritance_estates', label: 'Inheritance and estates' },
  { code: 'labour', label: 'Labour' },
  { code: 'land_eviction', label: 'Land and eviction' },
  { code: 'protection_order_gbv', label: 'Protection order (GBV)' },
] as const;
export const MatterType = z.enum(MATTER_TYPES.map((m) => m.code) as [string, ...string[]], {
  error: 'Choose the type of matter',
});

/** Provinces and the office that serves each (schema: platform.province_offices). */
export const PROVINCES = [
  { name: 'Harare', office: 'harare' },
  { name: 'Chinhoyi', office: 'harare' },
  { name: 'Bulawayo', office: 'bulawayo' },
  { name: 'Mutare', office: 'mutare' },
  { name: 'Gweru', office: 'gweru' },
  { name: 'Masvingo', office: 'masvingo' },
] as const;
export const Province = z.enum(PROVINCES.map((p) => p.name) as [string, ...string[]], {
  error: 'Choose a province',
});

export const LANGUAGES = ['English', 'Shona', 'Ndebele'] as const;
export const Language = z.enum(LANGUAGES, { error: 'Choose a language' });

export const GENDERS = ['female', 'male', 'other', 'not_recorded'] as const;

export const CHANNELS = [
  { code: 'walk_in', label: 'Walk-in' },
  { code: 'phone', label: 'Phone' },
  { code: 'whatsapp', label: 'WhatsApp' },
  { code: 'client_portal', label: 'Client portal' },
  { code: 'member_app', label: 'Member app' },
  { code: 'partner_referral', label: 'Referral from partner' },
  { code: 'prison_visit', label: 'Prison visit' },
  { code: 'outreach_clinic', label: 'Outreach clinic' },
] as const;
export const Channel = z.enum(CHANNELS.map((c) => c.code) as [string, ...string[]], {
  error: 'Choose how the client came to us',
});

export const URGENT_FLAGS = [
  { code: 'in_custody', label: 'Client is in custody' },
  { code: 'eviction_date_set', label: 'Eviction or removal date is set' },
  { code: 'risk_of_violence', label: 'Risk of violence' },
  { code: 'court_within_14_days', label: 'Court date within 14 days' },
] as const;
export const UrgentFlag = z.enum(URGENT_FLAGS.map((f) => f.code) as [string, ...string[]]);

export const SUPPORT_NEEDS = [
  { code: 'interpreter', label: 'Needs an interpreter' },
  { code: 'cannot_read_write', label: 'Cannot read or write' },
  { code: 'disability', label: 'Has a disability' },
  { code: 'safety_concern', label: 'Safety concern: do not contact at home' },
  { code: 'child', label: 'Client is a child' },
] as const;
export const SupportNeed = z.enum(SUPPORT_NEEDS.map((n) => n.code) as [string, ...string[]]);

export const CASE_STAGES = [
  { code: 'intake', label: 'Intake incomplete' },
  { code: 'screening', label: 'Awaiting screening' },
  { code: 'accepted', label: 'Accepted, needs lawyer' },
  { code: 'active', label: 'Active' },
  { code: 'referred', label: 'Referred out' },
  { code: 'closed', label: 'Closed' },
] as const;
export const CaseStage = z.enum(CASE_STAGES.map((s) => s.code) as [string, ...string[]]);
export type CaseStage = z.infer<typeof CaseStage>;

export const ConflictStatus = z.enum(['clear', 'flagged', 'cleared', 'confirmed']);
export type ConflictStatus = z.infer<typeof ConflictStatus>;

export const CLOSURE_RESULTS = [
  { code: 'won_or_order_granted', label: 'Won, or order granted' },
  { code: 'settled', label: 'Settled' },
  { code: 'acquitted_or_withdrawn', label: 'Acquitted or charges withdrawn' },
  { code: 'convicted', label: 'Convicted' },
  { code: 'lost', label: 'Lost' },
  { code: 'client_withdrew', label: 'Client withdrew' },
  { code: 'client_stopped_responding', label: 'Client stopped responding' },
  { code: 'other', label: 'Other' },
] as const;
export const ClosureResult = z.enum(CLOSURE_RESULTS.map((r) => r.code) as [string, ...string[]]);

export const labelOf = (list: ReadonlyArray<{ code: string; label: string }>, code: string) =>
  list.find((item) => item.code === code)?.label ?? code;

/** The consent statement the client hears (BR-03). Bump when the wording changes. */
export const CONSENT_STATEMENT_VERSION = 'v1';

/* ------------------------------------------------------------------------------------------
 * Shared building blocks
 * ---------------------------------------------------------------------------------------- */

/** What the server says about one action on one record (frontend E section 6.2). */
export const ActionState = z.object({
  allowed: z.boolean(),
  /** Plain-language reason when not allowed. */
  reason: z.string().optional(),
  requiresConfirmation: z.boolean().optional(),
  requiresReason: z.boolean().optional(),
});
export type ActionState = z.infer<typeof ActionState>;

/** Forms send "" for an empty optional field; the API treats that as "not given". */
const blankToUndefined = <T extends z.ZodType>(schema: T) =>
  z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    schema.optional(),
  ) as unknown as z.ZodOptional<T>;

const Money = z.number().int().min(0).max(100_000_000_00);

export const PageQuery = {
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
};

export const pageOf = <T extends z.ZodType>(item: T) =>
  z.object({ items: z.array(item), page: z.number(), pageSize: z.number(), total: z.number() });

/* ------------------------------------------------------------------------------------------
 * Clients
 * ---------------------------------------------------------------------------------------- */

export const ClientSummary = z.object({
  id: z.string(),
  fullName: z.string(),
  province: z.string(),
  language: z.string(),
  /** First 3 and last 3 characters only, unless the viewer holds pii.nationalId.read. */
  nationalId: z.string().nullable(),
  phoneLast4: z.string().nullable(),
  version: z.number(),
});
export type ClientSummary = z.infer<typeof ClientSummary>;

export const ClientMatchQuery = z.strictObject({
  nationalId: blankToUndefined(NationalId),
  phone: blankToUndefined(Phone),
});

export const ClientMatch = z.object({
  byNationalId: ClientSummary.nullable(),
  byPhone: z.array(ClientSummary),
});
export type ClientMatch = z.infer<typeof ClientMatch>;

export type ClientMatchQuery = z.infer<typeof ClientMatchQuery>;

export const ClientListQuery = z.strictObject({
  ...PageQuery,
  q: z.string().trim().min(2).max(100).optional(),
  province: Province.optional(),
});
export type ClientListQuery = z.infer<typeof ClientListQuery>;

export const ClientUpdate = z.strictObject({
  fullName: z.string().trim().min(2).max(200).optional(),
  gender: z.enum(GENDERS).optional(),
  age: z.number().int().min(0).max(120).nullable().optional(),
  province: Province.optional(),
  language: Language.optional(),
  nationalId: blankToUndefined(NationalId),
  phone: blankToUndefined(Phone),
});
export type ClientUpdate = z.infer<typeof ClientUpdate>;

/* ------------------------------------------------------------------------------------------
 * Intake (backend C section 3.1)
 * ---------------------------------------------------------------------------------------- */

/** D-14: shown by the form and returned by the API, so both say the same thing. */
export const IDENTIFIER_REQUIRED_MESSAGE =
  'Enter the national ID number, or a phone number if the client has no ID.';

export const IntakeClient = z
  .strictObject({
    /** Reuse an existing client after matching. */
    clientId: z.string().uuid().optional(),
    fullName: z.string().trim().min(2, 'Enter the client’s full name').max(200),
    gender: z.enum(GENDERS).default('not_recorded'),
    age: z.number().int().min(0).max(120).optional(),
    province: Province,
    language: Language,
    nationalId: blankToUndefined(NationalId),
    phone: blankToUndefined(Phone),
    /** D-14b: "different person sharing this phone". */
    sharedPhoneConfirmed: z.boolean().default(false),
  })
  // D-14: a national ID, or a phone number if there is none. An existing client already has one.
  .refine((v) => v.clientId || v.nationalId || v.phone, {
    message: IDENTIFIER_REQUIRED_MESSAGE,
    path: ['nationalId'],
  });

export const IntakeParty = z.strictObject({
  name: z.string().trim().min(2, 'Enter the name').max(200),
  kind: z.enum(['person', 'organisation', 'state']),
});
export type IntakeParty = z.infer<typeof IntakeParty>;

export const IntakeCreate = z.strictObject({
  client: IntakeClient,
  matter: z.strictObject({
    matterType: MatterType,
    // BR-02: longer than 10 characters.
    summary: z.string().trim().min(11, 'Describe the problem in a sentence or two').max(5000),
    urgentFlags: z.array(UrgentFlag).default([]),
    supportNeeds: z.array(SupportNeed).default([]),
  }),
  channel: Channel,
  parties: z.array(IntakeParty).max(20).default([]),
  policyReference: blankToUndefined(
    z.string().regex(/^BF-POL-\d{5,}$/, 'Use the format BF-POL-01027'),
  ),
  // BR-03: both confirmations.
  consent: z.strictObject({
    readInLanguage: z.literal(true, { error: 'Read the consent statement to the client first' }),
    agreed: z.literal(true, { error: 'The client must agree before this can be saved' }),
    statementVersion: z.string(),
  }),
  source: z
    .strictObject({
      type: z.enum(['advice', 'detainee', 'policy', 'client']),
      id: z.string().uuid(),
    })
    .optional(),
});
export type IntakeCreate = z.infer<typeof IntakeCreate>;
export type IntakeCreateInput = z.input<typeof IntakeCreate>;

/* ------------------------------------------------------------------------------------------
 * Conflicts (BR-04, BR-05)
 * ---------------------------------------------------------------------------------------- */

export const ConflictCheckRequest = z.strictObject({
  clientName: z.string().trim().min(2).max(200),
  parties: z.array(IntakeParty).max(20).default([]),
  /** When re-checking an existing case, so it is not compared with itself. */
  excludeCaseId: z.string().uuid().optional(),
});
export type ConflictCheckRequest = z.infer<typeof ConflictCheckRequest>;

export const ConflictMatch = z.object({
  kind: z.enum(['client_is_opposing_party', 'party_is_existing_client']),
  /** Set only when the caller may open that case; otherwise the match is described generally. */
  caseId: z.string().nullable(),
  caseReference: z.string().nullable(),
  message: z.string(),
});
export type ConflictMatch = z.infer<typeof ConflictMatch>;

export const ConflictCheckResult = z.object({
  result: z.enum(['clear', 'flagged']),
  matches: z.array(ConflictMatch),
});
export type ConflictCheckResult = z.infer<typeof ConflictCheckResult>;

export const ConflictDecision = z.strictObject({
  decision: z.enum(['clear', 'confirm']),
  reason: Reason,
  /** Required when confirming: the case is referred out. */
  partnerOrgId: z.string().optional(),
});
export type ConflictDecision = z.infer<typeof ConflictDecision>;

/* ------------------------------------------------------------------------------------------
 * Eligibility and screening (BR-06 to BR-12)
 * ---------------------------------------------------------------------------------------- */

export const EligibilityInput = z.strictObject({
  wagesMinor: Money.default(0),
  tradeMinor: Money.default(0),
  remittancesMinor: Money.default(0),
  otherMinor: Money.default(0),
  dependants: z.number().int().min(0).max(30).default(0),
  assetsMinor: Money.default(0),
  /** The three merits questions, in the order shown on the screening page. */
  merits: z.tuple([z.boolean(), z.boolean(), z.boolean()]).default([false, false, false]),
});
export type EligibilityInput = z.infer<typeof EligibilityInput>;
export type EligibilityInputForm = z.input<typeof EligibilityInput>;

export const VERDICTS = [
  'eligible',
  'eligible_automatic',
  'covered_by_policy',
  'not_eligible',
] as const;

export const Verdict = z.object({
  verdict: z.enum(VERDICTS),
  eligible: z.boolean(),
  incomeMinor: z.number(),
  limitMinor: z.number(),
  assetsMinor: z.number(),
  assetLimitMinor: z.number(),
  meansOk: z.boolean(),
  assetsOk: z.boolean(),
  meritsOk: z.boolean(),
  automatic: z.boolean(),
  covered: z.boolean(),
  reasons: z.array(z.object({ code: z.string(), message: z.string() })),
});
export type Verdict = z.infer<typeof Verdict>;

export const ScreeningDecision = z.discriminatedUnion('decision', [
  z.strictObject({
    decision: z.literal('approve'),
    eligibility: EligibilityInput,
    /** Required by the server when the client is not eligible (BR-11). */
    exceptionReason: Reason.optional(),
    lawyerId: z.string().optional(),
  }),
  z.strictObject({
    decision: z.literal('refer'),
    eligibility: EligibilityInput,
    partnerOrgId: z.string(),
    reason: Reason,
  }),
  z.strictObject({
    decision: z.literal('decline'),
    eligibility: EligibilityInput,
    // BR-12: the client has a right to know why.
    reason: Reason,
  }),
]);
export type ScreeningDecision = z.infer<typeof ScreeningDecision>;

/* ------------------------------------------------------------------------------------------
 * Cases
 * ---------------------------------------------------------------------------------------- */

export const CaseSummary = z.object({
  id: z.string(),
  reference: z.string(),
  clientId: z.string(),
  clientName: z.string(),
  matterType: z.string(),
  stage: CaseStage,
  urgent: z.boolean(),
  urgentFlags: z.array(z.string()),
  officeId: z.string(),
  province: z.string(),
  assignedLawyerId: z.string().nullable(),
  assignedLawyerName: z.string().nullable(),
  conflictStatus: ConflictStatus,
  openedOn: z.string(),
  nextHearingOn: z.string().nullable(),
  outcome: z.string().nullable(),
  version: z.number(),
});
export type CaseSummary = z.infer<typeof CaseSummary>;

export const CaseParty = z.object({
  name: z.string(),
  kind: z.enum(['person', 'organisation', 'state']),
});

export const CaseDetail = CaseSummary.extend({
  channel: z.string(),
  language: z.string(),
  summary: z.string(),
  supportNeeds: z.array(z.string()),
  smsEnabled: z.boolean(),
  client: ClientSummary,
  parties: z.array(CaseParty),
  /** Tabs this user may open (the notes tab is absent for receptionists). */
  tabs: z.array(z.string()),
  actions: z.record(z.string(), ActionState),
  closedOn: z.string().nullable(),
});
export type CaseDetail = z.infer<typeof CaseDetail>;

export const CaseListQuery = z.strictObject({
  ...PageQuery,
  stage: CaseStage.optional(),
  matterType: MatterType.optional(),
  lawyerId: z.string().optional(),
  office: z.string().optional(),
  q: z.string().trim().min(2).max(100).optional(),
  urgent: z.enum(['true']).optional(),
  sort: z.enum(['openedOn', '-openedOn', 'client', '-client']).default('-openedOn'),
});
export type CaseListQuery = z.infer<typeof CaseListQuery>;

export const CaseUpdate = z.strictObject({
  summary: z.string().trim().min(11).max(5000).optional(),
  supportNeeds: z.array(SupportNeed).optional(),
  smsEnabled: z.boolean().optional(),
  language: Language.optional(),
});
export type CaseUpdate = z.infer<typeof CaseUpdate>;

export const AssignLawyer = z.strictObject({ lawyerId: z.string() });
export type AssignLawyer = z.infer<typeof AssignLawyer>;

export const CoverAssignment = z.strictObject({
  lawyerId: z.string(),
  startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: Reason,
});
export type CoverAssignment = z.infer<typeof CoverAssignment>;

/** Non-closing stage changes. Referring out needs a partner organisation and a reason. */
export const StageChange = z.strictObject({
  stage: z.enum(['accepted', 'active', 'referred']),
  partnerOrgId: z.string().optional(),
  reason: Reason.optional(),
});
export type StageChange = z.infer<typeof StageChange>;

export const CaseClosure = z.strictObject({
  result: ClosureResult,
  detail: z.string().trim().max(2000).optional(),
  // BR-13: the client must be told the result and any right to appeal.
  clientInformed: z.literal(true, { error: 'Confirm that the client has been told the result' }),
  sendFeedbackSms: z.boolean().default(false),
});
export type CaseClosure = z.infer<typeof CaseClosure>;

export const TimelineEvent = z.object({
  id: z.string(),
  at: z.string(),
  actorName: z.string().nullable(),
  type: z.string(),
  text: z.string(),
});
export type TimelineEvent = z.infer<typeof TimelineEvent>;

/* ------------------------------------------------------------------------------------------
 * Hearings, notes, tasks
 * ---------------------------------------------------------------------------------------- */

export const HearingCreate = z
  .strictObject({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD'),
    time: z
      .string()
      .regex(/^\d{2}:\d{2}$/, 'Use the format HH:MM')
      .default('09:00'),
    courtId: z.string().optional(),
    courtText: z.string().trim().min(2).max(200).optional(),
    purpose: z.string().trim().min(2, 'Say what the hearing is for').max(300),
  })
  .refine((v) => v.courtId || v.courtText, {
    message: 'Choose a court or type its name',
    path: ['courtId'],
  });
export type HearingCreate = z.infer<typeof HearingCreate>;

export const Hearing = z.object({
  id: z.string(),
  caseId: z.string(),
  date: z.string(),
  time: z.string(),
  courtId: z.string().nullable(),
  courtName: z.string(),
  purpose: z.string(),
});
export type Hearing = z.infer<typeof Hearing>;

export const NoteCreate = z.strictObject({ body: z.string().trim().min(1).max(10_000) });
export type NoteCreate = z.infer<typeof NoteCreate>;

export const Note = z.object({
  id: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  createdAt: z.string(),
  body: z.string(),
});
export type Note = z.infer<typeof Note>;

export const TaskCreate = z.strictObject({
  title: z.string().trim().min(2).max(200),
  dueOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** Defaults to the creator. Naming someone else needs task.assign. */
  assigneeId: z.string().optional(),
  isLegalDeadline: z.boolean().default(false),
});
export type TaskCreate = z.infer<typeof TaskCreate>;

export const TaskUpdate = z.strictObject({
  done: z.boolean().optional(),
  assigneeId: z.string().optional(),
});
export type TaskUpdate = z.infer<typeof TaskUpdate>;

export const Task = z.object({
  id: z.string(),
  caseId: z.string().nullable(),
  caseReference: z.string().nullable(),
  title: z.string(),
  dueOn: z.string(),
  assigneeId: z.string(),
  assigneeName: z.string(),
  isLegalDeadline: z.boolean(),
  doneAt: z.string().nullable(),
  version: z.number(),
});
export type Task = z.infer<typeof Task>;

export const TaskListQuery = z.strictObject({
  ...PageQuery,
  scope: z.enum(['mine', 'all']).default('mine'),
  status: z.enum(['open', 'done']).default('open'),
});
export type TaskListQuery = z.infer<typeof TaskListQuery>;

/* ------------------------------------------------------------------------------------------
 * Approvals, counters, dashboard, reference
 * ---------------------------------------------------------------------------------------- */

export const ApprovalItem = z.object({
  type: z.enum(['conflict', 'exception']),
  caseId: z.string(),
  caseReference: z.string(),
  clientName: z.string(),
  since: z.string(),
  detail: z.string(),
});
export type ApprovalItem = z.infer<typeof ApprovalItem>;

export const Counters = z.object({
  screening: z.number(),
  tasksDue: z.number(),
  approvals: z.number(),
});
export type Counters = z.infer<typeof Counters>;

export const Dashboard = z.object({
  byStage: z.record(z.string(), z.number()),
  urgent: z.number(),
  hearings: z.array(
    z.object({
      caseId: z.string(),
      caseReference: z.string(),
      clientName: z.string(),
      date: z.string(),
      time: z.string(),
      courtName: z.string(),
      purpose: z.string(),
    }),
  ),
  tasks: z.array(Task),
});
export type Dashboard = z.infer<typeof Dashboard>;

export const LawyerOption = z.object({
  id: z.string(),
  name: z.string(),
  officeId: z.string(),
  kind: z.enum(['staff', 'pro_bono_partner']),
  activeCases: z.number(),
  maxActiveCases: z.number(),
  active: z.boolean(),
});
export type LawyerOption = z.infer<typeof LawyerOption>;

export const ReferenceData = z.object({
  matterTypes: z.array(z.object({ code: z.string(), label: z.string() })),
  provinces: z.array(z.object({ name: z.string(), office: z.string() })),
  offices: z.array(z.object({ id: z.string(), name: z.string() })),
  courts: z.array(
    z.object({ id: z.string(), name: z.string(), kind: z.string(), town: z.string() }),
  ),
  partnerOrganisations: z.array(z.object({ id: z.string(), name: z.string() })),
  lawyers: z.array(LawyerOption),
});
export type ReferenceData = z.infer<typeof ReferenceData>;

/* ------------------------------------------------------------------------------------------
 * Composite responses
 * ---------------------------------------------------------------------------------------- */

export const ClientProfile = ClientSummary.extend({
  gender: z.string(),
  age: z.number().nullable(),
  /** Only the matters the viewer may open. */
  cases: z.array(CaseSummary),
});
export type ClientProfile = z.infer<typeof ClientProfile>;

export const ScreeningResult = z.object({ case: CaseDetail, verdict: Verdict });
export type ScreeningResult = z.infer<typeof ScreeningResult>;

export const TimelinePage = z.object({
  items: z.array(TimelineEvent),
  /** Pass as `cursor` to get the next page; null at the end. */
  nextCursor: z.number().nullable(),
});
export type TimelinePage = z.infer<typeof TimelinePage>;

/**
 * Whether a safety concern is among the support needs, which switches SMS off (BR-16). A display
 * aid so the form can explain itself; the API enforces the rule and answers 409 SMS_SAFETY.
 */
export const smsBlockedBy = (supportNeeds: readonly string[]): boolean =>
  supportNeeds.includes('safety_concern');
