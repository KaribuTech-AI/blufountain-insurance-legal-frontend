import { LANGUAGE_SWITCH, PublicError, type PublicApi } from '@blufountain/public-kit';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../App';

interface Call {
  method: string;
  path: string;
  body?: unknown;
}

function fakeApi(handlers: Record<string, (body?: unknown) => unknown>) {
  const calls: Call[] = [];
  let token: string | undefined;
  const answer = (method: string, path: string, body?: unknown) => {
    calls.push({ method, path, body });
    const handler = handlers[`${method} ${path}`];
    if (!handler) return Promise.reject(new PublicError(404, 'NOT_FOUND'));
    try {
      return Promise.resolve(handler(body));
    } catch (e) {
      return Promise.reject(e);
    }
  };
  const api: PublicApi = {
    setToken: (t) => {
      token = t;
    },
    hasToken: () => token !== undefined,
    get: ((path: string) => answer('GET', path)) as PublicApi['get'],
    send: ((method: string, path: string, body?: unknown) =>
      answer(method, path, body)) as PublicApi['send'],
    challenge: () => Promise.resolve('1.challenge-token'),
  };
  return { api, calls, token: () => token };
}

const profile = (over: object = {}) => ({
  firstName: 'Tatenda',
  fullName: 'Tatenda Chirwa',
  phoneHint: '•••552',
  language: 'en',
  lastSignInAt: '2026-10-19T08:00:00.000Z',
  sharedDevice: false,
  ...over,
});

const signedIn = (seconds = 1200) => ({
  status: 'signed_in',
  token: 'tok'.repeat(10),
  expiresInSeconds: seconds,
});

const base = {
  'POST /codes': () => ({ message: 'sent', expiresInSeconds: 600, sandboxCode: '123456' }),
  'POST /sessions': () => signedIn(),
  'GET /profile': () => profile(),
};

const publicApi = fakeApi({}).api;

async function sendCode(u: ReturnType<typeof userEvent.setup>, phone = '0772418552') {
  await u.type(await screen.findByLabelText(/Your phone number/), phone);
  await u.click(screen.getByRole('button', { name: 'Send me a code' }));
}

async function enterCode(u: ReturnType<typeof userEvent.setup>) {
  await u.type(await screen.findByLabelText('The 6 digit code'), '123456');
  await u.click(screen.getByRole('button', { name: 'Sign in' }));
}

beforeEach(() => {
  window.location.hash = '/account';
});
afterEach(() => {
  vi.useRealTimers();
});

describe('signing in to the account', () => {
  it('needs only a phone number and a code, never a reference number', async () => {
    const fake = fakeApi(base);
    const u = userEvent.setup();
    render(<App api={publicApi} memberApi={fake.api} />);

    expect(screen.queryByLabelText(/Policy number|Case number/)).not.toBeInTheDocument();
    await sendCode(u);
    await enterCode(u);

    expect(await screen.findByRole('heading', { name: 'Hello Tatenda' })).toBeInTheDocument();
    expect(screen.getByText('Signed in with the phone ending •••552')).toBeInTheDocument();
    expect(fake.token()).toBeTruthy();

    const codes = fake.calls.find((c) => c.path === '/codes')!;
    expect(codes.body).toMatchObject({ phone: '0772418552', challenge: '1.challenge-token' });
    expect(codes.body).not.toHaveProperty('reference');
    expect(codes.body).not.toHaveProperty('purpose');
    expect(fake.calls.find((c) => c.path === '/sessions')!.body).toEqual({
      phone: '0772418552',
      code: '123456',
      sharedDevice: false,
    });
  });

  it('asks for a shorter session on a shared phone', async () => {
    const fake = fakeApi(base);
    const u = userEvent.setup();
    render(<App api={publicApi} memberApi={fake.api} />);
    await sendCode(u);
    await u.click(await screen.findByRole('checkbox', { name: /shared phone or computer/ }));
    await enterCode(u);
    await screen.findByRole('heading', { name: 'Hello Tatenda' });
    expect(fake.calls.find((c) => c.path === '/sessions')!.body).toMatchObject({
      sharedDevice: true,
    });
  });

  it('uses the language saved on the account', async () => {
    const fake = fakeApi({ ...base, 'GET /profile': () => profile({ language: 'sn' }) });
    const u = userEvent.setup();
    render(<App api={publicApi} memberApi={fake.api} />);
    await sendCode(u);
    await enterCode(u);
    expect(await screen.findByRole('heading', { name: 'Mhoro Tatenda' })).toBeInTheDocument();
  });

  it('shows a wrong code in plain words and stays on the code step', async () => {
    const fake = fakeApi({
      ...base,
      'POST /sessions': () => {
        throw new PublicError(422, 'CODE_INVALID');
      },
    });
    const u = userEvent.setup();
    render(<App api={publicApi} memberApi={fake.api} />);
    await sendCode(u);
    await enterCode(u);
    expect(await screen.findByText('That code is not right, or it has expired.')).toBeVisible();
    expect(screen.getByLabelText('The 6 digit code')).toBeInTheDocument();
    expect(fake.token()).toBeUndefined();
  });

  it('says to call when the account is locked', async () => {
    const fake = fakeApi({
      ...base,
      'POST /sessions': () => {
        throw new PublicError(403, 'ACCOUNT_UNAVAILABLE');
      },
    });
    const u = userEvent.setup();
    render(<App api={publicApi} memberApi={fake.api} />);
    await sendCode(u);
    await enterCode(u);
    expect(
      await screen.findByText('This account cannot be opened online. Please call us.'),
    ).toBeVisible();
  });

  it('tells the person to wait when they ask for too many codes', async () => {
    const fake = fakeApi({
      'POST /codes': () => {
        throw new PublicError(429, 'RATE_LIMITED', [], 600);
      },
    });
    const u = userEvent.setup();
    render(<App api={publicApi} memberApi={fake.api} />);
    await sendCode(u);
    expect(await screen.findByText('Too many tries. Please wait a few minutes.')).toBeVisible();
  });

  it('sends the hidden field only when a script filled it in', async () => {
    const fake = fakeApi(base);
    const u = userEvent.setup();
    render(<App api={publicApi} memberApi={fake.api} />);
    await sendCode(u);
    expect(fake.calls.find((c) => c.path === '/codes')!.body).not.toHaveProperty('website');
  });
});

