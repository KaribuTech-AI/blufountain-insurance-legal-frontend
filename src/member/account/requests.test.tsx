import { PublicError, type PublicApi } from '@blufountain/public-kit';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from '../../App';

type Handler = (body?: unknown) => unknown;

function fakeApi(handlers: Record<string, Handler>) {
  const calls: { method: string; path: string; body?: unknown }[] = [];
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
    setToken: () => undefined,
    hasToken: () => true,
    get: ((path: string) => answer('GET', path)) as PublicApi['get'],
    send: ((method: string, path: string, body?: unknown) =>
      answer(method, path, body)) as PublicApi['send'],
    challenge: () => Promise.resolve('1.challenge-token'),
  };
  return { api, calls };
}

const profile = (over: object = {}) => ({
  firstName: 'Memory',
  fullName: 'Memory Dube',
  phoneHint: '•••914',
  language: 'en',
  lastSignInAt: null,
  sharedDevice: false,
  consentAccepted: true,
  ...over,
});

const ticket = (over: object = {}) => ({
  id: 't-1',
  kind: 'change_details',
  status: 'received',
  body: 'Please change my postal address to 12 Main Road.',
  policyNumber: null,
  caseReference: null,
  reply: null,
  createdAt: '2026-10-18T08:00:00.000Z',
  updatedAt: '2026-10-18T08:00:00.000Z',
  ...over,
});

const policy = {
  id: 'pol-1',
  number: 'BF-POL-01038',
  product: 'Family Legal Cover',
  standing: 'active',
  paidTo: '2026-11-30',
  monthlyPremiumMinor: 500,
  monthsBehind: 0,
  amountToCatchUpMinor: 0,
  annualLimitMinor: 150000,
  usedMinor: 0,
  remainingMinor: 150000,
  dependants: 0,
  renewsOn: '2027-05-01',
};

const base: Record<string, Handler> = {
  'POST /codes': () => ({ message: 'sent', expiresInSeconds: 600, sandboxCode: '123456' }),
  'POST /sessions': () => ({
    status: 'signed_in',
    token: 'tok'.repeat(10),
    expiresInSeconds: 1200,
  }),
  'GET /profile': () => profile(),
  'GET /requests': () => [],
  'GET /policies': () => [policy],
  'GET /profile/notifications': () => ({
    premium: true,
    hearing: true,
    request: true,
    renewal: false,
  }),
};

async function open(hash: string, handlers: Record<string, Handler> = {}, from = '/account') {
  window.location.hash = from;
  const fake = fakeApi({ ...base, ...handlers });
  const u = userEvent.setup();
  const view = render(<App api={fakeApi({}).api} memberApi={fake.api} />);
  await u.type(await screen.findByLabelText(/Your phone number/), '0715330914');
  await u.click(screen.getByRole('button', { name: 'Send me a code' }));
  await u.type(await screen.findByLabelText('The 6 digit code'), '123456');
  await u.click(screen.getByRole('button', { name: 'Sign in' }));
  await waitFor(() => expect(document.querySelector('.mp-side')).not.toBeNull());
  if (hash !== from) {
    act(() => {
      window.location.hash = hash;
    });
  }
  return { fake, u, ...view };
}

beforeEach(() => {
  window.location.hash = '/account';
});
afterEach(() => {
  window.location.hash = '';
});

describe('the old policy-number sign in is gone from the site', () => {
  it('opens the phone-number sign in at the address the website links to', async () => {
    window.location.hash = '/member';
    const fake = fakeApi(base);
    render(<App api={fakeApi({}).api} memberApi={fake.api} />);
    expect(await screen.findByLabelText(/Your phone number/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Policy number/)).not.toBeInTheDocument();
  });

  it('keeps the member signed in when they move from the website’s address to the account’s', async () => {
    const { u } = await open('/account/cover', {}, '/member');
    await screen.findByRole('heading', { name: 'Family Legal Cover' }).catch(() => undefined);
    expect(screen.queryByLabelText(/Your phone number/)).not.toBeInTheDocument();
    await u.click(screen.getByRole('link', { name: 'Requests' }));
    expect(screen.queryByLabelText(/Your phone number/)).not.toBeInTheDocument();
  });
});

