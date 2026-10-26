import { describe, expect, it } from 'vitest';
import { can, safeReturnTo } from './session.js';

const session = { permissions: ['case.read', 'claim.read'] };

describe('can', () => {
  it('is false without a session', () => {
    expect(can(null, 'case.read')).toBe(false);
  });
  it('checks a single key', () => {
    expect(can(session, 'case.read')).toBe(true);
    expect(can(session, 'claim.decide')).toBe(false);
  });
  it('supports anyOf and allOf', () => {
    expect(can(session, { anyOf: ['claim.decide', 'case.read'] })).toBe(true);
    expect(can(session, { allOf: ['claim.read', 'case.read'] })).toBe(true);
    expect(can(session, { allOf: ['claim.read', 'claim.decide'] })).toBe(false);
  });
  it('allows a route with no requirement for any signed-in user, but not for nobody', () => {
    expect(can(session, undefined)).toBe(true);
    expect(can(null, undefined)).toBe(false);
  });
});

describe('safeReturnTo', () => {
  it('keeps relative paths with query strings', () => {
    expect(safeReturnTo('/cases/12?tab=notes')).toBe('/cases/12?tab=notes');
  });
  it.each([
    'https://evil.example/x',
    '//evil.example',
    '/\\evil.example',
    'cases/12',
    '/ok\r\nSet-Cookie: x=1',
    '',
    null,
    undefined,
  ])('rejects %j', (value) => {
    expect(safeReturnTo(value)).toBe('/');
  });
});