describe('a phone that several people share', () => {
  const pending = {
    status: 'identity_required',
    pendingToken: 'pending'.repeat(5),
    choices: [
      { choice: 'a', firstName: 'Anesu' },
      { choice: 'b', firstName: 'Tatenda' },
    ],
    expiresInSeconds: 300,
  };
  const shared = {
    ...base,
    'POST /sessions': () => pending,
    'POST /sessions/identity': () => signedIn(),
  };

  it('asks who is signing in, then opens that person’s account', async () => {
    const fake = fakeApi(shared);
    const u = userEvent.setup();
    render(<App api={publicApi} memberApi={fake.api} />);
    await sendCode(u);
    await enterCode(u);

    expect(await screen.findByText(/More than one person uses this phone/)).toBeInTheDocument();
    expect(fake.token()).toBeUndefined();
    await u.click(screen.getByRole('button', { name: 'Tatenda' }));
    await u.type(screen.getByLabelText(/Last 4 characters of your ID number/), '7k19');
    await u.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByRole('heading', { name: 'Hello Tatenda' })).toBeInTheDocument();
    expect(fake.calls.find((c) => c.path === '/sessions/identity')!.body).toEqual({
      pendingToken: pending.pendingToken,
      choice: 'b',
      idLast4: '7K19',
      sharedDevice: false,
    });
  });

  it('shows plain words for the wrong ID digits and lets the person try again', async () => {
    const fake = fakeApi({
      ...shared,
      'POST /sessions/identity': () => {
        throw new PublicError(422, 'IDENTITY_INVALID');
      },
    });
    const u = userEvent.setup();
    render(<App api={publicApi} memberApi={fake.api} />);
    await sendCode(u);
    await enterCode(u);
    await u.type(await screen.findByLabelText(/Last 4 characters/), '0000');
    await u.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByText(/Those details do not match/)).toBeVisible();
    expect(screen.getByLabelText(/Last 4 characters/)).toBeInTheDocument();
  });

  it('keeps Continue off until the four characters are typed', async () => {
    const fake = fakeApi(shared);
    const u = userEvent.setup();
    render(<App api={publicApi} memberApi={fake.api} />);
    await sendCode(u);
    await enterCode(u);
    await u.type(await screen.findByLabelText(/Last 4 characters/), '7K1');
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });
});

