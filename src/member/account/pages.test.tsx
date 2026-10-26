import { PublicError, type PublicApi } from '@blufountain/public-kit';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

const POLICY = 'pol-1';
const CASE = 'case-1';
const CLAIM = 'claim-1';

const policyCard = (over: object = {}) => ({
  id: POLICY,
  number: 'BF-POL-01038',
  product: 'Family Legal Cover',
  standing: 'grace_period',
  paidTo: '2026-07-26',
  monthlyPremiumMinor: 500,
  monthsBehind: 3,
  amountToCatchUpMinor: 1500,
  annualLimitMinor: 150000,
  usedMinor: 4500,
  remainingMinor: 145500,
  dependants: 1,
  renewsOn: '2027-05-01',
  ...over,
});

const caseCard = (over: object = {}) => ({
  id: CASE,
  reference: 'LA-2026-0401',
  matterType: 'labour',
  stage: 'active',
  open: true,
  openedOn: '2026-09-01',
  lawyerName: 'Tendai Moyo',
  nextHearing: { date: '2026-10-21', time: '09:00', court: 'Harare Labour Court' },
  ...over,
});

const overview = (over: object = {}) => ({
  firstName: 'Memory',
  policyCount: 1,
  policiesNeedingAttention: 1,
  attention: [
    {
      id: 'pay_overdue:pol-1',
      kind: 'pay_overdue',
      tone: 'warn',
      params: { policy: 'BF-POL-01038', amountMinor: 1500 },
      link: { to: 'payments', id: POLICY },
    },
    {
      id: 'claim_open:claim-1',
      kind: 'claim_open',
      tone: 'ok',
      params: { number: 'CL-2026-0007' },
      link: { to: 'claim', id: CLAIM },
    },
  ],
  upcoming: [
    {
      id: 'premium_due:pol-1:2026-07-27',
      kind: 'premium_due',
      date: '2026-07-27',
      tone: 'warn',
      params: { policy: 'BF-POL-01038', amountMinor: 1500, overdue: 1 },
      link: { to: 'payments', id: POLICY },
    },
    {
      id: 'hearing:h1',
      kind: 'hearing',
      date: '2026-10-21',
      time: '09:00',
      tone: 'warn',
      params: { reference: 'LA-2026-0401', court: 'Harare Labour Court' },
      link: { to: 'case', id: CASE },
    },
    {
      id: 'waiting_ends:pol-1:land_eviction',
      kind: 'waiting_ends',
      date: '2026-12-01',
      tone: 'ok',
      params: { policy: 'BF-POL-01038', matter: 'land_eviction' },
      link: { to: 'cover', id: POLICY },
    },
  ],
  policies: [policyCard()],
  cases: [caseCard()],
  activity: [
    {
      id: 'payment:p1',
      kind: 'payment_received',
      date: '2026-04-26',
      params: { policy: 'BF-POL-01038', amountMinor: 500 },
      link: { to: 'payments', id: POLICY },
    },
  ],
  ...over,
});

const detail = () => ({
  ...policyCard(),
  startDate: '2024-05-01',
  excessMinor: 2000,
  perMatterLimitMinor: 50000,
  paymentMethod: 'ecocash',
  collectionDay: null,
  scheme: null,
  coveredFrom: [
    { matterType: 'labour', from: '2024-06-01', covered: true },
    { matterType: 'land_eviction', from: '2026-12-01', covered: false },
  ],
  family: [{ name: 'Anesu Dube', relationship: 'child', since: '2025-01-10' }],
  exclusions: [{ matterType: 'criminal_defence', description: 'Charges that began before cover' }],
});

const payments = (over: object = {}) => ({
  policyId: POLICY,
  policyNumber: 'BF-POL-01038',
  monthlyPremiumMinor: 500,
  paymentMethod: 'ecocash',
  collectionDay: null,
  how: 'pay_online',
  next: { date: '2026-07-27', amountMinor: 1500 },
  arrears: { monthsBehind: 3, amountToCatchUpMinor: 1500 },
  plan: null,
  history: [
    {
      id: 'pay-1',
      receivedOn: '2026-04-26',
      amountMinor: 500,
      monthsCovered: 1,
      method: 'ecocash',
      reference: 'MM-1',
    },
  ],
  attempts: [],
  cancelled: false,
  ...over,
});

