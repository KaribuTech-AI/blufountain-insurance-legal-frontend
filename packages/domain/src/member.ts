import { z } from 'zod';
import { IsoDate, Phone, Reason } from './fields.js';
import { PublicLanguage } from './public.js';

/* ------------------------------------------------------------------------------------------
 * Member accounts (docs/member-portal-design.md). A member signs in with a phone number and
 * reaches everything that belongs to them. Each shape here is what the member (or the staff
 * member helping them) may see, and nothing else.
 * ---------------------------------------------------------------------------------------- */

/* ------------------------------------------------------------------------- sign in */

export const MemberCodeRequest = z.strictObject({
  phone: Phone,
  challenge: z.string().min(10).max(200),
  /** A hidden field real people never fill in. A script that does gets a quiet fake success. */
  website: z.string().max(200).optional(),
});
export type MemberCodeRequest = z.infer<typeof MemberCodeRequest>;

export const MemberVerify = z.strictObject({
  phone: Phone,
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter the 6 digit code'),
  /** On a phone or computer other people use: the session is much shorter. */
  sharedDevice: z.boolean().default(false),
});
export type MemberVerify = z.infer<typeof MemberVerify>;

export const MemberChoice = z.object({
  /** Meaningful only inside the pending sign in; not a client id. */
  choice: z.string(),
  firstName: z.string(),
});
export type MemberChoice = z.infer<typeof MemberChoice>;

export const MemberSignedIn = z.object({
  status: z.literal('signed_in'),
  /** Kept in memory by the page and sent as `Authorization: Bearer`. Never stored. */
  token: z.string(),
  expiresInSeconds: z.number(),
});
export type MemberSignedIn = z.infer<typeof MemberSignedIn>;

export const MemberIdentityRequired = z.object({
  status: z.literal('identity_required'),
  /** Works only for the identity step, for a few minutes. */
  pendingToken: z.string(),
  choices: z.array(MemberChoice),
  expiresInSeconds: z.number(),
});
export type MemberIdentityRequired = z.infer<typeof MemberIdentityRequired>;

export const MemberVerified = z.discriminatedUnion('status', [
  MemberSignedIn,
  MemberIdentityRequired,
]);
export type MemberVerified = z.infer<typeof MemberVerified>;

export const MemberIdentity = z.strictObject({
  pendingToken: z.string().min(20).max(100),
  choice: z.string().min(1).max(20),
  /** The last 4 letters and digits of the national ID number. */
  idLast4: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{4}$/, 'Enter the last 4 characters of your ID number'),
  sharedDevice: z.boolean().default(false),
});
export type MemberIdentity = z.infer<typeof MemberIdentity>;

/* ------------------------------------------------------------------------- profile */

export const MEMBER_ACCOUNT_STATUSES = ['invited', 'active', 'locked', 'closed'] as const;
export const MemberAccountStatus = z.enum(MEMBER_ACCOUNT_STATUSES);
export type MemberAccountStatus = z.infer<typeof MemberAccountStatus>;

export const MemberProfile = z.object({
  firstName: z.string(),
  fullName: z.string(),
  /** Only the last 3 digits, so a borrowed screen does not give the number away. */
  phoneHint: z.string(),
  language: PublicLanguage,
  lastSignInAt: z.string().nullable(),
  sharedDevice: z.boolean(),
  /** The member has accepted the current privacy notice. */
  consentAccepted: z.boolean(),
});
export type MemberProfile = z.infer<typeof MemberProfile>;

export const MemberProfileUpdate = z.strictObject({
  language: PublicLanguage,
});
export type MemberProfileUpdate = z.infer<typeof MemberProfileUpdate>;

/* ------------------------------------------------------------- staff: portal access */

export const MemberAccountSummary = z.object({
  /** False when the client has never been invited and never signed in. */
  exists: z.boolean(),
  status: MemberAccountStatus.nullable(),
  createdVia: z.enum(['self', 'invite', 'staff']).nullable(),
  phoneVerifiedAt: z.string().nullable(),
  lastSignInAt: z.string().nullable(),
  language: PublicLanguage.nullable(),
  activeSessions: z.number().int(),
  /** False when a safety concern means no code or message may be sent (BR-16). */
  canContact: z.boolean(),
});
export type MemberAccountSummary = z.infer<typeof MemberAccountSummary>;

/* ------------------------------------------------------------------ staff: member list */

