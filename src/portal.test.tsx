import { LANGUAGE_SWITCH, PublicError, type PublicApi } from '@blufountain/public-kit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import App from './App';

interface Call {
  method: string;
  path: string;
  body?: unknown;
}

/** A stand-in for the public API: answers by path and remembers what was sent. */
function fakeApi(answers: Record<string, unknown | (() => unknown)>) {
  const calls: Call[] = [];
  let token: string | undefined;
  const answer = (method: string, path: string, body?: unknown) => {
    calls.push({ method, path, body });
    const given = answers[`${method} ${path}`];
    if (given === undefined) return Promise.reject(new PublicError(404, 'NOT_FOUND'));
    const value = typeof given === 'function' ? (given as () => unknown)() : given;
    return value instanceof Error ? Promise.reject(value) : Promise.resolve(value);
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

const found = {
  reference: 'LA-2026-0398',
  stage: 'Your lawyer is working on your case.',
  stageCode: 'active',
  nextCourtDate: '2026-10-21',
  lawyerName: 'Tendai Moyo',
};

const sent = { message: 'sent', expiresInSeconds: 600, sandboxCode: '123456' };

async function signIn(u: ReturnType<typeof userEvent.setup>) {
  await u.click(screen.getAllByRole('link', { name: 'Check my case' })[0]!);
  await u.type(screen.getByLabelText(/Case number/), 'LA-2026-0398');
  await u.type(screen.getByLabelText(/Your phone number/), '0772 418 552');
  await u.click(screen.getByRole('button', { name: 'Send me a code' }));
  await u.type(await screen.findByLabelText('The 6 digit code'), '123456');
  await u.click(screen.getByRole('button', { name: 'Show my case' }));
}

describe('client portal', () => {
  it('starts at the top of every page it moves to', async () => {
    const u = userEvent.setup();
    render(<App api={fakeApi({}).api} />);
    vi.mocked(window.scrollTo).mockClear();
    await u.click(screen.getAllByRole('link', { name: 'Contact' })[0]!);
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' });
    vi.mocked(window.scrollTo).mockClear();
    await u.click(screen.getAllByRole('link', { name: 'Contact' })[0]!);
    expect(window.scrollTo).toHaveBeenCalledTimes(1);
  });

  it('shows only the stage, the next court date and the lawyer, after a one-time code', async () => {
    const fake = fakeApi({
      'POST /codes': sent,
      'POST /sessions': { token: 'tok'.repeat(10), kind: 'case', expiresInSeconds: 1200 },
      'GET /case': found,
    });
    const u = userEvent.setup();
    render(<App api={fake.api} />);
    await signIn(u);

    expect(await screen.findByText('Your lawyer is working on your case.')).toBeInTheDocument();
    expect(screen.getByText('21 October 2026')).toBeInTheDocument();
    expect(screen.getByText('Tendai Moyo')).toBeInTheDocument();

    const codes = fake.calls.find((c) => c.path === '/codes')!;
    expect(codes.body).toMatchObject({
      purpose: 'case',
      reference: 'LA-2026-0398',
      phone: '0772 418 552',
      challenge: '1.challenge-token',
    });
    expect(fake.token()).toBe('tok'.repeat(10));
  });

  it('signs out by ending the session and forgetting the token', async () => {
    const fake = fakeApi({
      'POST /codes': sent,
      'POST /sessions': { token: 'tok'.repeat(10), kind: 'case', expiresInSeconds: 1200 },
      'GET /case': found,
      'DELETE /sessions/current': undefined as never,
    });
    fake.api.send = vi.fn(async (method: string, path: string) => {
      fake.calls.push({ method, path });
      if (path === '/codes') return sent;
      if (path === '/sessions' && method === 'POST') return { token: 'tok'.repeat(10) };
      return undefined;
    }) as PublicApi['send'];
    fake.api.get = (async () => found) as PublicApi['get'];
    const u = userEvent.setup();
    render(<App api={fake.api} />);
    await signIn(u);
    await u.click(await screen.findByRole('button', { name: 'Sign out' }));

    await waitFor(() => expect(fake.token()).toBeUndefined());
    expect(fake.calls.some((c) => c.method === 'DELETE' && c.path === '/sessions/current')).toBe(
      true,
    );
    expect((await screen.findAllByRole('link', { name: 'Member login' }))[0]).toBeInTheDocument();
  });

  it.runIf(LANGUAGE_SWITCH)(
    'says in the reader’s language that there were too many tries',
    async () => {
      const fake = fakeApi({ 'POST /codes': new PublicError(429, 'RATE_LIMITED', [], 600) });
      const u = userEvent.setup();
      render(<App api={fake.api} />);
      await u.click(screen.getAllByRole('link', { name: 'Check my case' })[0]!);
      await u.type(screen.getByLabelText(/Case number/), 'LA-2026-0398');
      await u.type(screen.getByLabelText(/Your phone number/), '0772418552');
      await u.click(screen.getByRole('button', { name: 'Send me a code' }));
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Too many tries. Please wait a few minutes.',
      );

      await u.click(screen.getByRole('button', { name: 'chiShona' }));
      expect(screen.getByRole('alert')).toHaveTextContent('Wakaedza kakawanda');
    },
  );

  it.runIf(LANGUAGE_SWITCH)(
    'can be read in Shona and isiNdebele, with a notice that the wording is a draft',
    async () => {
      const u = userEvent.setup();
      render(<App api={fakeApi({}).api} />);
      expect(screen.getAllByRole('link', { name: 'Member login' })[0]).toBeInTheDocument();
      expect(screen.queryByRole('note')).not.toBeInTheDocument();

      await u.click(screen.getByRole('button', { name: 'chiShona' }));
      expect(screen.getAllByRole('link', { name: 'Pinda senhengo' })[0]).toBeInTheDocument();
      expect(screen.getByRole('note')).toBeInTheDocument();
      expect(document.documentElement.lang).toBe('sn');

      await u.click(screen.getByRole('button', { name: 'isiNdebele' }));
      expect(screen.getAllByRole('link', { name: 'Ngena njengelungu' })[0]).toBeInTheDocument();
      expect(document.documentElement.lang).toBe('nd');
    },
  );

  it('hides the language switch until the translations are reviewed', () => {
    render(<App api={fakeApi({}).api} />);
    for (const name of ['English', 'chiShona', 'isiNdebele'])
      expect(screen.queryByRole('button', { name })).not.toBeInTheDocument();
  });

  it.runIf(LANGUAGE_SWITCH)('remembers the chosen language', async () => {
    const u = userEvent.setup();
    const { unmount } = render(<App api={fakeApi({}).api} />);
    await u.click(screen.getByRole('button', { name: 'isiNdebele' }));
    unmount();
    render(<App api={fakeApi({}).api} />);
    expect(screen.getAllByRole('link', { name: 'Ngena njengelungu' })[0]).toBeInTheDocument();
  });

  it('sends an application with the language, and shows the reference', async () => {
    const fake = fakeApi({
      'POST /applications': { message: 'ok', reference: 'CB-AB12CD' },
    });
    const u = userEvent.setup();
    render(<App api={fake.api} />);
    await u.click(screen.getAllByRole('link', { name: 'Ask for legal help' })[0]!);
    await u.type(screen.getByLabelText('Your name'), 'Blessing Moyo');
    await u.type(screen.getByLabelText('Your phone number'), '0713 555 222');
    await u.selectOptions(screen.getByLabelText('What is the problem?'), 'labour');
    await u.type(screen.getByLabelText('Tell us what happened'), 'My employer has not paid me.');
    await u.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByText(/Reference CB-AB12CD/)).toBeInTheDocument();
    const body = fake.calls[0]!.body as Record<string, unknown>;
    expect(body).toMatchObject({ fullName: 'Blessing Moyo', matterType: 'labour', language: 'en' });
    // The hidden field is left out when nobody filled it in.
    expect(body).not.toHaveProperty('website');
  });

  it('keeps the send button off until the form is filled in', async () => {
    const u = userEvent.setup();
    render(<App api={fakeApi({}).api} />);
    await u.click(screen.getAllByRole('link', { name: 'Ask for legal help' })[0]!);
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  });
});