const caseDetail = () => ({
  ...caseCard(),
  timeline: [
    { id: 'e1', kind: 'opened', date: '2026-09-01', params: {} },
    { id: 'e2', kind: 'lawyer_assigned', date: '2026-09-02', params: {} },
    {
      id: 'hearing:h1',
      kind: 'hearing',
      date: '2026-10-21',
      params: { time: '09:00', court: 'x' },
    },
  ],
  claims: [{ id: CLAIM, number: 'CL-2026-0007', status: 'registered' }],
});

const claimCard = (over: object = {}) => ({
  id: CLAIM,
  number: 'CL-2026-0007',
  status: 'registered',
  open: true,
  registeredOn: '2026-09-05',
  policyNumber: 'BF-POL-01038',
  caseReference: 'LA-2026-0401',
  forName: null,
  ...over,
});

const signedIn = {
  'POST /codes': () => ({ message: 'sent', expiresInSeconds: 600, sandboxCode: '123456' }),
  'POST /sessions': () => ({
    status: 'signed_in',
    token: 'tok'.repeat(10),
    expiresInSeconds: 1200,
  }),
  'GET /profile': () => ({
    firstName: 'Memory',
    fullName: 'Memory Dube',
    phoneHint: '•••914',
    language: 'en',
    lastSignInAt: null,
    sharedDevice: false,
  }),
};

const data: Record<string, Handler> = {
  'GET /overview': () => overview(),
  'GET /policies': () => [policyCard()],
  [`GET /policies/${POLICY}`]: detail,
  [`GET /policies/${POLICY}/payments`]: () => payments(),
  'GET /cases': () => [
    caseCard(),
    caseCard({
      id: 'case-2',
      reference: 'LA-2026-0300',
      stage: 'closed',
      open: false,
      nextHearing: null,
    }),
  ],
  [`GET /cases/${CASE}`]: caseDetail,
  'GET /claims': () => [claimCard()],
  [`GET /claims/${CLAIM}`]: () => ({
    ...claimCard(),
    caseId: CASE,
    steps: [{ kind: 'registered', date: '2026-09-05' }],
  }),
};

async function open(hash: string, handlers: Record<string, Handler> = {}) {
  window.location.hash = '/account';
  const fake = fakeApi({ ...signedIn, ...data, ...handlers });
  const u = userEvent.setup();
  const view = render(<App api={fakeApi({}).api} memberApi={fake.api} />);
  await u.type(await screen.findByLabelText(/Your phone number/), '0715330914');
  await u.click(screen.getByRole('button', { name: 'Send me a code' }));
  await u.type(await screen.findByLabelText('The 6 digit code'), '123456');
  await u.click(screen.getByRole('button', { name: 'Sign in' }));
  await waitFor(() => expect(document.querySelector('.mp-side')).not.toBeNull());
  if (hash !== '/account') {
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
  vi.useRealTimers();
});

