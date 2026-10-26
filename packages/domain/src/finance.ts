import { z } from 'zod';
import { IsoDate, Reason } from './fields.js';
import { ActionState, PageQuery } from './legal.js';

/* ------------------------------------------------------------------------------------------
 * Finance and office (Phase 8): expenses, petty cash, client money, grants, office
 * ---------------------------------------------------------------------------------------- */

const Minor = z.number().int().min(0).max(100_000_000_00);
const Positive = (message: string) => z.number().int().min(1, message).max(100_000_000_00);
const Actions = z.record(z.string(), ActionState);
const Text = (min: number, max: number, message: string) =>
  z.string().trim().min(min, message).max(max);
const opt = <T extends z.ZodType>(schema: T) =>
  z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    schema.optional(),
  ) as unknown as z.ZodOptional<T>;

export const FinanceListQuery = z.strictObject({
  q: z.string().trim().max(100).optional(),
  status: z.string().max(40).optional(),
  ...PageQuery,
});
export type FinanceListQuery = z.infer<typeof FinanceListQuery>;

export const PayDetails = z.strictObject({
  method: z.enum(['cash', 'bank_transfer', 'ecocash', 'onemoney'], {
    error: 'Choose how it was paid',
  }),
  reference: Text(3, 80, 'Enter the payment reference'),
});
export type PayDetails = z.infer<typeof PayDetails>;

/* ------------------------------------------------------------------- expense claims */

export const CLAIM_KINDS = [
  { code: 'mileage', label: 'Mileage' },
  { code: 'per_diem', label: 'Per diem' },
  { code: 'advance', label: 'Advance' },
  { code: 'other', label: 'Other expense' },
] as const;

export const ExpenseClaim = z.object({
  id: z.string(),
  kind: z.enum(['mileage', 'per_diem', 'advance', 'other']),
  caseId: z.string().nullable(),
  caseReference: z.string().nullable(),
  description: z.string(),
  amountMinor: Minor,
  currency: z.string(),
  originalMinor: Minor.nullable(),
  rate: z.number().nullable(),
  detail: z.string().nullable(),
  incurredOn: IsoDate,
  receiptRef: z.string().nullable(),
  status: z.enum(['pending', 'approved', 'paid', 'rejected', 'settled']),
  createdByName: z.string(),
  decidedByName: z.string().nullable(),
  rejectReason: z.string().nullable(),
  paidOn: IsoDate.nullable(),
  /** For an advance: what was spent, and what is still owed either way. */
  settledMinor: Minor.nullable(),
  /** Paid records cannot be changed. */
  locked: z.boolean(),
  actions: Actions,
});
export type ExpenseClaim = z.infer<typeof ExpenseClaim>;

export const ExpenseClaimListQuery = z.strictObject({
  kind: z.enum(['mileage', 'per_diem', 'advance', 'other']).optional(),
  mine: z.enum(['true']).optional(),
  ...FinanceListQuery.shape,
});
export type ExpenseClaimListQuery = z.infer<typeof ExpenseClaimListQuery>;

const claimBase = {
  caseId: opt(z.string()),
  incurredOn: IsoDate,
};

export const ExpenseClaimCreate = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('mileage'),
    ...claimBase,
    description: Text(3, 300, 'Say where you drove'),
    km: z.number().min(1, 'Enter the distance').max(5000),
  }),
  z.strictObject({
    kind: z.literal('per_diem'),
    ...claimBase,
    description: Text(3, 300, 'Say what the trip was for'),
    tripKind: z.enum(['day_trip', 'overnight']),
    days: z.number().int().min(1).max(30),
  }),
  z.strictObject({
    kind: z.literal('advance'),
    ...claimBase,
    description: Text(3, 300, 'Say what the advance is for'),
    amountMinor: Positive('Enter the amount'),
  }),
  z.strictObject({
    kind: z.literal('other'),
    ...claimBase,
    description: Text(3, 300, 'Say what it was for'),
    currency: z.enum(['USD', 'ZWG', 'ZAR']).default('USD'),
    /** Amount in the currency it was paid in. */
    amountMinor: Positive('Enter the amount'),
    /** US dollars per one unit of the other currency; required unless USD. */
    rate: z.number().positive().max(1000).optional(),
    receiptRef: opt(Text(2, 64, 'Enter the receipt number')),
  }),
]);
export type ExpenseClaimCreate = z.infer<typeof ExpenseClaimCreate>;
export type ExpenseClaimCreateInput = z.input<typeof ExpenseClaimCreate>;

