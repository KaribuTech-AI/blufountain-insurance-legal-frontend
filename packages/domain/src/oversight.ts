import { z } from 'zod';
import { IsoDate, Reason } from './fields.js';
import { ActionState, PageQuery } from './legal.js';

/* ------------------------------------------------------------------------------------------
 * Oversight and insurance risk (Phase 9): approvals, reports, governance, privacy, audit,
 * settings, exports, reinsurance and reserves
 * ---------------------------------------------------------------------------------------- */

const Minor = z.number().int().min(0).max(100_000_000_00);
const Text = (min: number, max: number, message: string) =>
  z.string().trim().min(min, message).max(max);
const Actions = z.record(z.string(), ActionState);

/* -------------------------------------------------------------------------- approvals */

export const APPROVAL_TYPES = [
  { code: 'expense', label: 'Expense claim' },
  { code: 'petty_cash', label: 'Petty cash voucher' },
  { code: 'leave', label: 'Leave request' },
  { code: 'purchase', label: 'Purchase' },
  { code: 'refund', label: 'Refund to pay' },
  { code: 'application', label: 'Application to underwrite' },
  { code: 'claim', label: 'Claim to decide' },
  { code: 'panel_invoice', label: 'Panel invoice' },
  { code: 'data_request', label: 'Data request due' },
  { code: 'complaint', label: 'Complaint to answer' },
  { code: 'export', label: 'Full export to approve' },
] as const;
export type ApprovalTypeCode = (typeof APPROVAL_TYPES)[number]['code'];

export const WorkApproval = z.object({
  type: z.enum(APPROVAL_TYPES.map((t) => t.code) as [string, ...string[]]),
  id: z.string(),
  title: z.string(),
  detail: z.string(),
  amountMinor: Minor.nullable(),
  since: IsoDate,
  /** The staff page where it is decided. */
  href: z.string(),
  /** The person who raised it cannot decide it (separation of duties). */
  canDecide: ActionState,
});
export type WorkApproval = z.infer<typeof WorkApproval>;

export const WorkApprovalsQuery = z.strictObject({
  type: z.string().max(40).optional(),
});
export type WorkApprovalsQuery = z.infer<typeof WorkApprovalsQuery>;

export const WorkApprovals = z.object({
  items: z.array(WorkApproval),
  counts: z.record(z.string(), z.number()),
});
export type WorkApprovals = z.infer<typeof WorkApprovals>;

/* ----------------------------------------------------------------------------- reports */

export const ReportQuery = z.strictObject({
  from: IsoDate.optional(),
  to: IsoDate.optional(),
});
export type ReportQuery = z.infer<typeof ReportQuery>;

export const OverviewReport = z.object({
  from: IsoDate,
  to: IsoDate,
  cases: z.object({
    opened: z.number(),
    closed: z.number(),
    openNow: z.number(),
    byMatter: z.array(z.object({ matter: z.string(), count: z.number() })),
    byOffice: z.array(z.object({ office: z.string(), count: z.number() })),
  }),
  cover: z.object({
    livePolicies: z.number(),
    premiumReceivedMinor: Minor,
    claimsRegistered: z.number(),
    claimsAccepted: z.number(),
    claimsDeclined: z.number(),
    reserveOpenMinor: Minor,
  }),
  money: z.object({ expensesPaidMinor: Minor, clientMoneyHeldMinor: Minor }),
  oversight: z.object({
    complaintsOpen: z.number(),
    incidentsOpen: z.number(),
    dataRequestsOpen: z.number(),
  }),
});
export type OverviewReport = z.infer<typeof OverviewReport>;

export const PerformanceReport = z.object({
  from: IsoDate,
  to: IsoDate,
  lawyers: z.array(
    z.object({
      lawyerId: z.string(),
      name: z.string(),
      officeName: z.string(),
      opened: z.number(),
      closed: z.number(),
      openNow: z.number(),
      hearings: z.number(),
      hoursLogged: z.number(),
    }),
  ),
});
export type PerformanceReport = z.infer<typeof PerformanceReport>;

export const DonorReportQuery = z.strictObject({
  grantId: z.string().min(1, 'Choose a grant'),
});
export type DonorReportQuery = z.infer<typeof DonorReportQuery>;