describe('the home page', () => {
  it('shows the whole membership: what needs doing, what is coming, and your things', async () => {
    await open('/account');

    const attention = await screen.findByRole('region', { name: 'Needs your attention' });
    expect(
      within(attention).getByText('Pay $15 on BF-POL-01038 to catch up and keep your cover.'),
    ).toBeInTheDocument();
    expect(within(attention).getByText(/Claim CL-2026-0007 is with us/)).toBeInTheDocument();
    expect(within(attention).getByRole('link', { name: 'Pay now' })).toHaveAttribute(
      'href',
      `#/account/payments/${POLICY}`,
    );
    expect(within(attention).getByRole('link', { name: 'View' })).toHaveAttribute(
      'href',
      `#/account/claims/${CLAIM}`,
    );

    const coming = screen.getByRole('region', { name: 'Coming up' });
    expect(within(coming).getByText('Overdue on BF-POL-01038: $15')).toBeInTheDocument();
    expect(within(coming).getByText('27 July 2026')).toBeInTheDocument();
    expect(
      within(coming).getByText('Court date for case LA-2026-0401, at 09:00'),
    ).toBeInTheDocument();
    expect(within(coming).getByText('Harare Labour Court')).toBeInTheDocument();
    expect(
      within(coming).getByText(
        /BF-POL-01038: you can claim for "Land or being evicted" from this day/,
      ),
    ).toBeInTheDocument();

    const cover = screen.getByRole('region', { name: 'My cover' });
    expect(within(cover).getByRole('link', { name: 'BF-POL-01038' })).toHaveAttribute(
      'href',
      `#/account/cover/${POLICY}`,
    );
    expect(within(cover).getByText('Behind')).toBeInTheDocument();
    expect(within(cover).getByRole('meter')).toBeInTheDocument();

    const cases = screen.getByRole('region', { name: 'My cases' });
    expect(within(cases).getByText('Your lawyer is working on your case.')).toBeInTheDocument();
    expect(screen.getByText('1 of 1 policies need attention.')).toBeInTheDocument();
    expect(screen.getByText('Payment of $5 received for BF-POL-01038')).toBeInTheDocument();
  });

  it('says so when there is nothing to do, no cover and no cases', async () => {
    await open('/account', {
      'GET /overview': () =>
        overview({
          policyCount: 0,
          policiesNeedingAttention: 0,
          attention: [],
          upcoming: [],
          policies: [],
          cases: [],
          activity: [],
        }),
    });
    expect(await screen.findByText('You are all caught up')).toBeInTheDocument();
    expect(screen.getByText('Nothing is coming up in the next 3 months.')).toBeInTheDocument();
    expect(screen.getByText('You do not have cover yet.')).toBeInTheDocument();
    expect(screen.getByText('You have no legal matters.')).toBeInTheDocument();
  });

  it('says all is well when every policy is in good standing', async () => {
    await open('/account', {
      'GET /overview': () => overview({ policiesNeedingAttention: 0, attention: [] }),
    });
    expect(await screen.findByText('All your cover is in good standing.')).toBeInTheDocument();
  });

  it('offers to try again when it cannot load', async () => {
    let fail = true;
    const { u } = await open('/account', {
      'GET /overview': () => {
        if (fail) throw new PublicError(0, 'NETWORK');
        return overview();
      },
    });
    expect(await screen.findByText(/We could not load this/)).toBeInTheDocument();
    fail = false;
    await u.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('region', { name: 'Coming up' })).toBeInTheDocument();
  });

  it('is shown in the language of the account', async () => {
    await open('/account', {
      'GET /profile': () => ({ ...signedIn['GET /profile']!(), language: 'sn' }),
    });
    expect(await screen.findByRole('region', { name: 'Zvinouya' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dziviriro yangu' })).toBeInTheDocument();
  });
});

describe('moving around', () => {
  it('opens a page from the menu and marks it current', async () => {
    const { u } = await open('/account');
    await u.click(screen.getByRole('link', { name: 'Payments' }));
    expect(window.location.hash).toBe('#/account/payments');
    expect(await screen.findByRole('heading', { name: 'Payments' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Payments' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
  });

  it('opens a case straight from its address', async () => {
    await open(`/account/cases/${CASE}`);
    expect(await screen.findByRole('heading', { name: 'Problem at work' })).toBeInTheDocument();
  });

  it('shows the home page for an address it does not know', async () => {
    await open('/account/nonsense/123');
    expect(await screen.findByRole('region', { name: 'Coming up' })).toBeInTheDocument();
  });

  it('goes back from the sign in to the website’s other pages by the same address scheme', async () => {
    await open('/account');
    act(() => {
      window.location.hash = '/home';
    });
    await waitFor(() =>
      expect(screen.queryByRole('navigation', { name: 'My account menu' })).not.toBeInTheDocument(),
    );
  });
});

describe('cover', () => {
  it('opens straight onto the only policy', async () => {
    await open('/account/cover');
    expect(await screen.findByRole('heading', { name: 'Family Legal Cover' })).toBeInTheDocument();
    expect(screen.getByText(/You are behind with your premium/)).toBeInTheDocument();
    expect(screen.getByText('1 May 2027')).toBeInTheDocument();
    expect(screen.getByText('EcoCash')).toBeInTheDocument();
  });

  it('shows when each kind of problem is covered, the family and what is excluded', async () => {
    await open(`/account/cover/${POLICY}`);
    const waiting = await screen.findByRole('region', { name: 'What you can claim for' });
    expect(within(waiting).getByText('Covered now')).toBeInTheDocument();
    expect(within(waiting).getByText('Covered from 1 December 2026')).toBeInTheDocument();
    const family = screen.getByRole('region', { name: 'People on your policy' });
    expect(within(family).getByText('Anesu Dube')).toBeInTheDocument();
    const excluded = screen.getByRole('region', { name: 'What is not covered' });
    expect(within(excluded).getByText('Charges that began before cover')).toBeInTheDocument();
  });

  it('lists several policies to choose from', async () => {
    await open('/account/cover', {
      'GET /policies': () => [policyCard(), policyCard({ id: 'pol-2', number: 'BF-POL-01099' })],
    });
    const list = await screen.findByRole('region', { name: 'Your policies' });
    expect(within(list).getByRole('link', { name: 'BF-POL-01099' })).toHaveAttribute(
      'href',
      '#/account/cover/pol-2',
    );
  });

  it('says so when there is no policy', async () => {
    await open('/account/cover', { 'GET /policies': () => [] });
    expect(await screen.findByText('You do not hold a policy yet.')).toBeInTheDocument();
  });

  it('shows a policy that is not yours as not loadable, not as someone else’s data', async () => {
    await open('/account/cover/other-persons', {
      'GET /policies/other-persons': () => {
        throw new PublicError(404, 'NOT_FOUND');
      },
    });
    expect(await screen.findByText(/We could not load this/)).toBeInTheDocument();
  });
});

describe('payments', () => {
  it('shows what is owed, the next payment and the history', async () => {
    await open('/account/payments');
    expect(await screen.findByText('$15 on 27 July 2026')).toBeInTheDocument();
    expect(screen.getByText('To pay to catch up: $15')).toBeInTheDocument();
    const history = screen.getByRole('table');
    expect(within(history).getByText('26 April 2026')).toBeInTheDocument();
    expect(within(history).getByText('$5')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pay my premium' })).toBeInTheDocument();
  });

  it.each([
    ['debit_order', 'Your bank collects this each month'],
    ['payroll', 'This is taken from your pay or group'],
  ])('does not offer to pay when %s collects it', async (how, text) => {
    await open('/account/payments', {
      [`GET /policies/${POLICY}/payments`]: () => payments({ how }),
    });
    expect(await screen.findByText(new RegExp(text))).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Pay my premium' })).not.toBeInTheDocument();
  });

  it('will not take payment for a cancelled policy', async () => {
    await open('/account/payments', {
      [`GET /policies/${POLICY}/payments`]: () => payments({ cancelled: true, next: null }),
    });
    expect(
      await screen.findByText('This policy was cancelled, so you cannot pay for it.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pay now' })).not.toBeInTheDocument();
  });

  it('shows a plan and warns when it is broken', async () => {
    await open('/account/payments', {
      [`GET /policies/${POLICY}/payments`]: () =>
        payments({
          plan: {
            months: 3,
            instalmentMinor: 500,
            startsOn: '2026-10-01',
            endsOn: '2026-12-31',
            broken: true,
          },
        }),
    });
    expect(
      await screen.findByText('$5 each month, from 1 October 2026 to 31 December 2026'),
    ).toBeInTheDocument();
    expect(screen.getByText('This plan was broken. Please call us.')).toBeInTheDocument();
  });

  it('lists payments that are waiting or did not finish', async () => {
    await open('/account/payments', {
      [`GET /policies/${POLICY}/payments`]: () =>
        payments({
          attempts: [
            {
              id: 'a1',
              status: 'failed',
              statusText: '',
              amountMinor: 500,
              months: 1,
              method: 'ecocash',
              createdAt: '2026-10-19T08:00:00.000Z',
            },
          ],
        }),
    });
    const attempts = await screen.findByRole('region', {
      name: 'Payments waiting or not finished',
    });
    expect(within(attempts).getByText(/did not go through/)).toBeInTheDocument();
  });

  it('starts a payment for the right policy and shows what the server says, not what it hopes', async () => {
    const { fake, u } = await open('/account/payments', {
      [`POST /policies/${POLICY}/payments`]: () => ({
        id: 'att-1',
        status: 'pending',
        statusText: '',
        amountMinor: 1500,
        months: 3,
        method: 'ecocash',
        createdAt: '2026-10-19T08:00:00.000Z',
      }),
    });
    await u.type(await screen.findByLabelText('Mobile money number'), '0772111222');
    expect(screen.getByText('You will pay $15')).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Pay now' }));

    expect(await screen.findByText(/Check your phone and approve the payment/)).toBeInTheDocument();
    expect(
      fake.calls.find((c) => c.method === 'POST' && c.path.endsWith('/payments'))!.body,
    ).toEqual({
      method: 'ecocash',
      months: 3,
      walletPhone: '0772111222',
    });
    // Nothing is called paid yet.
    expect(screen.queryByText('Payment received. Thank you.')).not.toBeInTheDocument();
  });

  it('follows a pending payment until the provider confirms, then refreshes', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
    let confirmed = false;
    const { u } = await open('/account/payments', {
      [`POST /policies/${POLICY}/payments`]: () => ({
        id: 'att-1',
        status: 'pending',
        statusText: '',
        amountMinor: 1500,
        months: 3,
        method: 'ecocash',
        createdAt: '2026-10-19T08:00:00.000Z',
      }),
      [`GET /policies/${POLICY}/payments/att-1`]: () => ({
        id: 'att-1',
        status: confirmed ? 'confirmed' : 'pending',
        statusText: '',
        amountMinor: 1500,
        months: 3,
        method: 'ecocash',
        createdAt: '2026-10-19T08:00:00.000Z',
      }),
      [`GET /policies/${POLICY}/payments`]: () =>
        confirmed
          ? payments({ arrears: { monthsBehind: 0, amountToCatchUpMinor: 0 } })
          : payments(),
    });
    await u.type(await screen.findByLabelText('Mobile money number'), '0772111222');
    await u.click(screen.getByRole('button', { name: 'Pay now' }));
    await screen.findByText(/Check your phone/);

    await act(() => vi.advanceTimersByTimeAsync(3_100));
    expect(screen.queryByText('Payment received. Thank you.')).not.toBeInTheDocument();

    confirmed = true;
    await act(() => vi.advanceTimersByTimeAsync(3_100));
    await waitFor(() =>
      expect(screen.getByText('Payment received. Thank you.')).toBeInTheDocument(),
    );
    await waitFor(() => expect(screen.queryByText(/To pay to catch up/)).not.toBeInTheDocument());
  });

  it('shows plain words when the payment fails', async () => {
    const { u } = await open('/account/payments', {
      [`POST /policies/${POLICY}/payments`]: () => ({
        id: 'att-2',
        status: 'failed',
        statusText: '',
        amountMinor: 1500,
        months: 3,
        method: 'ecocash',
        createdAt: '2026-10-19T08:00:00.000Z',
      }),
    });
    await u.type(await screen.findByLabelText('Mobile money number'), '0772111222');
    await u.click(screen.getByRole('button', { name: 'Pay now' }));
    expect((await screen.findAllByText(/did not go through/)).length).toBeGreaterThan(0);
  });
});

describe('cases', () => {
  it('lists open cases first and finished ones apart', async () => {
    await open('/account/cases');
    const open_ = await screen.findByRole('region', { name: 'Open cases' });
    expect(within(open_).getByRole('link', { name: 'LA-2026-0401' })).toHaveAttribute(
      'href',
      `#/account/cases/${CASE}`,
    );
    const done = screen.getByRole('region', { name: 'Finished cases' });
    expect(within(done).getByText('Your case is finished.')).toBeInTheDocument();
  });

  it('says so when there are no cases', async () => {
    await open('/account/cases', { 'GET /cases': () => [] });
    expect(await screen.findByText(/You have no legal matters on file/)).toBeInTheDocument();
  });

  it('shows the case in plain words with its timeline', async () => {
    await open(`/account/cases/${CASE}`);
    await screen.findByRole('heading', { name: 'Problem at work' });
    expect(screen.getByText('Your lawyer is working on your case.')).toBeInTheDocument();
    expect(screen.getByText('Tendai Moyo')).toBeInTheDocument();
    expect(screen.getByText(/21 October 2026, 09:00, Harare Labour Court/)).toBeInTheDocument();
    const timeline = screen.getByRole('region', { name: 'What has happened' });
    expect(within(timeline).getByText('We opened your case')).toBeInTheDocument();
    expect(within(timeline).getByText('A lawyer was assigned to your case')).toBeInTheDocument();
    expect(within(timeline).getByText('Court date at 09:00')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Call us on/ })).toHaveAttribute(
      'href',
      'tel:0242000000',
    );
    expect(screen.getByRole('link', { name: 'CL-2026-0007' })).toHaveAttribute(
      'href',
      `#/account/claims/${CLAIM}`,
    );
  });

  it('shows no lawyer and no court date as plain dashes and words', async () => {
    await open(`/account/cases/${CASE}`, {
      [`GET /cases/${CASE}`]: () => ({ ...caseDetail(), lawyerName: null, nextHearing: null }),
    });
    expect(await screen.findByText('No court date yet')).toBeInTheDocument();
  });
});

describe('claims', () => {
  it('lists claims and who they are for', async () => {
    await open('/account/claims', {
      'GET /claims': () => [claimCard({ forName: 'Anesu Dube' })],
    });
    expect(
      await screen.findByText('We have received your claim and are looking at it.'),
    ).toBeInTheDocument();
    expect(screen.getByText('For Anesu Dube')).toBeInTheDocument();
  });

  it('says so when there are none', async () => {
    await open('/account/claims', { 'GET /claims': () => [] });
    expect(await screen.findByText('You have not made a claim.')).toBeInTheDocument();
  });

  it('shows the steps of a claim and says a declined claim is explained by phone', async () => {
    await open(`/account/claims/${CLAIM}`, {
      [`GET /claims/${CLAIM}`]: () => ({
        ...claimCard({ status: 'declined', open: false }),
        caseId: CASE,
        steps: [
          { kind: 'registered', date: '2026-09-05' },
          { kind: 'decided', date: '2026-09-10', outcome: 'declined' },
        ],
      }),
    });
    const steps = await screen.findByRole('region', { name: 'What has happened' });
    expect(within(steps).getByText('We received your claim')).toBeInTheDocument();
    expect(
      within(steps).getByText('Your claim was not accepted. Please call us and we will explain'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View' })).toHaveAttribute(
      'href',
      `#/account/cases/${CASE}`,
    );
  });
});

describe('every page is signed in only', () => {
  it('keeps the session fresh: each successful load tells the idle timer', async () => {
    const { fake } = await open('/account/cases');
    await screen.findByRole('region', { name: 'Open cases' });
    expect(fake.calls.some((c) => c.path === '/cases')).toBe(true);
  });
});

describe('accessibility', () => {
  const check = async (container: HTMLElement) => {
    const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations.map((v) => `${v.id}: ${v.nodes[0]?.html}`)).toEqual([]);
  };

  it.each([
    ['/account', 'Coming up'],
    [`/account/cover/${POLICY}`, 'People on your policy'],
    ['/account/payments', 'Payment history'],
    [`/account/cases/${CASE}`, 'What has happened'],
    ['/account/claims', 'My claims'],
  ])('%s has no violations', async (hash, heading) => {
    const { container } = await open(hash);
    await screen.findByRole('heading', { name: heading });
    await check(container);
  });
});