export const ExpenseClaimUpdate = z.strictObject({
  description: opt(Text(3, 300, 'Say what it was for')),
  receiptRef: opt(Text(2, 64, 'Enter the receipt number')),
});
export type ExpenseClaimUpdate = z.infer<typeof ExpenseClaimUpdate>;

export const ExpenseClaimDecision = z.discriminatedUnion('decision', [
  z.strictObject({ decision: z.literal('approve') }),
  z.strictObject({ decision: z.literal('reject'), reason: Reason }),
]);
export type ExpenseClaimDecision = z.infer<typeof ExpenseClaimDecision>;

export const AdvanceSettlement = z.strictObject({
  spentMinor: z.number().int().min(0).max(100_000_000_00),
  receiptRef: opt(Text(2, 64, 'Too short')),
});
export type AdvanceSettlement = z.infer<typeof AdvanceSettlement>;

/* --------------------------------------------------------------------- office costs */

export const OfficeCost = z.object({
  id: z.string(),
  name: z.string(),
  payee: z.string(),
  amountMinor: Minor,
  frequency: z.enum(['monthly', 'quarterly', 'annual']),
  nextDueOn: IsoDate,
  lastPaidOn: IsoDate.nullable(),
  dueSoon: z.boolean(),
  actions: Actions,
});
export type OfficeCost = z.infer<typeof OfficeCost>;

export const OfficeCostCreate = z.strictObject({
  name: Text(3, 120, 'Name the cost'),
  payee: Text(2, 120, 'Who is paid?'),
  amountMinor: Positive('Enter the amount'),
  frequency: z.enum(['monthly', 'quarterly', 'annual']),
  nextDueOn: IsoDate,
});
export type OfficeCostCreate = z.infer<typeof OfficeCostCreate>;

/* ---------------------------------------------------------------------- petty cash */

export const PettyVoucher = z.object({
  id: z.string(),
  number: z.string(),
  payee: z.string(),
  purpose: z.string(),
  amountMinor: Minor,
  receiptRef: z.string().nullable(),
  status: z.enum(['pending', 'paid', 'rejected']),
  date: IsoDate,
  createdByName: z.string(),
  decidedByName: z.string().nullable(),
  rejectReason: z.string().nullable(),
  actions: Actions,
});
export type PettyVoucher = z.infer<typeof PettyVoucher>;

export const PettyCount = z.object({
  id: z.string(),
  date: IsoDate,
  expectedMinor: Minor,
  countedMinor: Minor,
  varianceMinor: z.number().int(),
  note: z.string().nullable(),
  countedByName: z.string(),
});

export const PettyTopUp = z.object({
  id: z.string(),
  date: IsoDate,
  amountMinor: Minor,
  reference: z.string(),
  byName: z.string(),
});

export const PettyCash = z.object({
  balanceMinor: Minor,
  floatMinor: Minor,
  approvalOverMinor: Minor,
  maxVoucherMinor: Minor,
  vouchers: z.array(PettyVoucher),
  counts: z.array(PettyCount),
  topUps: z.array(PettyTopUp),
  actions: Actions,
});
export type PettyCash = z.infer<typeof PettyCash>;

export const PettyVoucherCreate = z.strictObject({
  payee: Text(2, 120, 'Who was paid?'),
  purpose: Text(3, 300, 'Say what it was for'),
  amountMinor: Positive('Enter the amount'),
  receiptRef: opt(Text(2, 64, 'Enter the receipt number')),
});
export type PettyVoucherCreate = z.infer<typeof PettyVoucherCreate>;

