/**
 * Permission catalogue and role grants (frontend E sections 2 and 3).
 *
 * Server-side data: the API seeds roles from it and computes `session.permissions`. The
 * frontend must not import this file; it only ever sees the keys in the session. It is
 * exported on its own path (`@blufountain/domain/catalogue`) and used in frontend tests.
 *
 * Role ids: receptionist (R), lawyer (L), supervisor (S) are verified from the prototype.
 * `admin` is the proposed system administrator (D-07, pending): user administration needs
 * a holder, and the prototype has none.
 */

export const ROLE_IDS = ['receptionist', 'lawyer', 'supervisor', 'admin'] as const;
export type RoleId = (typeof ROLE_IDS)[number];

export interface RoleDefinition {
  id: RoleId;
  name: string;
  description: string;
}

export const ROLES: RoleDefinition[] = [
  {
    id: 'receptionist',
    name: 'Receptionist',
    description: 'Front desk: intake, advice, tasks, SMS, policy sales and premium collection.',
  },
  {
    id: 'lawyer',
    name: 'Lawyer',
    description:
      'Screening, case notes, custody, letters, expenses and claim hours. Own cases only.',
  },
  {
    id: 'supervisor',
    name: 'Supervisor',
    description: 'Office head: all approvals, claims decisions, finance, governance and settings.',
  },
  {
    id: 'admin',
    name: 'System administrator',
    description: 'Users, roles, offices and reference data. No access to client data.',
  },
];

// Who holds each permission. R = receptionist, L = lawyer, S = supervisor.
type Holders = 'RLS' | 'RL' | 'RS' | 'LS' | 'S';

// Rows 1 to 67 follow the prototype's "Who can do what" table (frontend E section 3.2).
const ACTIONS: Array<[Holders, string[]]> = [
  ['RLS', ['intake.create']],
  ['RLS', ['case.read', 'hearing.read']],
  ['LS', ['case.notes.read', 'case.notes.create']],
  ['LS', ['screening.decide', 'case.stage.update']],
  ['S', ['case.assign']],
  ['S', ['pii.nationalId.read']],
  ['S', ['conflict.decide']],
  ['RLS', ['task.create', 'task.complete']],
  ['S', ['task.assign']],
  ['RLS', ['worklist.read']],
  ['RLS', ['sms.send']],
  ['RS', ['callback.read']],
  ['RLS', ['advice.create', 'clinic.manage']],
  ['RLS', ['prisonVisit.manage']],
  ['LS', ['custody.update']],
  ['LS', ['letter.create', 'letter.export']],
  ['RLS', ['mediation.manage']],
  ['LS', ['negotiation.manage']],
  ['LS', ['undertaking.manage', 'costsOrder.manage']],
  ['LS', ['judgment.manage', 'appeal.manage']],
  ['S', ['appealRules.configure']],
  ['S', ['roster.update']],
  ['RLS', ['complaint.create']], // C-01: lawyers may log complaints (D-08 default)
  ['S', ['complaint.respond']],
  ['RLS', ['incident.create']],
  ['S', ['governance.manage']],
  ['S', ['project.manage']],
  ['S', ['grant.manage']],
  ['S', ['report.donor.export']],
  ['S', ['report.read', 'settings.update']],
  ['S', ['audit.read', 'dataRequest.manage']],
  ['S', ['system.exportAll']],
  ['S', ['team.manage']],
  ['RLS', ['hearing.export', 'task.export']],
  ['LS', ['case.export', 'referral.export']],
  ['LS', ['expense.create']],
  ['S', ['expense.approve']],
  ['S', ['expense.pay']],
  ['LS', ['mileage.create']],
  ['LS', ['advance.create', 'perDiem.create']],
  ['S', ['advance.approve']],
  ['S', ['officeCost.pay']],
  ['RS', ['pettyCash.disburse']],
  ['S', ['pettyCash.approve', 'pettyCash.configure']],
  ['RLS', ['contribution.record']],
  ['S', ['contribution.waive']],
  ['S', ['finance.configure']],
  ['S', ['clientMoney.manage', 'clientMoney.pay']],
  ['RLS', ['purchase.create']],
  ['S', ['purchase.approve']],
  ['RS', ['asset.manage']],
  ['S', ['contract.manage']],
  ['RLS', ['vehicle.book']],
  ['RLS', ['leave.create', 'training.recordOwn']],
  ['S', ['leave.approve', 'checkin.manage']],
  ['RS', ['policy.create', 'premium.record']],
  ['RS', ['quote.create', 'application.create', 'renewal.notify']],
  ['RS', ['kyc.update', 'debitOrder.manage']],
  ['S', ['application.underwrite', 'commission.pay']],
  ['S', ['claim.decide', 'product.update']],
  ['LS', ['claim.logHours']],
  ['LS', ['panelInvoice.create']],
  ['S', ['claim.assignPanel', 'panelInvoice.approve']],
  ['S', ['claimCheck.manage']],
  ['S', ['reserves.configure']],
  ['S', ['reinsurance.manage']],
  ['S', ['policy.cancel', 'refund.pay']],
];

