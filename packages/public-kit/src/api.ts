import type { MessageKey } from '@blufountain/i18n';

/** A failed call, reduced to what a person on a phone needs to see. */
export class PublicError extends Error {
  readonly status: number;
  readonly code: string;
  /** The server's own words for one field, in English. */
  readonly fields: Array<{ field: string; message: string }>;
  /** Seconds to wait, for a 429. */
  readonly retryAfter: number | undefined;

  constructor(
    status: number,
    code: string,
    fields: Array<{ field: string; message: string }> = [],
    retryAfter?: number,
  ) {
    super(code);
    this.status = status;
    this.code = code;
    this.fields = fields;
    this.retryAfter = retryAfter;
  }

  /** Which message to show, in the reader's language. */
  get messageKey(): MessageKey {
    if (this.status === 0) return 'err.network';
    if (this.status === 429) return 'err.rate';
    if (this.status === 401) return 'err.session';
    if (this.code === 'CODE_INVALID') return 'err.code';
    if (this.code === 'IDENTITY_INVALID') return 'err.identity';
    if (this.code === 'ACCOUNT_UNAVAILABLE') return 'err.account';
    if (this.code === 'PHONE_IN_USE') return 'err.phoneUsed';
    if (this.status === 422) return 'err.fields';
    return 'err.generic';
  }

  fieldMessage(field: string) {
    return this.fields.find((f) => f.field === field)?.message;
  }
}

export interface Challenge {
  token: string;
  waitSeconds: number;
}

export interface PublicApi {
  /** The bearer token lives in this closure only: a page reload signs the person out. */
  setToken(token: string | undefined): void;
  hasToken(): boolean;
  get<T>(path: string): Promise<T>;
  send<T>(method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', path: string, body?: unknown): Promise<T>;
  /** Fetches a bot-check token and resolves once it is old enough to be accepted. */
  challenge(): Promise<string>;
}

type Fetch = typeof fetch;

export function createApi(
  base = '/api/v1/public',
  doFetch: Fetch = (...a) => fetch(...a),
): PublicApi {
  let token: string | undefined;

  async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
    let res: Response;
    try {
      res = await doFetch(`${base}${path}`, {
        method,
        headers: {
          accept: 'application/json',
          ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        // No cookies: a public page never sends the staff session anywhere.
        credentials: 'omit',
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
    } catch {
      throw new PublicError(0, 'NETWORK');
    }
    if (res.status === 204) return undefined as T;
    let json: unknown;
    try {
      json = await res.json();
    } catch {
      json = undefined;
    }
    if (!res.ok) {
      const problem = (json ?? {}) as {
        code?: string;
        errors?: Array<{ field: string; message: string }>;
      };
      const retry = Number(res.headers.get('retry-after'));
      throw new PublicError(
        res.status,
        problem.code ?? 'ERROR',
        problem.errors ?? [],
        Number.isFinite(retry) && retry > 0 ? retry : undefined,
      );
    }
    return json as T;
  }

  return {
    setToken: (t) => {
      token = t;
    },
    hasToken: () => token !== undefined,
    get: (path) => call('GET', path),
    send: (method, path, body) => call(method, path, body),
    async challenge() {
      const c = await call<Challenge>('GET', '/challenge');
      await new Promise((r) => setTimeout(r, c.waitSeconds * 1000 + 250));
      return c.token;
    },
  };
}
