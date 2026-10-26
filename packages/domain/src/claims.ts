import { z } from 'zod';
import { IsoDate, Reason } from './fields.js';
import { CoverCheck, KycStatus } from './cover.js';
import { ActionState, PageQuery } from './legal.js';

/* ------------------------------------------------------------------------------------------
 * Claims (Phase 5; BR-41 to BR-45)
 * ---------------------------------------------------------------------------------------- */

const Minor = z.number().int().min(0).max(100_000_000_00);

export const CLAIM_STATUSES = [
  { code: 'registered', label: 'Registered' },
  { code: 'accepted', label: 'Accepted' },
  { code: 'declined', label: 'Declined' },
  { code: 'closed', label: 'Closed' },
] as const;
export const ClaimStatus = z.enum(CLAIM_STATUSES.map((s) => s.code) as [string, ...string[]]);
export type ClaimStatus = z.infer<typeof ClaimStatus>;

export const CLAIM_CHECK_STATUSES = [
  { code: 'open', label: 'To check' },
  { code: 'cleared', label: 'Cleared' },
  { code: 'confirmed_fraud', label: 'Confirmed fraud' },
] as const;
export const ClaimCheckStatus = z.enum(
  CLAIM_CHECK_STATUSES.map((s) => s.code) as [string, ...string[]],
);

export const WarningSign = z.object({
  code: z.string(),
  message: z.string(),
  hint: z.boolean(),
});
export type WarningSign = z.infer<typeof WarningSign>;

export const ClaimListQuery = z.strictObject({
  ...PageQuery,
  status: ClaimStatus.optional(),
  q: z.string().trim().max(100).optional(),
});
export type ClaimListQuery = z.infer<typeof ClaimListQuery>;

export const ClaimSummary = z.object({
  id: z.string(),
  number: z.string(),
  caseId: z.string(),
  caseReference: z.string(),
  clientName: z.string(),
  matterType: z.string(),
  policyId: z.string(),
  policyNumber: z.string(),
  personName: z.string(),
  status: ClaimStatus,
  registeredOn: IsoDate,
  reserveMinor: Minor,
  costMinor: Minor,
  warningCount: z.number().int(),
  checkStatus: ClaimCheckStatus,
});
export type ClaimSummary = z.infer<typeof ClaimSummary>;

export const HourEntry = z.object({
  id: z.string(),
  hours: z.number(),
  workDate: IsoDate,
  note: z.string().nullable(),
  rateMinor: Minor,
  byName: z.string(),
});
export type HourEntry = z.infer<typeof HourEntry>;

export const ReserveChangeRow = z.object({
  id: z.string(),
  fromMinor: Minor,
  toMinor: Minor,
  reason: z.string(),
  exception: z.boolean(),
  byName: z.string(),
  at: z.number(),
});
export type ReserveChangeRow = z.infer<typeof ReserveChangeRow>;

export const PANEL_INVOICE_STATUSES = [
  { code: 'received', label: 'Received' },
  { code: 'queried', label: 'Queried' },
  { code: 'approved', label: 'Approved' },
  { code: 'paid', label: 'Paid' },
] as const;

export const PanelFirm = z.object({
  id: z.string(),
  name: z.string(),
  matterTypes: z.array(z.string()),
  rateMinor: Minor,
  rating: z.number(),
});
export type PanelFirm = z.infer<typeof PanelFirm>;

export const InvoiceFlag = z.object({ code: z.string(), message: z.string() });

export const PanelInvoice = z.object({
  id: z.string(),
  claimId: z.string(),
  claimNumber: z.string(),
  firmId: z.string(),
  firmName: z.string(),
  invoiceDate: IsoDate,
  hours: z.number().nullable(),
  amountMinor: Minor,
  description: z.string(),
  status: z.enum(PANEL_INVOICE_STATUSES.map((s) => s.code) as [string, ...string[]]),
  flags: z.array(InvoiceFlag),
  query: z.string().nullable(),
  approvedByName: z.string().nullable(),
  paidOn: IsoDate.nullable(),
  actions: z.record(z.string(), ActionState),
});
export type PanelInvoice = z.infer<typeof PanelInvoice>;