export const PettyCountCreate = z.strictObject({
  countedMinor: z.number().int().min(0).max(100_000_00),
  note: opt(Text(3, 500, 'Too short')),
});
export type PettyCountCreate = z.infer<typeof PettyCountCreate>;

export const PettyTopUpCreate = z.strictObject({
  amountMinor: Positive('Enter the amount'),
  reference: Text(3, 80, 'Enter the reference'),
});
export type PettyTopUpCreate = z.infer<typeof PettyTopUpCreate>;

export const VoucherDecision = ExpenseClaimDecision;
export type VoucherDecision = ExpenseClaimDecision;

/* -------------------------------------------------------------------- client money */

export const ClientMoney = z.object({
  id: z.string(),
  caseId: z.string(),
  caseReference: z.string(),
  clientName: z.string(),
  payer: z.string(),
  amountMinor: Minor,
  reference: z.string(),
  receivedOn: IsoDate,
  status: z.enum(['held', 'paid']),
  daysHeld: z.number().int(),
  overdue: z.boolean(),
  paidTo: z.string().nullable(),
  paidOn: IsoDate.nullable(),
  receivedByName: z.string(),
  actions: Actions,
});
export type ClientMoney = z.infer<typeof ClientMoney>;

export const ClientMoneyOverview = z.object({
  heldMinor: Minor,
  overdueCount: z.number().int(),
  entries: z.array(ClientMoney),
  actions: Actions,
});
export type ClientMoneyOverview = z.infer<typeof ClientMoneyOverview>;

export const ClientMoneyReceipt = z.strictObject({
  caseId: z.string().min(1, 'Choose the case'),
  payer: Text(2, 160, 'Who paid it in?'),
  amountMinor: Positive('Enter the amount'),
  reference: Text(3, 80, 'Enter the receipt reference'),
  receivedOn: IsoDate.optional(),
});
export type ClientMoneyReceipt = z.infer<typeof ClientMoneyReceipt>;

export const ClientMoneyPayment = z.strictObject({
  payee: Text(2, 160, 'Who is it paid to?'),
  ...PayDetails.shape,
});
export type ClientMoneyPayment = z.infer<typeof ClientMoneyPayment>;

/* ------------------------------------------------------------------- contributions */

export const Contribution = z.object({
  id: z.string(),
  caseId: z.string(),
  caseReference: z.string(),
  clientName: z.string(),
  kind: z.enum(['payment', 'waiver']),
  amountMinor: Minor,
  receiptNo: z.string().nullable(),
  reason: z.string().nullable(),
  date: IsoDate,
  recordedByName: z.string(),
});
export type Contribution = z.infer<typeof Contribution>;

export const ContributionCreate = z.strictObject({
  caseId: z.string().min(1, 'Choose the case'),
  amountMinor: Positive('Enter the amount'),
  receiptNo: Text(2, 64, 'Enter the receipt number'),
  receivedOn: IsoDate.optional(),
});
export type ContributionCreate = z.infer<typeof ContributionCreate>;

export const ContributionWaiver = z.strictObject({
  caseId: z.string().min(1, 'Choose the case'),
  amountMinor: Positive('Enter the amount waived'),
  reason: Reason,
});
export type ContributionWaiver = z.infer<typeof ContributionWaiver>;

export const ContributionsOverview = z.object({
  receivedMinor: Minor,
  waivedMinor: Minor,
  rows: z.array(Contribution),
  actions: Actions,
});
export type ContributionsOverview = z.infer<typeof ContributionsOverview>;

/* -------------------------------------------------------------- grants and projects */

export const Grant = z.object({
  id: z.string(),
  donor: z.string(),
  name: z.string(),
  totalMinor: Minor,
  allocatedMinor: Minor,
  spentMinor: Minor,
  remainingMinor: z.number().int(),
  startsOn: IsoDate,
  endsOn: IsoDate,
  restricted: z.boolean(),
  status: z.enum(['active', 'ended']),
});
export type Grant = z.infer<typeof Grant>;

