import { describe, expect, it } from 'vitest';
import { ClientIdentity, Money, NationalId, Phone } from './fields.js';

describe('NationalId', () => {
  it('accepts the Zimbabwe format and normalises case', () => {
    expect(NationalId.parse(' 63-123456a78 ')).toBe('63-123456A78');
  });
  it('rejects other formats', () => {
    expect(NationalId.safeParse('12345').success).toBe(false);
  });
});

describe('Phone', () => {
  it('keeps digits only', () => {
    expect(Phone.parse('+263 77 123 4567')).toBe('263771234567');
  });
  it('rejects non-mobile numbers', () => {
    expect(Phone.safeParse('024 2700000').success).toBe(false);
  });
});

describe('ClientIdentity (D-14)', () => {
  it('accepts a national ID alone or a phone alone', () => {
    expect(ClientIdentity.safeParse({ nationalId: '63-123456A78' }).success).toBe(true);
    expect(ClientIdentity.safeParse({ phone: '0771234567' }).success).toBe(true);
  });
  it('rejects a client with neither, on the nationalId field', () => {
    const result = ClientIdentity.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['nationalId']);
  });
});

describe('Money', () => {
  it('rejects fractional minor units', () => {
    expect(Money.safeParse({ amount: 10.5, currency: 'USD' }).success).toBe(false);
  });
});