export const DonorReport = z.object({
  grantId: z.string(),
  donor: z.string(),
  grantName: z.string(),
  period: z.string(),
  totalMinor: Minor,
  spentMinor: Minor,
  remainingMinor: Minor,
  projects: z.array(
    z.object({
      name: z.string(),
      budgetMinor: Minor,
      spentMinor: Minor,
      casesOpened: z.number(),
      adviceGiven: z.number(),
      clinicsHeld: z.number(),
    }),
  ),
  /** A plain-text version to paste into a donor's template. */
  narrative: z.string(),
});
export type DonorReport = z.infer<typeof DonorReport>;

export const RegulatorReturn = z.object({
  status: z.literal('draft'),
  notice: z.string(),
  periodEnd: IsoDate,
  lines: z.array(z.object({ code: z.string(), label: z.string(), valueMinor: z.number() })),
});
export type RegulatorReturn = z.infer<typeof RegulatorReturn>;

/* ------------------------------------------------------------------------ complaints */

export const COMPLAINT_SOURCES = [
  { code: 'client', label: 'Client' },
  { code: 'member', label: 'Policy holder' },
  { code: 'public', label: 'Member of the public' },
  { code: 'staff', label: 'Staff' },
] as const;

export const Complaint = z.object({
  id: z.string(),
  number: z.string(),
  source: z.string(),
  complainant: z.string(),
  subject: z.string(),
  details: z.string(),
  caseReference: z.string().nullable(),
  receivedOn: IsoDate,
  dueOn: IsoDate,
  status: z.enum(['open', 'answered']),
  overdue: z.boolean(),
  answer: z.string().nullable(),
  answeredOn: IsoDate.nullable(),
  loggedByName: z.string(),
  version: z.number(),
});
export type Complaint = z.infer<typeof Complaint>;

export const ComplaintCreate = z.strictObject({
  source: z.enum(COMPLAINT_SOURCES.map((s) => s.code) as [string, ...string[]], {
    error: 'Choose who is complaining',
  }),
  complainant: Text(2, 120, 'Enter who is complaining'),
  subject: Text(3, 160, 'Enter what the complaint is about'),
  details: Text(5, 4000, 'Describe the complaint'),
  caseReference: z.string().trim().max(40).optional(),
});
export type ComplaintCreate = z.infer<typeof ComplaintCreate>;

export const ComplaintAnswer = z.strictObject({
  answer: Text(5, 4000, 'Write the answer that was given'),
});
export type ComplaintAnswer = z.infer<typeof ComplaintAnswer>;

export const ComplaintsOverview = z.object({
  items: z.array(Complaint),
  openCount: z.number(),
  overdueCount: z.number(),
  actions: Actions,
});
export type ComplaintsOverview = z.infer<typeof ComplaintsOverview>;

/* ----------------------------------------------------------------- governance, incidents */

export const INCIDENT_KINDS = [
  { code: 'security', label: 'Security' },
  { code: 'privacy', label: 'Privacy' },
  { code: 'safety', label: 'Safety' },
  { code: 'conduct', label: 'Conduct' },
  { code: 'other', label: 'Other' },
] as const;

export const Incident = z.object({
  id: z.string(),
  kind: z.string(),
  severity: z.enum(['low', 'medium', 'high']),
  description: z.string(),
  occurredOn: IsoDate,
  status: z.enum(['open', 'resolved']),
  resolution: z.string().nullable(),
  reportedByName: z.string(),
  mine: z.boolean(),
});
export type Incident = z.infer<typeof Incident>;

export const IncidentCreate = z.strictObject({
  kind: z.enum(INCIDENT_KINDS.map((k) => k.code) as [string, ...string[]], {
    error: 'Choose the kind of incident',
  }),
  severity: z.enum(['low', 'medium', 'high'], { error: 'Choose how serious it is' }),
  description: Text(5, 4000, 'Describe what happened'),
  occurredOn: IsoDate,
});
export type IncidentCreate = z.infer<typeof IncidentCreate>;

export const IncidentResolve = z.strictObject({
  resolution: Text(5, 2000, 'Write how it was resolved'),
});
export type IncidentResolve = z.infer<typeof IncidentResolve>;

export const GOVERNANCE_KINDS = [
  { code: 'meeting', label: 'Meeting' },
  { code: 'policy', label: 'Policy' },
  { code: 'risk', label: 'Risk' },
] as const;