export const GrantCreate = z
  .strictObject({
    donor: Text(2, 120, 'Who is the donor?'),
    name: Text(3, 160, 'Name the grant'),
    totalMinor: Positive('Enter the amount'),
    startsOn: IsoDate,
    endsOn: IsoDate,
    restricted: z.boolean().default(false),
  })
  .refine((g) => g.endsOn > g.startsOn, {
    message: 'The end date must be after the start.',
    path: ['endsOn'],
  });
export type GrantCreate = z.infer<typeof GrantCreate>;

export const Project = z.object({
  id: z.string(),
  name: z.string(),
  grantId: z.string().nullable(),
  grantName: z.string().nullable(),
  budgetMinor: Minor,
  spentMinor: Minor,
  startsOn: IsoDate,
  endsOn: IsoDate,
  targetCases: z.number().int(),
  outputs: z.object({
    casesOpened: z.number().int(),
    casesClosed: z.number().int(),
    adviceGiven: z.number().int(),
    clinicsHeld: z.number().int(),
  }),
  /** Share of the case target reached, as a whole percentage. */
  progressPct: z.number().int(),
  spend: z.array(
    z.object({ id: z.string(), description: z.string(), amountMinor: Minor, spentOn: IsoDate }),
  ),
  actions: Actions,
});
export type Project = z.infer<typeof Project>;

export const ProjectCreate = z
  .strictObject({
    name: Text(3, 160, 'Name the project'),
    grantId: opt(z.string()),
    budgetMinor: Positive('Enter the budget'),
    startsOn: IsoDate,
    endsOn: IsoDate,
    targetCases: z.number().int().min(1, 'Enter the target').max(100_000),
  })
  .refine((p) => p.endsOn > p.startsOn, {
    message: 'The end date must be after the start.',
    path: ['endsOn'],
  });
export type ProjectCreate = z.infer<typeof ProjectCreate>;

export const ProjectSpend = z.strictObject({
  description: Text(3, 300, 'Say what the money was for'),
  amountMinor: Positive('Enter the amount'),
  spentOn: IsoDate,
});
export type ProjectSpend = z.infer<typeof ProjectSpend>;

export const GrantsOverview = z.object({
  grants: z.array(Grant),
  actions: Actions,
});
export type GrantsOverview = z.infer<typeof GrantsOverview>;

/* ---------------------------------------------------------------------------- office */

export const TeamMember = z.object({
  id: z.string(),
  name: z.string(),
  officeId: z.string(),
  kind: z.enum(['staff', 'pro_bono_partner']),
  activeCases: z.number().int(),
  maxActiveCases: z.number().int(),
  onLeaveToday: z.boolean(),
  /** Hearings that fall inside approved leave. */
  leaveClashes: z.number().int(),
  proBonoHours: z.number(),
});
export type TeamMember = z.infer<typeof TeamMember>;

export const TeamView = z.object({ members: z.array(TeamMember), actions: Actions });
export type TeamView = z.infer<typeof TeamView>;

export const ProBonoHours = z.strictObject({
  lawyerId: z.string().min(1, 'Choose the partner'),
  hours: z.number().min(0.25, 'Enter the hours').max(24),
  on: IsoDate,
  note: opt(Text(2, 300, 'Too short')),
});
export type ProBonoHours = z.infer<typeof ProBonoHours>;

export const LEAVE_TYPES = [
  { code: 'annual', label: 'Annual leave' },
  { code: 'sick', label: 'Sick leave' },
  { code: 'study', label: 'Study leave' },
  { code: 'compassionate', label: 'Compassionate leave' },
] as const;

export const Leave = z.object({
  id: z.string(),
  userId: z.string(),
  personName: z.string(),
  type: z.string(),
  from: IsoDate,
  to: IsoDate,
  days: z.number().int(),
  reason: z.string().nullable(),
  status: z.enum(['pending', 'approved', 'rejected']),
  /** Hearings of this person's cases that fall inside the leave. */
  hearingClashes: z.number().int(),
  decidedByName: z.string().nullable(),
  rejectReason: z.string().nullable(),
  actions: Actions,
});
export type Leave = z.infer<typeof Leave>;