export const MemberListQuery = z.object({
  q: z.string().trim().max(80).optional(),
  /** `none` is a policyholder who has never signed in. */
  status: z.enum(['none', ...MEMBER_ACCOUNT_STATUSES]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});
export type MemberListQuery = z.infer<typeof MemberListQuery>;

export const MemberListItem = z.object({
  clientId: z.string(),
  fullName: z.string(),
  phoneLast4: z.string().nullable(),
  status: z.enum(['none', ...MEMBER_ACCOUNT_STATUSES]),
  lastSignInAt: z.string().nullable(),
  policies: z.number().int(),
  cases: z.number().int(),
});
export type MemberListItem = z.infer<typeof MemberListItem>;

/* ---------------------------------------------------------------- sprint 4: requests etc */

export const TICKET_KINDS = [
  'callback',
  'claim',
  'legal_aid',
  'change_details',
  'add_dependant',
  'remove_dependant',
  'cancel',
  'link_case',
  'close_account',
  'general',
] as const;
export const TICKET_STATUSES = ['received', 'in_progress', 'done', 'declined'] as const;

/** What a member asks for. Staff answer it; the answer is part of the ticket. */
export const MemberTicketCreate = z
  .strictObject({
    kind: z.enum(TICKET_KINDS, { error: 'Choose what you are asking for' }),
    body: z.string().trim().min(10, 'Tell us a little more').max(1000),
    /** The policy it is about, when it is about one. */
    policyId: z.string().max(60).optional(),
    /** For link_case: the number of a case that is under another record. */
    caseReference: z.string().trim().min(5).max(40).optional(),
  })
  .refine((v) => v.kind !== 'link_case' || v.caseReference, {
    message: 'Enter the case number',
    path: ['caseReference'],
  });
export type MemberTicketCreate = z.infer<typeof MemberTicketCreate>;

export const MemberTicket = z.object({
  id: z.string(),
  kind: z.enum(TICKET_KINDS),
  status: z.enum(TICKET_STATUSES),
  body: z.string(),
  policyNumber: z.string().nullable(),
  caseReference: z.string().nullable(),
  /** The staff reply, in the member's words. */
  reply: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type MemberTicket = z.infer<typeof MemberTicket>;

export const StaffTicket = MemberTicket.extend({
  clientId: z.string(),
  clientName: z.string(),
  phoneLast4: z.string().nullable(),
  ownerName: z.string().nullable(),
  version: z.number().int(),
});
export type StaffTicket = z.infer<typeof StaffTicket>;

export const StaffTicketQuery = z.object({
  status: z.enum(['open', ...TICKET_STATUSES]).default('open'),
  kind: z.enum(TICKET_KINDS).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});
export type StaffTicketQuery = z.infer<typeof StaffTicketQuery>;

export const StaffReply = z.strictObject({
  reply: z.string().trim().min(3, 'Write the answer').max(1000),
  status: z.enum(['in_progress', 'done', 'declined']),
});
export type StaffReply = z.infer<typeof StaffReply>;

export const LinkDecision = z.strictObject({
  decision: z.enum(['approve', 'decline']),
  reason: Reason,
});
export type LinkDecision = z.infer<typeof LinkDecision>;

export const NOTIFY_TOPICS = ['premium', 'hearing', 'request', 'renewal'] as const;
export const MemberNotifyPrefs = z.strictObject({
  premium: z.boolean(),
  hearing: z.boolean(),
  request: z.boolean(),
  renewal: z.boolean(),
});
export type MemberNotifyPrefs = z.infer<typeof MemberNotifyPrefs>;

export const MemberPhoneChangeCode = z.strictObject({ newPhone: Phone });
export type MemberPhoneChangeCode = z.infer<typeof MemberPhoneChangeCode>;

export const MemberPhoneChange = z.strictObject({
  newPhone: Phone,
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter the 6 digit code'),
});
export type MemberPhoneChange = z.infer<typeof MemberPhoneChange>;

export const MemberConsent = z.strictObject({ accepted: z.literal(true) });
export type MemberConsent = z.infer<typeof MemberConsent>;

/** Staff: what they may do to a client's portal account. */
export const MemberAccountAction = z.strictObject({ reason: Reason });
export type MemberAccountAction = z.infer<typeof MemberAccountAction>;

export const MemberPhoneUpdate = z.strictObject({ phone: Phone, reason: Reason });
export type MemberPhoneUpdate = z.infer<typeof MemberPhoneUpdate>;

export const RecoveryCode = z.object({
  /** Shown once. Read it to the client; it works for 15 minutes. */
  code: z.string(),
  expiresInSeconds: z.number(),
});
export type RecoveryCode = z.infer<typeof RecoveryCode>;

export const ReminderRun = z.object({
  sent: z.number().int(),
  skipped: z.number().int(),
  /** True when it ran during quiet hours (20:00 to 07:00) and sent nothing. */
  quietHours: z.boolean(),
});
export type ReminderRun = z.infer<typeof ReminderRun>;

export const PhoneReport = z.object({
  clientsWithoutPhone: z.array(z.object({ clientId: z.string(), fullName: z.string() })),
  sharedPhones: z.array(
    z.object({
      phoneLast4: z.string(),
      people: z.array(
        z.object({ clientId: z.string(), fullName: z.string(), hasIdNumber: z.boolean() }),
      ),
    }),
  ),
});
export type PhoneReport = z.infer<typeof PhoneReport>;
