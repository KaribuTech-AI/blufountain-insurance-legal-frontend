import { LANGUAGE_SWITCH, PublicError, type PublicApi } from '@blufountain/public-kit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import App from './App';

const api: PublicApi = {
  setToken: () => undefined,
  hasToken: () => false,
  get: (() => Promise.reject(new PublicError(404, 'NOT_FOUND'))) as PublicApi['get'],
  send: (() => Promise.reject(new PublicError(429, 'RATE_LIMITED'))) as PublicApi['send'],
  challenge: () => Promise.resolve('1.token'),
};

const policy = {
  number: 'BF-POL-01033',
  holderFirstName: 'Rudo',
  product: 'Family Legal Cover',
  standing: 'active',
  standingText: 'Your cover is active.',
  paidTo: '2026-11-30',
  monthlyPremiumMinor: 500,
  monthsBehind: 0,
  amountToCatchUpMinor: 0,
  annualLimitMinor: 150000,
  usedMinor: 0,
  remainingMinor: 150000,
  dependants: 0,
  coveredFrom: [{ matterType: 'labour', from: '2026-01-01', covered: true }],
};

const memberApi: PublicApi = {
  setToken: () => undefined,
  hasToken: () => true,
  get: (async (path: string) => {
    if (path === '/member/policy') return policy;
    if (path === '/member/claims') return [];
    throw new PublicError(404, 'NOT_FOUND');
  }) as PublicApi['get'],
  send: (async (_m: string, path: string) => {
    if (path === '/codes') return { message: 'sent', expiresInSeconds: 600, sandboxCode: '123456' };
    if (path === '/sessions') return { token: 'tok'.repeat(10) };
    throw new PublicError(404, 'NOT_FOUND');
  }) as PublicApi['send'],
  challenge: () => Promise.resolve('1.token'),
};

/** Automated checks catch missing labels, names, roles and landmarks. They do not replace a person using a screen reader. */
async function violations(container: HTMLElement) {
  const result = await axe.run(container, {
    // jsdom has no layout, so colour contrast is checked in the browser audit instead.
    rules: { 'color-contrast': { enabled: false } },
  });
  return result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.html).join(' | ')}`);
}

describe('accessibility (automated, E11.3)', () => {
  it('home page', async () => {
    const { container } = render(<App api={api} />);
    expect(await violations(container)).toEqual([]);
  });

  it('check my case, including an error message', async () => {
    const u = userEvent.setup();
    const { container } = render(<App api={api} />);
    await u.click(screen.getAllByRole('link', { name: 'Check my case' })[0]!);
    expect(await violations(container)).toEqual([]);
    await u.type(screen.getByLabelText(/Case number/), 'LA-2026-0398');
    await u.type(screen.getByLabelText(/Your phone number/), '0772418552');
    await u.click(screen.getByRole('button', { name: 'Send me a code' }));
    await screen.findByRole('alert');
    expect(await violations(container)).toEqual([]);
  });

  it('ask for legal help', async () => {
    const u = userEvent.setup();
    const { container } = render(<App api={api} />);
    await u.click(screen.getAllByRole('link', { name: 'Ask for legal help' })[0]!);
    expect(await violations(container)).toEqual([]);
  });

  it.runIf(LANGUAGE_SWITCH)('every language, including the draft notice', async () => {
    const u = userEvent.setup();
    const { container } = render(<App api={api} />);
    for (const name of ['chiShona', 'isiNdebele', 'English']) {
      await u.click(screen.getByRole('button', { name }));
      expect(await violations(container), name).toEqual([]);
    }
  });

  it('can be used with the keyboard alone', async () => {
    const u = userEvent.setup();
    render(<App api={api} />);
    await u.tab();
    expect(screen.getByRole('link', { name: 'Skip to the page' })).toHaveFocus();
    // Then the phone number and the theme, then the brand and the site menu.
    await u.tab();
    expect(document.activeElement).toHaveTextContent('0242 000 000');
    await u.tab();
    expect(screen.getByRole('button', { name: /theme/ })).toHaveFocus();
    await u.tab();
    expect(screen.getAllByRole('link', { name: /Blufountain/ })[0]).toHaveFocus();
    for (const name of [
      'Services',
      'Who we serve',
      'How it works',
      'Membership',
      'About',
      'Contact',
    ]) {
      await u.tab();
      expect(document.activeElement).toHaveTextContent(name);
      expect(document.activeElement?.closest('nav')).not.toBeNull();
    }
    await u.click(screen.getAllByRole('link', { name: 'Check my case' })[0]!);
    expect(screen.getByRole('heading', { name: 'Check my case' })).toBeInTheDocument();
  });

  it('member sign in is by phone number alone, and is clean', async () => {
    window.location.hash = '/member';
    const { container } = render(<App api={memberApi} />);
    await screen.findByLabelText(/Your phone number/);
    expect(screen.queryByLabelText(/Policy number/)).not.toBeInTheDocument();
    expect(await violations(container)).toEqual([]);
  });
});
