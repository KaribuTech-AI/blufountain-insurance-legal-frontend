import { z } from 'zod';

export const SessionUser = z.object({
  id: z.string(),
  name: z.string(),
  /** Set when the user is a lawyer: the id their cases are assigned to (D-09). */
  lawyerId: z.string().optional(),
});

/**
 * What `GET /session` returns (frontend E section 6.2). `permissions` is the only input to
 * `can()`; `roles` is for display.
 */
export const Session = z.object({
  user: SessionUser,
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
  offices: z.array(z.string()),
  mfa: z.object({ enrolled: z.boolean() }),
  /** Absolute end of the session, ISO date-time. */
  expiresAt: z.string(),
  /** 'dev' while sign in is postponed (D-04). The staff app uses it to show the user switcher. */
  kind: z.enum(['dev', 'standard']),
});
export type Session = z.infer<typeof Session>;

export type PermissionRequirement = string | { anyOf: string[] } | { allOf: string[] };

/** The one permission check, used by route guards, the menu, buttons and the API's guards. */
export function can(
  session: Pick<Session, 'permissions'> | null | undefined,
  requirement: PermissionRequirement | undefined,
): boolean {
  if (!session) return false;
  if (requirement === undefined) return true;
  const held = session.permissions;
  if (typeof requirement === 'string') return held.includes(requirement);
  if ('anyOf' in requirement) return requirement.anyOf.some((p) => held.includes(p));
  return requirement.allOf.every((p) => held.includes(p));
}

/**
 * Accepts only a relative path that starts with a single "/", so a sign-in redirect can never
 * leave the site (open redirect, frontend E section 5.2). Anything else becomes "/".
 */
export function safeReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return '/';
  }
  // Control characters and backslashes are treated as hostile (browsers normalise "\" to "/").
  // oxlint-disable-next-line no-control-regex -- rejecting control characters is the point
  if (/[\u0000-\u001f\\]/.test(value)) return '/';
  return value;
}