export const GovernanceItem = z.object({
  id: z.string(),
  kind: z.enum(['meeting', 'policy', 'risk']),
  title: z.string(),
  date: IsoDate,
  owner: z.string(),
  notes: z.string(),
  /** Meetings: held or planned. Policies: current or under review. Risks: low, medium or high. */
  state: z.string(),
});
export type GovernanceItem = z.infer<typeof GovernanceItem>;

export const GovernanceCreate = z.strictObject({
  kind: z.enum(['meeting', 'policy', 'risk'], { error: 'Choose what to record' }),
  title: Text(3, 160, 'Enter a title'),
  date: IsoDate,
  owner: Text(2, 120, 'Enter who is responsible'),
  notes: z.string().trim().max(4000).default(''),
  state: Text(2, 40, 'Enter the state'),
});
export type GovernanceCreate = z.infer<typeof GovernanceCreate>;

export const GovernanceOverview = z.object({
  incidents: z.array(Incident),
  items: z.array(GovernanceItem),
  actions: Actions,
});
export type GovernanceOverview = z.infer<typeof GovernanceOverview>;

/* ---------------------------------------------------------------------- data requests */

export const DataRequest = z.object({
  id: z.string(),
  number: z.string(),
  kind: z.enum(['access', 'correction', 'erasure', 'objection']),
  requester: z.string(),
  clientId: z.string().nullable(),
  receivedOn: IsoDate,
  dueOn: IsoDate,
  status: z.enum(['open', 'completed', 'refused']),
  daysLeft: z.number(),
  overdue: z.boolean(),
  outcome: z.string().nullable(),
  version: z.number(),
});
export type DataRequest = z.infer<typeof DataRequest>;

export const DataRequestCreate = z.strictObject({
  kind: z.enum(['access', 'correction', 'erasure', 'objection'], {
    error: 'Choose the kind of request',
  }),
  requester: Text(2, 120, 'Enter who is asking'),
  clientId: z.string().trim().max(60).optional(),
});
export type DataRequestCreate = z.infer<typeof DataRequestCreate>;

export const DataRequestClose = z.strictObject({
  outcome: z.enum(['completed', 'refused'], { error: 'Choose the outcome' }),
  note: Text(5, 2000, 'Say what was done or why it was refused'),
});
export type DataRequestClose = z.infer<typeof DataRequestClose>;

export const RetentionRun = z.object({
  ranOn: IsoDate,
  retentionYears: z.number(),
  cutoff: IsoDate,
  /** Closed cases older than the cutoff. Nothing is deleted until the owner decides D-25. */
  candidates: z.array(z.object({ caseId: z.string(), reference: z.string(), closedOn: IsoDate })),
  applied: z.literal(false),
});
export type RetentionRun = z.infer<typeof RetentionRun>;

/* ------------------------------------------------------------------------- audit log */

export const AuditQuery = z.strictObject({
  action: z.string().max(80).optional(),
  actor: z.string().max(80).optional(),
  from: IsoDate.optional(),
  to: IsoDate.optional(),
  ...PageQuery,
});
export type AuditQuery = z.infer<typeof AuditQuery>;

export const AuditEntry = z.object({
  seq: z.number(),
  at: z.string(),
  action: z.string(),
  actorId: z.string(),
  actorName: z.string(),
  targetId: z.string().nullable(),
  requestId: z.string().nullable(),
  hash: z.string(),
});
export type AuditEntry = z.infer<typeof AuditEntry>;

export const AuditVerification = z.object({
  ok: z.boolean(),
  checked: z.number(),
  /** The first entry whose hash does not match, when the chain is broken. */
  brokenAt: z.number().nullable(),
  verifiedAt: z.string(),
});
export type AuditVerification = z.infer<typeof AuditVerification>;

/* ----------------------------------------------------------------------------- settings */

export const SettingItem = z.object({
  key: z.string(),
  group: z.string(),
  label: z.string(),
  kind: z.enum(['money', 'number', 'boolean', 'text']),
  value: z.union([z.number(), z.boolean(), z.string()]),
  help: z.string(),
  changedOn: IsoDate.nullable(),
  changedByName: z.string().nullable(),
  reason: z.string().nullable(),
});
export type SettingItem = z.infer<typeof SettingItem>;