export const LeaveCreate = z
  .strictObject({
    type: z.enum(LEAVE_TYPES.map((t) => t.code) as [string, ...string[]], {
      error: 'Choose the kind of leave',
    }),
    from: IsoDate,
    to: IsoDate,
    reason: opt(Text(3, 300, 'Too short')),
  })
  .refine((l) => l.to >= l.from, {
    message: 'The last day cannot be before the first.',
    path: ['to'],
  });
export type LeaveCreate = z.infer<typeof LeaveCreate>;

export const LeaveDecision = z.discriminatedUnion('decision', [
  z.strictObject({
    decision: z.literal('approve'),
    /** Hearings fall inside the leave and the supervisor accepts that. */
    confirmClashes: z.boolean().default(false),
  }),
  z.strictObject({ decision: z.literal('reject'), reason: Reason }),
]);
export type LeaveDecision = z.infer<typeof LeaveDecision>;

export const Training = z.object({
  id: z.string(),
  userId: z.string(),
  personName: z.string(),
  title: z.string(),
  date: IsoDate,
  hours: z.number(),
});
export type Training = z.infer<typeof Training>;

export const TrainingCreate = z.strictObject({
  title: Text(3, 160, 'Name the training'),
  date: IsoDate,
  hours: z.number().min(0.5).max(80),
});
export type TrainingCreate = z.infer<typeof TrainingCreate>;

export const CheckIn = z.object({
  id: z.string(),
  personName: z.string(),
  date: IsoDate,
  wellbeing: z.enum(['well', 'support_needed']),
  note: z.string().nullable(),
  byName: z.string(),
});
export type CheckIn = z.infer<typeof CheckIn>;

export const CheckInCreate = z.strictObject({
  lawyerId: z.string().min(1, 'Choose the person'),
  date: IsoDate,
  wellbeing: z.enum(['well', 'support_needed']),
  note: opt(Text(3, 1000, 'Too short')),
});
export type CheckInCreate = z.infer<typeof CheckInCreate>;

export const HrOverview = z.object({
  leave: z.array(Leave),
  training: z.array(Training),
  checkIns: z.array(CheckIn),
  /** Annual leave days left for the signed-in person. */
  myAnnualLeft: z.number().int(),
  actions: Actions,
});
export type HrOverview = z.infer<typeof HrOverview>;

export const Vehicle = z.object({
  id: z.string(),
  registration: z.string(),
  description: z.string(),
  officeId: z.string(),
  nextServiceOn: IsoDate,
  serviceSoon: z.boolean(),
  bookings: z.array(
    z.object({
      id: z.string(),
      from: IsoDate,
      to: IsoDate,
      purpose: z.string(),
      bookedByName: z.string(),
      caseReference: z.string().nullable(),
      actions: Actions,
    }),
  ),
  actions: Actions,
});
export type Vehicle = z.infer<typeof Vehicle>;

export const VehicleCreate = z.strictObject({
  registration: Text(4, 20, 'Enter the registration'),
  description: Text(3, 120, 'Describe the vehicle'),
  nextServiceOn: IsoDate,
});
export type VehicleCreate = z.infer<typeof VehicleCreate>;

export const VehicleBookingCreate = z
  .strictObject({
    from: IsoDate,
    to: IsoDate,
    purpose: Text(3, 200, 'Say what the trip is for'),
    caseId: opt(z.string()),
  })
  .refine((b) => b.to >= b.from, {
    message: 'The last day cannot be before the first.',
    path: ['to'],
  });
export type VehicleBookingCreate = z.infer<typeof VehicleBookingCreate>;

export const Purchase = z.object({
  id: z.string(),
  number: z.string(),
  item: z.string(),
  supplier: z.string(),
  amountMinor: Minor,
  tier: z.enum(['none', 'quotes', 'board']),
  quotes: z.array(z.object({ supplier: z.string(), amountMinor: Minor })),
  status: z.enum(['pending', 'approved', 'rejected', 'received']),
  boardRef: z.string().nullable(),
  createdByName: z.string(),
  decidedByName: z.string().nullable(),
  rejectReason: z.string().nullable(),
  actions: Actions,
});
export type Purchase = z.infer<typeof Purchase>;

