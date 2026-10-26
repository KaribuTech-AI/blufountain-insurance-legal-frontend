import { z } from 'zod';

/** Integer minor units (cents) plus currency. Never a float (D-17). */
export const Money = z.object({
  amount: z.number().int().nonnegative(),
  currency: z.enum(['USD', 'ZWG']),
});
export type Money = z.infer<typeof Money>;

export const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD');

// Formats are proposals until BD-14 is confirmed.
export const NationalId = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^\d{2}-?\d{6,7}[A-Z]\d{2}$/, 'Use the format 63-123456A78');

export const Phone = z
  .string()
  .trim()
  .transform((s) => s.replace(/\D/g, ''))
  .refine((d) => /^(0|263)7\d{8}$/.test(d), 'Enter a Zimbabwe mobile number');

/** D-14: every client needs a national ID number, or a phone number if they have none. */
export const ClientIdentity = z
  .object({
    nationalId: NationalId.optional(),
    phone: Phone.optional(),
  })
  .refine((v) => v.nationalId || v.phone, {
    message: 'Enter the national ID number, or a phone number if the client has no ID.',
    path: ['nationalId'],
  });
export type ClientIdentity = z.infer<typeof ClientIdentity>;

export const Reason = z.string().trim().min(5).max(1000);
