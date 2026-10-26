import { z } from 'zod';

/** RFC 9457 Problem Details as returned by every API error (backend C section 1.5). */
export const FieldError = z.object({
  field: z.string(),
  code: z.string(),
  message: z.string(),
});
export type FieldError = z.infer<typeof FieldError>;

export const Problem = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number().int(),
  code: z.string(),
  detail: z.string().optional(),
  requestId: z.string().optional(),
  errors: z.array(FieldError).optional(),
});
export type Problem = z.infer<typeof Problem>;