export const PurchaseCreate = z.strictObject({
  item: Text(3, 200, 'What is being bought?'),
  supplier: Text(2, 120, 'Who is it bought from?'),
  amountMinor: Positive('Enter the amount'),
  quotes: z
    .array(z.strictObject({ supplier: Text(2, 120, 'Supplier'), amountMinor: Positive('Amount') }))
    .max(6)
    .default([]),
});
export type PurchaseCreate = z.infer<typeof PurchaseCreate>;

export const PurchaseDecision = z.discriminatedUnion('decision', [
  z.strictObject({
    decision: z.literal('approve'),
    boardRef: opt(Text(3, 64, 'Enter the board minute')),
  }),
  z.strictObject({ decision: z.literal('reject'), reason: Reason }),
]);
export type PurchaseDecision = z.infer<typeof PurchaseDecision>;

export const Asset = z.object({
  id: z.string(),
  tag: z.string(),
  name: z.string(),
  category: z.string(),
  costMinor: Minor,
  location: z.string(),
  custodian: z.string().nullable(),
  status: z.enum(['in_use', 'disposed']),
  actions: Actions,
});
export type Asset = z.infer<typeof Asset>;

export const AssetCreate = z.strictObject({
  tag: Text(3, 30, 'Enter the asset tag'),
  name: Text(3, 160, 'Name the asset'),
  category: Text(3, 60, 'Enter the category'),
  costMinor: Positive('Enter the cost'),
  location: Text(2, 120, 'Where is it?'),
  custodian: opt(Text(2, 120, 'Too short')),
});
export type AssetCreate = z.infer<typeof AssetCreate>;

export const AssetMove = z.strictObject({
  location: Text(2, 120, 'Where is it now?'),
  custodian: opt(Text(2, 120, 'Too short')),
});
export type AssetMove = z.infer<typeof AssetMove>;

export const StockItem = z.object({
  id: z.string(),
  name: z.string(),
  unit: z.string(),
  onHand: z.number().int(),
  reorderAt: z.number().int(),
  low: z.boolean(),
  actions: Actions,
});
export type StockItem = z.infer<typeof StockItem>;

export const StockMovement = z.strictObject({
  delta: z
    .number()
    .int()
    .min(-10_000)
    .max(10_000)
    .refine((n) => n !== 0, 'Enter a number'),
  note: opt(Text(2, 200, 'Too short')),
});
export type StockMovement = z.infer<typeof StockMovement>;

export const AssetsOverview = z.object({
  assets: z.array(Asset),
  stock: z.array(StockItem),
  actions: Actions,
});
export type AssetsOverview = z.infer<typeof AssetsOverview>;

export const Contract = z.object({
  id: z.string(),
  title: z.string(),
  party: z.string(),
  kind: z.string(),
  startsOn: IsoDate,
  endsOn: IsoDate,
  valueMinor: Minor.nullable(),
  daysLeft: z.number().int(),
  status: z.enum(['active', 'expiring', 'expired']),
  actions: Actions,
});
export type Contract = z.infer<typeof Contract>;

export const ContractCreate = z
  .strictObject({
    title: Text(3, 160, 'Name the contract'),
    party: Text(2, 160, 'Who is it with?'),
    kind: Text(3, 60, 'Enter the kind'),
    startsOn: IsoDate,
    endsOn: IsoDate,
    valueMinor: z.number().int().min(1).max(100_000_000_00).optional(),
  })
  .refine((c) => c.endsOn > c.startsOn, {
    message: 'The end date must be after the start.',
    path: ['endsOn'],
  });
export type ContractCreate = z.infer<typeof ContractCreate>;

export const ContractRenew = z.strictObject({ endsOn: IsoDate });
export type ContractRenew = z.infer<typeof ContractRenew>;