describe('requests', () => {
  it('lists what was asked, with the answer or that there is none yet', async () => {
    await open('/account/requests', {
      'GET /requests': () => [
        ticket({ id: 'a', status: 'done', reply: 'We changed your address.' }),
        ticket({
          id: 'b',
          kind: 'cancel',
          body: 'I want to cancel my policy.',
          policyNumber: 'BF-POL-01038',
        }),
      ],
    });
    const list = await screen.findByRole('region', { name: 'My requests' });
    expect(within(list).getByText('Change my details')).toBeInTheDocument();
    expect(within(list).getByText(/We changed your address\./)).toBeInTheDocument();
    expect(within(list).getByText('Cancel my policy')).toBeInTheDocument();
    expect(within(list).getByText('No answer yet.')).toBeInTheDocument();
    expect(within(list).getByText(/Policy BF-POL-01038/)).toBeInTheDocument();
    expect(within(list).getByText(/Done/)).toBeInTheDocument();
  });

  it('says so when nothing was asked yet', async () => {
    await open('/account/requests');
    expect(await screen.findByText('You have not asked for anything yet.')).toBeInTheDocument();
  });

  it('sends a request and clears the form', async () => {
    const { fake, u } = await open('/account/requests', {
      'POST /requests': () => ticket(),
    });
    const button = await screen.findByRole('button', { name: 'Send request' });
    expect(button).toBeDisabled();
    await u.type(screen.getByLabelText('Tell us more'), 'Please change my postal address.');
    await u.click(button);
    expect(
      await screen.findByText(/We have your request\. We will answer here/),
    ).toBeInTheDocument();
    expect(fake.calls.find((c) => c.method === 'POST' && c.path === '/requests')!.body).toEqual({
      kind: 'general',
      body: 'Please change my postal address.',
    });
    expect(screen.getByLabelText('Tell us more')).toHaveValue('');
  });

  it('attaches a policy when one is chosen', async () => {
    const { fake, u } = await open('/account/requests', { 'POST /requests': () => ticket() });
    await u.selectOptions(await screen.findByLabelText('Which policy is it about?'), 'pol-1');
    await u.type(screen.getByLabelText('Tell us more'), 'A question about my policy.');
    await u.click(screen.getByRole('button', { name: 'Send request' }));
    await screen.findByText(/We have your request/);
    expect(
      fake.calls.find((c) => c.path === '/requests' && c.method === 'POST')!.body,
    ).toMatchObject({
      policyId: 'pol-1',
    });
  });

  it('asks for the case number when linking a case', async () => {
    const { fake, u } = await open('/account/requests', { 'POST /requests': () => ticket() });
    await u.selectOptions(await screen.findByLabelText('What do you need?'), 'link_case');
    const field = await screen.findByLabelText(/Case number/);
    await u.type(screen.getByLabelText('Tell us more'), 'It is my sister’s case.');
    expect(screen.getByRole('button', { name: 'Send request' })).toBeDisabled();
    await u.type(field, 'la-2026-0401');
    await u.click(screen.getByRole('button', { name: 'Send request' }));
    await screen.findByText(/We have your request/);
    expect(fake.calls.find((c) => c.path === '/requests' && c.method === 'POST')!.body).toEqual({
      kind: 'link_case',
      body: 'It is my sister’s case.',
      caseReference: 'la-2026-0401',
    });
    // The policy question does not apply to a case.
    expect(screen.queryByLabelText('Which policy is it about?')).not.toBeInTheDocument();
  });

  it('opens ready to add a person when it comes from the family list', async () => {
    await open('/account/requests/add_dependant');
    const select = (await screen.findByLabelText('What do you need?')) as HTMLSelectElement;
    expect(select.value).toBe('add_dependant');
  });

  it('is reached from the family list on the cover page', async () => {
    await open('/account/cover/pol-1', {
      'GET /policies/pol-1': () => ({
        ...policy,
        startDate: '2024-05-01',
        excessMinor: 0,
        perMatterLimitMinor: 50000,
        paymentMethod: 'ecocash',
        collectionDay: null,
        scheme: null,
        coveredFrom: [],
        family: [],
        exclusions: [],
      }),
    });
    expect(
      await screen.findByRole('link', { name: 'Ask to add or remove someone' }),
    ).toHaveAttribute('href', '#/account/requests/add_dependant');
  });

  it('shows the server’s words when a request is refused', async () => {
    const { u } = await open('/account/requests', {
      'POST /requests': () => {
        throw new PublicError(429, 'RATE_LIMITED', [], 600);
      },
    });
    await u.type(await screen.findByLabelText('Tell us more'), 'Please change my postal address.');
    await u.click(screen.getByRole('button', { name: 'Send request' }));
    expect(await screen.findByText('Too many tries. Please wait a few minutes.')).toBeVisible();
  });
});