// Permissions the prototype uses but its table omits (frontend E section 3.3).
const EXTRAS: Array<[Holders, string[]]> = [
  ['LS', ['claim.register']],
  ['LS', ['cover.check']], // C-03 resolved by the D-08 default: lawyers may check cover
  ['S', ['claim.reserve', 'claim.close']],
  ['RLS', ['hearing.create', 'document.upload', 'document.download']],
  ['RLS', ['client.update', 'referral.manage', 'court.manage', 'library.share']],
  ['RS', ['policy.manage']],
  ['RS', ['member.read', 'member.request.handle']],
  ['S', ['member.manage']],
  ['S', ['agent.manage']],
];

// Page-level view permissions, one per route in frontend F section 4.2, granted by the
// page-access table in frontend E section 3.4.
const PAGES: Array<[Holders, string[]]> = [
  [
    'RLS',
    [
      'home.read',
      'client.read',
      'custody.read',
      'prisonVisit.read',
      'advice.read',
      'court.read',
      'mediation.read',
      'referral.read',
      'task.read',
      'sms.read',
      'roster.read',
      'library.read',
      'negotiation.read',
      'costs.read',
      'policy.read',
      'claim.read',
      'product.read',
      'contribution.read',
      'asset.read',
    ],
  ],
  [
    'LS',
    ['appeal.read', 'expense.read', 'team.read', 'project.read', 'clientMoney.read', 'panel.read'],
  ],
  [
    'RS',
    [
      'premium.read',
      'quote.read',
      'application.read',
      'renewal.read',
      'endorsement.read',
      'kyc.read',
      'pettyCash.read',
      'complaint.read',
    ],
  ],
  [
    'S',
    ['approvals.read', 'agent.read', 'report.insurance.read', 'reinsurance.read', 'reserves.read'],
  ],
];

const ADMIN_PERMISSIONS = [
  'home.read',
  'user.manage',
  'role.manage',
  'office.manage',
  'reference.manage',
];

const ROLE_BY_LETTER = { R: 'receptionist', L: 'lawyer', S: 'supervisor' } as const;

function build(): Record<RoleId, Set<string>> {
  const grants: Record<RoleId, Set<string>> = {
    receptionist: new Set(),
    lawyer: new Set(),
    supervisor: new Set(),
    admin: new Set(ADMIN_PERMISSIONS),
  };
  for (const [holders, keys] of [...ACTIONS, ...EXTRAS, ...PAGES]) {
    for (const letter of holders) {
      for (const key of keys) grants[ROLE_BY_LETTER[letter as 'R' | 'L' | 'S']].add(key);
    }
  }
  return grants;
}

const GRANTS = build();

/** Every permission key the system knows. */
export const ALL_PERMISSIONS: string[] = [
  ...new Set(Object.values(GRANTS).flatMap((s) => [...s])),
].sort();

export function permissionsOfRole(role: string): string[] {
  return [...(GRANTS[role as RoleId] ?? [])].sort();
}

/** The union of the permissions of the given roles, sorted. Unknown roles grant nothing. */
export function permissionsForRoles(roles: readonly string[]): string[] {
  const union = new Set<string>();
  for (const role of roles) for (const key of permissionsOfRole(role)) union.add(key);
  return [...union].sort();
}

export function isRoleId(value: string): value is RoleId {
  return (ROLE_IDS as readonly string[]).includes(value);
}

/**
 * Permissions that, once granted, need a second administrator's approval (frontend E
 * section 7.3). The approval workflow arrives with the approvals inbox (Phase 3); until then
 * the API refuses role changes that add any of these (SECOND_APPROVAL_REQUIRED).
 */
export const HIGH_RISK_PERMISSIONS = [
  'claim.decide',
  'expense.pay',
  'refund.pay',
  'commission.pay',
  'clientMoney.pay',
  'officeCost.pay',
  'user.manage',
  'role.manage',
  'system.exportAll',
];
