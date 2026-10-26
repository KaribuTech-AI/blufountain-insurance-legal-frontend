import type { MemberPayments, MemberPolicyCard, PaymentAttempt } from '@blufountain/domain';
import { useI18n } from '@blufountain/i18n/react';
import { Button, Choices, Field, Form, Select, Status, useAction } from '@blufountain/public-kit';
import { useEffect, useState } from 'react';
import { hrefFor, money, useAccount, useMemberData, word } from './kit';
import { Loading } from './parts';

const POLL_MS = 3_000;
const GIVE_UP_MS = 5 * 60_000;

/** Payments for one policy. With one policy it opens straight onto it. */
export function PaymentsPage({ id }: { id: string | undefined }) {
  const list = useMemberData<MemberPolicyCard[]>(id ? null : '/policies');
  if (id) return <ForPolicy id={id} />;
  return (
    <Loading loaded={list}>
      {(items) =>
        items.length === 1 ? <ForPolicy id={items[0]!.id} /> : <PolicyChoice items={items} />
      }
    </Loading>
  );
}

function PolicyChoice({ items }: { items: MemberPolicyCard[] }) {
  const { t } = useI18n();
  return (
    <div className="mp-stack">
      <h1>{t('acct.nav.payments')}</h1>
      <section className="mp-card" aria-labelledby="pick-h">
        <h2 id="pick-h">{t('acct.cover.pick')}</h2>
        {items.length === 0 ? (
          <p className="mp-muted">{t('acct.cover.none')}</p>
        ) : (
          <ul className="mp-list">
            {items.map((p) => (
              <li key={p.id} className="mp-row">
                <a href={hrefFor('payments', p.id)}>
                  <b>{p.number}</b>
                </a>
                <span className="mp-muted">{p.product}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ForPolicy({ id }: { id: string }) {
  const payments = useMemberData<MemberPayments>(`/policies/${id}/payments`);
  return <Loading loaded={payments}>{(p) => <Payments p={p} reload={payments.reload} />}</Loading>;
}

function Payments({ p, reload }: { p: MemberPayments; reload: () => void }) {
  const { t, date } = useI18n();
  const canPay = p.how === 'pay_online' && !p.cancelled;

  return (
    <div className="mp-stack">
      <header className="mp-head">
        <p className="mp-eyebrow">{p.policyNumber}</p>
        <h1>{t('acct.nav.payments')}</h1>
      </header>

      <section className="mp-card" aria-labelledby="next-h">
        <h2 id="next-h">{t('acct.pay.next')}</h2>
        {p.cancelled ? (
          <p>{t('acct.pay.cancelled')}</p>
        ) : (
          <>
            {p.next && (
              <p className="mp-big">
                {t('acct.pay.due', { amount: money(p.next.amountMinor), date: date(p.next.date) })}
              </p>
            )}
            {p.arrears.amountToCatchUpMinor > 0 && (
              <p className="mp-status" role="status">
                {t('acct.pay.arrears', { amount: money(p.arrears.amountToCatchUpMinor) })}
              </p>
            )}
            {p.how !== 'pay_online' && (
              <p>{t(`acct.pay.how.${p.how}` as 'acct.pay.how.payroll')}</p>
            )}
          </>
        )}
        <dl className="mp-facts">
          <div>
            <dt>{t('member.premium')}</dt>
            <dd>{money(p.monthlyPremiumMinor)}</dd>
          </div>
          <div>
            <dt>{t('acct.cover.method')}</dt>
            <dd>{word(t, 'acct.method', p.paymentMethod)}</dd>
          </div>
        </dl>
      </section>

      {p.plan && (
        <section className="mp-card" aria-labelledby="plan-h">
          <h2 id="plan-h">{t('acct.pay.plan')}</h2>
          <p>
            {t('acct.pay.plan.body', {
              amount: money(p.plan.instalmentMinor),
              from: date(p.plan.startsOn),
              to: date(p.plan.endsOn),
            })}
          </p>
          {p.plan.broken && <p role="alert">{t('acct.pay.plan.broken')}</p>}
        </section>
      )}

      {canPay && <PayForm p={p} onPaid={reload} />}

      {p.attempts.length > 0 && (
        <section className="mp-card" aria-labelledby="attempts-h">
          <h2 id="attempts-h">{t('acct.pay.attempts')}</h2>
          <ul className="mp-list">
            {p.attempts.map((a) => (
              <li key={a.id} className="mp-row">
                <span>{attemptText(t, a)}</span>
                <span className="mp-muted">{money(a.amountMinor)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mp-card" aria-labelledby="history-h">
        <h2 id="history-h">{t('acct.pay.history')}</h2>
        {p.history.length === 0 ? (
          <p className="mp-muted">{t('acct.pay.history.none')}</p>
        ) : (
          <table className="mp-table">
            <thead>
              <tr>
                <th scope="col">{t('acct.pay.col.date')}</th>
                <th scope="col">{t('acct.pay.col.amount')}</th>
                <th scope="col">{t('acct.pay.col.months')}</th>
                <th scope="col">{t('acct.pay.col.method')}</th>
              </tr>
            </thead>
            <tbody>
              {p.history.map((h) => (
                <tr key={h.id}>
                  <th scope="row">{date(h.receivedOn)}</th>
                  <td>{money(h.amountMinor)}</td>
                  <td>{h.monthsCovered}</td>
                  <td>{word(t, 'acct.method', h.method)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function attemptText(t: ReturnType<typeof useI18n>['t'], a: PaymentAttempt) {
  return {
    pending: t('pay.waiting'),
    confirmed: t('pay.done'),
    failed: t('pay.failed'),
    needs_review: t('pay.review'),
  }[a.status];
}

/**
 * Starts a mobile money payment and then watches it. Nothing counts as paid until the provider
 * has told the server (BR-50): the page only reports what the server says.
 */
function PayForm({ p, onPaid }: { p: MemberPayments; onPaid: () => void }) {
  const { t } = useI18n();
  const { api } = useAccount();
  const [months, setMonths] = useState(Math.max(1, p.arrears.monthsBehind));
  const [method, setMethod] = useState<'ecocash' | 'onemoney'>('ecocash');
  const [wallet, setWallet] = useState('');
  const [attempt, setAttempt] = useState<PaymentAttempt>();

  const start = useAction(
    () =>
      api.send<PaymentAttempt>('POST', `/policies/${p.policyId}/payments`, {
        method,
        months,
        walletPhone: wallet,
      }),
    setAttempt,
  );

  const pendingId = attempt?.status === 'pending' ? attempt.id : undefined;
  useEffect(() => {
    if (!pendingId) return;
    const started = Date.now();
    const timer = setInterval(() => {
      if (Date.now() - started > GIVE_UP_MS) {
        clearInterval(timer);
        return;
      }
      api
        .get<PaymentAttempt>(`/policies/${p.policyId}/payments/${pendingId}`)
        .then((next) => {
          setAttempt(next);
          if (next.status !== 'pending') {
            clearInterval(timer);
            onPaid();
          }
        })
        .catch(() => undefined);
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [api, p.policyId, pendingId, onPaid]);

  return (
    <section className="mp-card" aria-labelledby="pay-h">
      <h2 id="pay-h">{t('pay.title')}</h2>
      <Form onSubmit={() => void start.run()} error={start.error}>
        <Select
          label={t('pay.months')}
          value={String(months)}
          onChange={(v) => setMonths(Number(v))}
          options={Array.from({ length: 12 }, (_, i) => ({
            value: String(i + 1),
            label: String(i + 1),
          }))}
        />
        <Choices
          legend={t('pay.method')}
          value={method}
          onChange={setMethod}
          options={[
            { value: 'ecocash', label: t('pay.ecocash') },
            { value: 'onemoney', label: t('pay.onemoney') },
          ]}
        />
        <Field
          label={t('pay.wallet')}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          error={start.error?.fieldMessage('walletPhone')}
          required
        />
        <p className="pk-total pk-big">
          {t('pay.total', { amount: money(months * p.monthlyPremiumMinor) })}
        </p>
        <Button
          type="submit"
          busy={start.busy || attempt?.status === 'pending'}
          disabled={!wallet.trim()}
        >
          {start.busy ? t('common.loading') : t('pay.start')}
        </Button>
      </Form>
      {attempt && (
        <Status good={attempt.status === 'confirmed'}>
          {attempt.status === 'pending'
            ? `${t('pay.approve')} ${t('pay.waiting')}`
            : attemptText(t, attempt)}
        </Status>
      )}
    </section>
  );
}
