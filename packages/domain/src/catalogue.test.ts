import { describe, expect, it } from 'vitest';
import {
  ALL_PERMISSIONS,
  HIGH_RISK_PERMISSIONS,
  permissionsForRoles,
  permissionsOfRole,
} from './catalogue.js';

const has = (role: string, key: string) => permissionsOfRole(role).includes(key);

describe('role grants match the prototype table (frontend E 3.2)', () => {
  it('receptionists cannot read case notes, decide eligibility or see full IDs', () => {
    for (const key of ['case.notes.read', 'screening.decide', 'pii.nationalId.read']) {
      expect(has('receptionist', key)).toBe(false);
    }
  });
  it('lawyers can write notes and screen, but not assign or clear conflicts', () => {
    expect(has('lawyer', 'case.notes.create')).toBe(true);
    expect(has('lawyer', 'screening.decide')).toBe(true);
    expect(has('lawyer', 'case.assign')).toBe(false);
    expect(has('lawyer', 'conflict.decide')).toBe(false);
  });
  it('only supervisors decide claims, approve expenses and see the audit log', () => {
    for (const key of ['claim.decide', 'expense.approve', 'audit.read', 'settings.update']) {
      expect(permissionsOfRole('supervisor')).toContain(key);
      expect(has('lawyer', key)).toBe(false);
      expect(has('receptionist', key)).toBe(false);
    }
  });
  it('applies the D-08 defaults for conflicts C-01 to C-03', () => {
    expect(has('lawyer', 'complaint.create')).toBe(true);
    expect(has('lawyer', 'cover.check')).toBe(true);
    expect(has('lawyer', 'claim.register')).toBe(true);
    expect(has('receptionist', 'claim.register')).toBe(false);
  });
  it('the administrator manages users but touches no client data', () => {
    const admin = permissionsOfRole('admin');
    expect(admin).toContain('user.manage');
    for (const key of ['case.read', 'client.read', 'policy.read', 'case.notes.read']) {
      expect(admin).not.toContain(key);
    }
  });
  it('only the administrator can manage users and roles', () => {
    for (const role of ['receptionist', 'lawyer', 'supervisor']) {
      expect(has(role, 'user.manage')).toBe(false);
      expect(has(role, 'role.manage')).toBe(false);
    }
  });
});

describe('catalogue helpers', () => {
  it('unions roles and ignores unknown ones', () => {
    const merged = permissionsForRoles(['receptionist', 'lawyer', 'nonsense']);
    expect(merged).toContain('quote.create');
    expect(merged).toContain('case.notes.read');
  });
  it('lists every high-risk permission in the catalogue, so none is a typo', () => {
    for (const key of HIGH_RISK_PERMISSIONS) expect(ALL_PERMISSIONS).toContain(key);
  });
  it('uses resource.action keys only', () => {
    for (const key of ALL_PERMISSIONS) expect(key).toMatch(/^[a-z][A-Za-z]*(\.[A-Za-z]+)+$/);
  });
});