export const SettingChange = z.strictObject({
  value: z.union([z.number(), z.boolean(), z.string().max(500)]),
  reason: Reason,
});
export type SettingChange = z.infer<typeof SettingChange>;

export const SettingsOverview = z.object({
  items: z.array(SettingItem),
  actions: Actions,
});
export type SettingsOverview = z.infer<typeof SettingsOverview>;

/* ----------------------------------------------------------------------------- exports */

export const EXPORT_DATASETS = [
  { code: 'cases', label: 'Cases', permission: 'case.export' },
  { code: 'hearings', label: 'Hearings', permission: 'hearing.export' },
  { code: 'tasks', label: 'Tasks', permission: 'task.export' },
  { code: 'referrals', label: 'Referrals', permission: 'referral.export' },
  { code: 'policies', label: 'Policies', permission: 'report.insurance.read' },
  { code: 'claims', label: 'Claims', permission: 'report.insurance.read' },
  { code: 'expense_claims', label: 'Expense claims', permission: 'expense.read' },
  { code: 'complaints', label: 'Complaints', permission: 'complaint.read' },
  { code: 'audit', label: 'Audit log', permission: 'audit.read' },
  { code: 'all', label: 'Everything (restricted)', permission: 'system.exportAll' },
] as const;

export const ExportCreate = z.strictObject({
  dataset: z.enum(EXPORT_DATASETS.map((d) => d.code) as [string, ...string[]], {
    error: 'Choose what to export',
  }),
  reason: Reason,
});
export type ExportCreate = z.infer<typeof ExportCreate>;

export const ExportRecord = z.object({
  id: z.string(),
  dataset: z.string(),
  format: z.literal('csv'),
  rows: z.number(),
  status: z.enum(['ready', 'awaiting_approval', 'refused']),
  requestedByName: z.string(),
  approvedByName: z.string().nullable(),
  reason: z.string(),
  requestedOn: z.string(),
  filename: z.string().nullable(),
});
export type ExportRecord = z.infer<typeof ExportRecord>;

export const ExportFile = z.object({
  filename: z.string(),
  content: z.string(),
  rows: z.number(),
});
export type ExportFile = z.infer<typeof ExportFile>;

export const ExportResult = z.object({
  record: ExportRecord,
  /** The file itself, when it was made at once. A full export is collected after approval. */
  file: ExportFile.nullable(),
});
export type ExportResult = z.infer<typeof ExportResult>;

export const ExportsOverview = z.object({
  items: z.array(ExportRecord),
  datasets: z.array(z.object({ code: z.string(), label: z.string(), allowed: ActionState })),
});
export type ExportsOverview = z.infer<typeof ExportsOverview>;

/* ---------------------------------------------------------------------- reinsurance */

export const Treaty = z.object({
  id: z.string(),
  name: z.string(),
  reinsurer: z.string(),
  kind: z.enum(['quota_share', 'excess_of_loss']),
  /** Quota share: the share ceded, in percent. */
  sharePct: z.number(),
  /** Excess of loss: the insurer keeps this much of each claim. */
  retentionMinor: Minor,
  startsOn: IsoDate,
  endsOn: IsoDate,
  active: z.boolean(),
});
export type Treaty = z.infer<typeof Treaty>;

export const TreatyCreate = z.strictObject({
  name: Text(3, 120, 'Enter a name for the treaty'),
  reinsurer: Text(2, 120, 'Enter the reinsurer'),
  kind: z.enum(['quota_share', 'excess_of_loss'], { error: 'Choose the kind of treaty' }),
  sharePct: z.number().min(0).max(100).default(0),
  retentionMinor: Minor.default(0),
  startsOn: IsoDate,
  endsOn: IsoDate,
});
export type TreatyCreate = z.infer<typeof TreatyCreate>;

export const LargeClaimNotice = z.object({
  id: z.string(),
  claimId: z.string(),
  claimNumber: z.string(),
  reserveMinor: Minor,
  treatyId: z.string().nullable(),
  treatyName: z.string().nullable(),
  status: z.enum(['to_notify', 'notified', 'acknowledged']),
  notifiedOn: IsoDate.nullable(),
});
export type LargeClaimNotice = z.infer<typeof LargeClaimNotice>;