describe('the signed in account', () => {
  async function open(over: Record<string, (body?: unknown) => unknown> = {}, seconds = 1200) {
    const fake = fakeApi({ ...base, 'POST /sessions': () => signedIn(seconds), ...over });
    const u = userEvent.setup();
    render(<App api={publicApi} memberApi={fake.api} />);
    await sendCode(u);
    await enterCode(u);
    await screen.findByRole('heading', { name: 'Hello Tatenda' });
    return { fake, u };
  }

  it('signs out here and returns to the phone step', async () => {
    const { fake, u } = await open({ 'DELETE /sessions/current': () => undefined });
    await u.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(await screen.findByLabelText(/Your phone number/)).toBeInTheDocument();
    expect(fake.token()).toBeUndefined();
    expect(fake.calls.some((c) => c.method === 'DELETE' && c.path === '/sessions/current')).toBe(
      true,
    );
  });

  it('signs out everywhere', async () => {
    const { fake, u } = await open({ 'DELETE /sessions': () => undefined });
    await u.click(screen.getByRole('button', { name: 'Sign out everywhere' }));
    expect(await screen.findByLabelText(/Your phone number/)).toBeInTheDocument();
    expect(fake.calls.some((c) => c.method === 'DELETE' && c.path === '/sessions')).toBe(true);
  });

  it('still signs out on the page when the server cannot be reached', async () => {
    const { fake, u } = await open({
      'DELETE /sessions/current': () => {
        throw new PublicError(0, 'NETWORK');
      },
    });
    await u.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(await screen.findByLabelText(/Your phone number/)).toBeInTheDocument();
    expect(fake.token()).toBeUndefined();
  });

  it.runIf(LANGUAGE_SWITCH)('saves a language change on the account', async () => {
    const { fake, u } = await open({
      'PATCH /profile': (body) => profile({ language: (body as { language: string }).language }),
    });
    await u.click(screen.getByRole('button', { name: 'chiShona' }));
    expect(await screen.findByRole('heading', { name: 'Mhoro Tatenda' })).toBeInTheDocument();
    expect(fake.calls.find((c) => c.method === 'PATCH')!.body).toEqual({ language: 'sn' });
  });
});

describe('the idle timer', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
  });

  async function open(seconds: number, over: Record<string, (body?: unknown) => unknown> = {}) {
    const fake = fakeApi({ ...base, 'POST /sessions': () => signedIn(seconds), ...over });
    const u = userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) });
    render(<App api={publicApi} memberApi={fake.api} />);
    await sendCode(u);
    await enterCode(u);
    await screen.findByRole('heading', { name: 'Hello Tatenda' });
    return { fake, u };
  }

  const wait = (seconds: number) => act(() => vi.advanceTimersByTime(seconds * 1000));

  it('warns two minutes before the end, and Stay signed in keeps the session', async () => {
    const { fake, u } = await open(1200);
    await wait(1000);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    await wait(85);
    const warning = screen.getByRole('alertdialog', { name: 'Are you still there?' });
    expect(within(warning).getByText(/sign you out in \d+ seconds/)).toBeInTheDocument();

    const before = fake.calls.filter((c) => c.path === '/profile').length;
    await u.click(within(warning).getByRole('button', { name: 'Stay signed in' }));
    expect(fake.calls.filter((c) => c.path === '/profile').length).toBe(before + 1);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    // A fresh 20 minutes: still signed in well past the first deadline.
    await wait(1100);
    expect(screen.getByRole('heading', { name: 'Hello Tatenda' })).toBeInTheDocument();
  });

  it('signs out when the time is up and says why', async () => {
    const { fake } = await open(300);
    await wait(310);
    expect(await screen.findByLabelText(/Your phone number/)).toBeInTheDocument();
    expect(screen.getByText(/You were signed out because the page was not used/)).toBeVisible();
    expect(fake.token()).toBeUndefined();
  });

  it('warns sooner on a shared phone’s five-minute session', async () => {
    await open(300);
    await wait(150);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    await wait(60);
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('signs out if staying signed in fails because the server ended the session', async () => {
    let refused = false;
    const { u } = await open(1200, {
      'GET /profile': () => {
        if (refused) throw new PublicError(401, 'UNAUTHENTICATED');
        return profile();
      },
    });
    await wait(1085);
    const stay = within(screen.getByRole('alertdialog')).getByRole('button', {
      name: 'Stay signed in',
    });
    refused = true; // from now on the server refuses
    await u.click(stay);
    await wait(130);
    expect(await screen.findByLabelText(/Your phone number/)).toBeInTheDocument();
  });
});

describe('accessibility', () => {
  const check = async (container: HTMLElement) => {
    const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations.map((v) => `${v.id}: ${v.nodes[0]?.html}`)).toEqual([]);
  };

  it('has no violations on the phone step, the code step or the signed in page', async () => {
    const fake = fakeApi(base);
    const u = userEvent.setup();
    const { container } = render(<App api={publicApi} memberApi={fake.api} />);
    await screen.findByLabelText(/Your phone number/);
    await check(container);

    await sendCode(u);
    await screen.findByLabelText('The 6 digit code');
    await check(container);

    await enterCode(u);
    await screen.findByRole('heading', { name: 'Hello Tatenda' });
    await check(container);
  });

  it('has no violations on the “who are you” step', async () => {
    const fake = fakeApi({
      ...base,
      'POST /sessions': () => ({
        status: 'identity_required',
        pendingToken: 'pending'.repeat(5),
        choices: [
          { choice: 'a', firstName: 'Anesu' },
          { choice: 'b', firstName: 'Tatenda' },
        ],
        expiresInSeconds: 300,
      }),
    });
    const u = userEvent.setup();
    const { container } = render(<App api={publicApi} memberApi={fake.api} />);
    await sendCode(u);
    await enterCode(u);
    await screen.findByText(/More than one person uses this phone/);
    await check(container);
  });
});