export const CASE_EXPENSE_CATEGORIES = [
  { code: 'transport', label: 'Transport' },
  { code: 'court_fees', label: 'Court fees' },
  { code: 'copies', label: 'Copies and printing' },
  { code: 'accommodation', label: 'Accommodation' },
  { code: 'other', label: 'Other' },
] as const;

export const EXPENSE_STATUSES = [
  { code: 'pending', label: 'Waiting for approval' },
  { code: 'approved', label: 'Approved' },
  { code: 'paid', label: 'Paid' },
  { code: 'rejected', label: 'Rejected' },
] as const;

export const Expense = z.object({
  id: z.string(),
  caseId: z.string(),
  caseReference: z.string(),
  category: z.string(),
  description: z.string(),
  amountMinor: Minor,
  incurredOn: IsoDate,
  receiptRef: z.string().nullable(),
  status: z.enum(EXPENSE_STATUSES.map((s) => s.code) as [string, ...string[]]),
  createdByName: z.string(),
  decidedByName: z.string().nullable(),
  rejectReason: z.string().nullable(),
  paidOn: IsoDate.nullable(),
  actions: z.record(z.string(), ActionState),
});
export type Expense = z.infer<typeof Expense>;

/** Receipts are required above $10 (A section 4.3). */
export const RECEIPT_THRESHOLD_MINOR = 10_00;