describe('the Me page', () => {
  it('shows who is signed in, with only a hint of the phone number', async () => {
    await open('/account/profile');
    const details = await screen.findByRole('region', { name: 'Your details' });
    expect(within(details).getByText('Memory Dube')).toBeInTheDocument();
    expect(within(details).getByText('•••914')).toBeInTheDocument();
  });

  it('shows the reminders as chosen, and saves the change', async () => {
    const { fake, u } = await open('/account/profile', {
      'PUT /profile/notifications': (b) => b,
    });
    const renewal = await screen.findByRole('checkbox', { name: 'When my cover renews' });
    expect(renewal).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Court dates' })).toBeChecked();
    await u.click(renewal);
    await u.click(screen.getByRole('checkbox', { name: 'Court dates' }));
    await u.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Saved.')).toBeInTheDocument();
    expect(fake.calls.find((c) => c.method === 'PUT')!.body).toEqual({
      premium: true,
      hearing: false,
      request: true,
      renewal: true,
    });
  });

  it('changes the phone number in two steps, with the code sent to the old phone', async () => {
    const { fake, u } = await open('/account/profile', {
      'POST /profile/phone/codes': () => ({ message: 'sent', expiresInSeconds: 600 }),
      'POST /profile/phone': () => profile({ phoneHint: '•••222' }),
    });
    await u.type(await screen.findByLabelText('New phone number'), '0771 000 222');
    await u.click(screen.getByRole('button', { name: 'Send a code to my current phone' }));
    expect(
      await screen.findByText(/We sent a code to the phone we have for you/),
    ).toBeInTheDocument();
    const confirm = screen.getByRole('button', { name: 'Change my number' });
    expect(confirm).toBeDisabled();
    await u.type(screen.getByLabelText('The 6 digit code'), '654321');
    await u.click(confirm);
    expect(await screen.findByText('Your phone number was changed.')).toBeInTheDocument();
    expect(fake.calls.find((c) => c.path === '/profile/phone')!.body).toEqual({
      newPhone: '0771 000 222',
      code: '654321',
    });
  });

  it('says so, in plain words, when the number is already someone else’s', async () => {
    const { u } = await open('/account/profile', {
      'POST /profile/phone/codes': () => {
        throw new PublicError(409, 'PHONE_IN_USE');
      },
    });
    await u.type(await screen.findByLabelText('New phone number'), '0771 000 222');
    await u.click(screen.getByRole('button', { name: 'Send a code to my current phone' }));
    expect(
      await screen.findByText('We cannot use that number online. Please call us.'),
    ).toBeVisible();
  });

  it('asks us to close the account, rather than closing it', async () => {
    const { fake, u } = await open('/account/profile', { 'POST /requests': () => ticket() });
    await u.click(await screen.findByRole('button', { name: 'Ask to close my account' }));
    expect(await screen.findByText('We have your request.')).toBeInTheDocument();
    expect(
      fake.calls.find((c) => c.path === '/requests' && c.method === 'POST')!.body,
    ).toMatchObject({
      kind: 'close_account',
    });
    expect(screen.getByRole('button', { name: 'Ask to close my account' })).toBeDisabled();
  });

  it('has the common questions and a number to call', async () => {
    await open('/account/profile');
    expect(await screen.findByText('When can I claim?')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Call us on/ }).length).toBeGreaterThan(0);
  });
});

describe('the privacy notice', () => {
  it('is shown once, until accepted, and does not block the page', async () => {
    const { fake, u } = await open('/account', {
      'GET /profile': () => profile({ consentAccepted: false }),
      'GET /overview': () => ({
        firstName: 'Memory',
        policyCount: 0,
        policiesNeedingAttention: 0,
        attention: [],
        upcoming: [],
        policies: [],
        cases: [],
        activity: [],
      }),
      'POST /profile/consent': () => profile(),
    });
    expect(
      await screen.findByRole('heading', { name: 'How we use your information' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Coming up' })).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'I understand' }));
    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: 'How we use your information' }),
      ).not.toBeInTheDocument(),
    );
    expect(fake.calls.find((c) => c.path === '/profile/consent')!.body).toEqual({ accepted: true });
  });

  it('stays until it is accepted when the server cannot be reached', async () => {
    const { u } = await open('/account', {
      'GET /profile': () => profile({ consentAccepted: false }),
      'POST /profile/consent': () => {
        throw new PublicError(0, 'NETWORK');
      },
    });
    await u.click(await screen.findByRole('button', { name: 'I understand' }));
    expect(
      screen.getByRole('heading', { name: 'How we use your information' }),
    ).toBeInTheDocument();
  });

  it('is not shown to someone who has already accepted it', async () => {
    await open('/account');
    expect(
      screen.queryByRole('heading', { name: 'How we use your information' }),
    ).not.toBeInTheDocument();
  });
});

describe('accessibility', () => {
  const check = async (container: HTMLElement) => {
    const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations.map((v) => `${v.id}: ${v.nodes[0]?.html}`)).toEqual([]);
  };

  it.each([
    ['/account/requests', 'My requests'],
    ['/account/profile', 'Reminders by SMS'],
  ])('%s has no violations', async (hash, heading) => {
    const { container } = await open(hash, {
      'GET /requests': () => [ticket({ reply: 'Done.', status: 'done' })],
    });
    await screen.findByRole('heading', { name: heading });
    await check(container);
  });
});