export const NoticeSend = z.strictObject({
  treatyId: z.string().min(1, 'Choose the treaty'),
});
export type NoticeSend = z.infer<typeof NoticeSend>;

export const Recovery = z.object({
  id: z.string(),
  claimNumber: z.string(),
  treatyName: z.string(),
  expectedMinor: Minor,
  receivedMinor: Minor,
  status: z.enum(['expected', 'part_received', 'received']),
});
export type Recovery = z.infer<typeof Recovery>;

export const RecoveryReceipt = z.strictObject({
  amountMinor: z.number().int().min(1, 'Enter the amount received').max(100_000_000_00),
  reference: Text(3, 80, 'Enter the payment reference'),
});
export type RecoveryReceipt = z.infer<typeof RecoveryReceipt>;

export const ReinsuranceStatement = z.object({
  treatyId: z.string(),
  treatyName: z.string(),
  quarter: z.string(),
  premiumCededMinor: Minor,
  recoveriesExpectedMinor: Minor,
  recoveriesReceivedMinor: Minor,
  /** Positive: the reinsurer owes the insurer. */
  balanceMinor: z.number().int(),
});
export type ReinsuranceStatement = z.infer<typeof ReinsuranceStatement>;

export const ReinsuranceOverview = z.object({
  treaties: z.array(Treaty),
  notices: z.array(LargeClaimNotice),
  recoveries: z.array(Recovery),
  statements: z.array(ReinsuranceStatement),
  largeClaimThresholdMinor: Minor,
  actions: Actions,
});
export type ReinsuranceOverview = z.infer<typeof ReinsuranceOverview>;

/* ------------------------------------------------------------------ reserves, solvency */

export const ReserveAssumptions = z.object({
  /** Claims incurred but not yet reported, as a percent of premium received in the last year. */
  ibnrPct: z.number(),
  /** Required capital, as a percent of premium received in the last year. */
  capitalPct: z.number(),
  capitalFloorMinor: Minor,
  /** What the owner and actuary say the insurer holds against the requirement. */
  availableCapitalMinor: Minor,
});
export type ReserveAssumptions = z.infer<typeof ReserveAssumptions>;

export const ReserveAssumptionsUpdate = z.strictObject({
  ibnrPct: z.number().min(0).max(100),
  capitalPct: z.number().min(0).max(200),
  capitalFloorMinor: Minor,
  availableCapitalMinor: Minor,
  reason: Reason,
});
export type ReserveAssumptionsUpdate = z.infer<typeof ReserveAssumptionsUpdate>;

export const ReservesView = z.object({
  asOf: IsoDate,
  assumptions: ReserveAssumptions,
  premiumLast12MonthsMinor: Minor,
  caseReservesMinor: Minor,
  ibnrMinor: Minor,
  totalReservesMinor: Minor,
  requiredCapitalMinor: Minor,
  /** Available capital over required capital; null when nothing is required. */
  solvencyRatio: z.number().nullable(),
  solvent: z.boolean(),
  actions: Actions,
});
export type ReservesView = z.infer<typeof ReservesView>;

export const ForecastQuery = z.strictObject({
  growthPct: z.coerce.number().min(-100).max(500).default(0),
  claimsRatioPct: z.coerce.number().min(0).max(300).default(0),
});
export type ForecastQuery = z.infer<typeof ForecastQuery>;

export const CoverReports = z.object({
  asOf: IsoDate,
  policies: z.array(
    z.object({ product: z.string(), live: z.number(), lapsed: z.number(), cancelled: z.number() }),
  ),
  premiumByMonth: z.array(z.object({ month: z.string(), receivedMinor: Minor })),
  claims: z.object({
    registered: z.number(),
    accepted: z.number(),
    declined: z.number(),
    closed: z.number(),
    incurredMinor: Minor,
  }),
  premiumLast12MonthsMinor: Minor,
  /** Incurred claim cost over premium received in the last 12 months. */
  lossRatioPct: z.number().nullable(),
  forecast: z.object({
    growthPct: z.number(),
    claimsRatioPct: z.number(),
    premiumMinor: Minor,
    claimsMinor: Minor,
    marginMinor: z.number().int(),
  }),
});
export type CoverReports = z.infer<typeof CoverReports>;
