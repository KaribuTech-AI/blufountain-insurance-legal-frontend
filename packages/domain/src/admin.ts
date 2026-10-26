import { z } from 'zod';
import { Reason } from './fields.js';

export const UserStatus = z.enum(['active', 'suspended']);
export type UserStatus = z.infer<typeof UserStatus>;

export const AdminUser = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  status: UserStatus,
  roles: z.array(z.string()),
  offices: z.array(z.string()),
  lawyerId: z.string().optional(),
  /** Computed by the server from the roles; read-only. */
  effectivePermissions: z.array(z.string()),
});
export type AdminUser = z.infer<typeof AdminUser>;

export const RoleSummary = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  permissions: z.array(z.string()),
});
export type RoleSummary = z.infer<typeof RoleSummary>;

export const ChangeUserRoles = z.strictObject({
  roles: z.array(z.string()).min(1, 'Choose at least one role'),
  offices: z.array(z.string()).min(1, 'Choose at least one office'),
  reason: Reason,
});
export type ChangeUserRoles = z.infer<typeof ChangeUserRoles>;

export const ChangeUserStatus = z.strictObject({ reason: Reason });
export type ChangeUserStatus = z.infer<typeof ChangeUserStatus>;

export const DevSessionRequest = z.strictObject({ userId: z.string().min(1) });
export type DevSessionRequest = z.infer<typeof DevSessionRequest>;

export const DevUser = z.object({
  id: z.string(),
  name: z.string(),
  roles: z.array(z.string()),
  offices: z.array(z.string()),
});
export type DevUser = z.infer<typeof DevUser>;
