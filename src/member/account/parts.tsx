import type { ActivityItem, AttentionItem, UpcomingItem } from '@blufountain/domain';
import { useI18n } from '@blufountain/i18n/react';
import { Pill } from '@blufountain/public-kit';
import type { ReactNode } from 'react';
import { hrefOfTarget, money, word, type Loaded } from './kit';

type Params = Record<string, string | number>;

/** Shows the answer, or says it could not be loaded and offers to try again. */
export function Loading<T>({
  loaded,
  children,
}: {
  loaded: Loaded<T>;
  children: (data: T) => ReactNode;
}) {
  const { t } = useI18n();
  if (loaded.failed) {
    return (
      <div className="mp-card" role="alert">
        <p>{t('acct.loadFailed')}</p>
        <button type="button" className="mp-btn" onClick={loaded.reload}>
          {t('acct.retry')}
        </button>
      </div>
    );
  }
  if (!loaded.data) return <p className="mp-muted">{t('common.loading')}</p>;
  return <>{children(loaded.data)}</>;
}

export const toneClass = (tone: 'bad' | 'warn' | 'ok') =>
  tone === 'bad' ? 'mp-task mp-bad' : tone === 'warn' ? 'mp-task mp-warn' : 'mp-task';

/** The sentence for something that needs attention. */
export function useAttentionText() {
  const { t, date } = useI18n();
  return (item: AttentionItem): string => {
    const p: Params = item.params;
    switch (item.kind) {
      case 'pay_overdue':
        return t('acct.att.pay_overdue', {
          policy: String(p.policy),
          amount: money(Number(p.amountMinor)),
        });
      case 'pay_soon':
        return t('acct.att.pay_soon', { policy: String(p.policy), date: date(String(p.date)) });
      case 'claim_open':
        return t('acct.att.claim_open', { number: String(p.number) });
    }
  };
}

/** The sentence for a dated item. */
export function useUpcomingText() {
  const { t } = useI18n();
  return (item: UpcomingItem): string => {
    const p: Params = item.params;
    switch (item.kind) {
      case 'premium_due':
        return t(p.overdue ? 'acct.up.premium_overdue' : 'acct.up.premium_due', {
          policy: String(p.policy),
          amount: money(Number(p.amountMinor)),
        });
      case 'plan_instalment':
        return t('acct.up.plan_instalment', {
          policy: String(p.policy),
          amount: money(Number(p.amountMinor)),
        });
      case 'renewal':
        return t('acct.up.renewal', { policy: String(p.policy) });
      case 'waiting_ends':
        return t('acct.up.waiting_ends', {
          policy: String(p.policy),
          matter: word(t, 'matter', String(p.matter)),
        });
      case 'hearing':
        return t('acct.up.hearing', { reference: String(p.reference), time: item.time ?? '' });
    }
  };
}

export function useActivityText() {
  const { t } = useI18n();
  return (item: ActivityItem): string => {
    const p: Params = item.params;
    switch (item.kind) {
      case 'payment_received':
        return t('acct.recent.payment_received', {
          policy: String(p.policy),
          amount: money(Number(p.amountMinor)),
        });
      case 'claim_registered':
        return t('acct.recent.claim_registered', { number: String(p.number) });
      case 'case_opened':
        return t('acct.recent.case_opened', { reference: String(p.reference) });
    }
  };
}

export function StandingPill({ standing }: { standing: string }) {
  const { t } = useI18n();
  const tone =
    standing === 'lapsed' || standing === 'cancelled'
      ? 'bad'
      : standing === 'grace_period' || standing === 'not_started'
        ? 'warn'
        : 'ok';
  return <Pill tone={tone}>{word(t, 'acct.standing', standing)}</Pill>;
}

export { hrefOfTarget };