export const ExpenseCreate = z
  .strictObject({
    category: z.enum(CASE_EXPENSE_CATEGORIES.map((c) => c.code) as [string, ...string[]], {
      error: 'Choose a category',
    }),
    description: z.string().trim().min(3, 'Say what it was for').max(300),
    amountMinor: z.number().int().min(1, 'Enter the amount').max(10_000_00),
    incurredOn: IsoDate,
    receiptRef: z.preprocess(
      (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
      z.string().trim().min(2).max(64).optional(),
    ) as unknown as z.ZodOptional<z.ZodString>,
  })
  .refine((e) => e.amountMinor <= RECEIPT_THRESHOLD_MINOR || Boolean(e.receiptRef), {
    message: 'Add the receipt number: receipts are needed above $10.',
    path: ['receiptRef'],
  });
export type ExpenseCreate = z.infer<typeof ExpenseCreate>;
export type ExpenseCreateInput = z.input<typeof ExpenseCreate>;

export const ExpenseDecision = z.discriminatedUnion('decision', [
  z.strictObject({ decision: z.literal('approve') }),
  z.strictObject({ decision: z.literal('reject'), reason: Reason }),
]);
export type ExpenseDecision = z.infer<typeof ExpenseDecision>;

export const PaymentDetails = z.strictObject({
  method: z.enum(['cash', 'bank_transfer', 'ecocash', 'onemoney'], {
    error: 'Choose how it was paid',
  }),
  reference: z.string().trim().min(3, 'Add the payment reference').max(64),
});
export type PaymentDetails = z.infer<typeof PaymentDetails>;

export const ClaimDetail = ClaimSummary.extend({
  version: z.number().int(),
  holderName: z.string(),
  productName: z.string(),
  perMatterLimitMinor: Minor,
  remainingMinor: Minor,
  registeredByName: z.string(),
  decidedByName: z.string().nullable(),
  decidedOn: IsoDate.nullable(),
  declineReason: z.string().nullable(),
  decisionReason: z.string().nullable(),
  closedOn: IsoDate.nullable(),
  note: z.string().nullable(),
  cost: z.object({
    expensesMinor: Minor,
    hoursMinor: Minor,
    invoicesMinor: Minor,
    recoveredMinor: Minor,
  }),
  hours: z.array(HourEntry),
  reserveChanges: z.array(ReserveChangeRow),
  invoices: z.array(PanelInvoice),
  panelFirm: PanelFirm.nullable(),
  warnings: z.array(WarningSign),
  kyc: KycStatus,
  cover: CoverCheck.nullable(),
  checkNotes: z.string().nullable(),
  notifyReinsurers: z.boolean(),
  actions: z.record(z.string(), ActionState),
});
export type ClaimDetail = z.infer<typeof ClaimDetail>;

export const ClaimRegister = z.strictObject({
  registerAnyway: z.boolean().optional(),
  note: z.string().trim().max(1000).optional(),
});
export type ClaimRegister = z.infer<typeof ClaimRegister>;

export const CLAIM_CONFIRMATIONS = ['missingKyc', 'warningSigns', 'coverCheckFailed'] as const;
export const ClaimDecision = z.discriminatedUnion('decision', [
  z.strictObject({
    decision: z.literal('accept'),
    confirmations: z
      .strictObject({
        missingKyc: z.boolean().optional(),
        warningSigns: z.boolean().optional(),
        coverCheckFailed: z.boolean().optional(),
      })
      .default({}),
    reason: Reason.optional(),
  }),
  z.strictObject({ decision: z.literal('decline'), reason: Reason }),
]);
export type ClaimDecision = z.infer<typeof ClaimDecision>;
export type ClaimDecisionInput = z.input<typeof ClaimDecision>;

export const ReserveChange = z.strictObject({
  reserveMinor: z.number().int().min(1, 'Enter the reserve').max(100_000_000_00),
  reason: Reason,
  /** Confirms that raising the reserve above the limit for one matter is an exception (BR-42). */
  exception: z.boolean().default(false),
});
export type ReserveChange = z.infer<typeof ReserveChange>;
export type ReserveChangeInput = z.input<typeof ReserveChange>;

export const HourLog = z.strictObject({
  hours: z.number().min(0.5, 'At least half an hour').max(24, 'At most 24 hours in one entry'),
  workDate: IsoDate,
  note: z.string().trim().max(300).optional(),
});
export type HourLog = z.infer<typeof HourLog>;

export const PanelAssign = z.strictObject({ firmId: z.string().nullable() });
export type PanelAssign = z.infer<typeof PanelAssign>;

export const ClaimClosure = z.strictObject({ note: z.string().trim().max(1000).optional() });
export type ClaimClosure = z.infer<typeof ClaimClosure>;

export const ClaimCheckUpdate = z.strictObject({
  status: ClaimCheckStatus,
  notes: z.string().trim().max(1000).default(''),
});
export type ClaimCheckUpdate = z.infer<typeof ClaimCheckUpdate>;

export const ClaimCheckRow = z.object({
  claim: ClaimSummary,
  warnings: z.array(WarningSign),
  checkNotes: z.string().nullable(),
});
export type ClaimCheckRow = z.infer<typeof ClaimCheckRow>;

export const PanelInvoiceCreate = z.strictObject({
  claimId: z.string().min(1, 'Choose the claim'),
  invoiceDate: IsoDate,
  hours: z.number().min(0.5).max(1000).optional(),
  amountMinor: z.number().int().min(1, 'Enter the amount').max(100_000_000_00),
  description: z.string().trim().min(3, 'Say what the invoice is for').max(300),
});
export type PanelInvoiceCreate = z.infer<typeof PanelInvoiceCreate>;

export const PanelInvoiceStatusChange = z.strictObject({
  status: z.enum(['approved', 'queried', 'paid']),
  query: z.string().trim().min(3).max(500).optional(),
  /** Approving despite warning flags needs this (BR-45). */
  confirmFlags: z.boolean().optional(),
  payment: PaymentDetails.optional(),
});
export type PanelInvoiceStatusChange = z.infer<typeof PanelInvoiceStatusChange>;

export const PanelInvoiceListQuery = z.strictObject({
  ...PageQuery,
  status: z.enum(PANEL_INVOICE_STATUSES.map((s) => s.code) as [string, ...string[]]).optional(),
});
export type PanelInvoiceListQuery = z.infer<typeof PanelInvoiceListQuery>;

export const PanelOverview = z.object({
  firms: z.array(PanelFirm),
  invoices: z.object({
    items: z.array(PanelInvoice),
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
  }),
});
export type PanelOverview = z.infer<typeof PanelOverview>;
