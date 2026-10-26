import type { MemberOverview } from '@blufountain/domain';
import { useI18n } from '@blufountain/i18n/react';
import { Meter } from '@blufountain/public-kit';
import { hrefFor, hrefOfTarget, money, useMemberData, word } from './kit';
import {
  Loading,
  StandingPill,
  toneClass,
  useActivityText,
  useAttentionText,
  useUpcomingText,
} from './parts';

/** The whole membership on one screen: what needs attention, what is coming up, and your things. */
export function HomePage() {
  const overview = useMemberData<MemberOverview>('/overview');
  return <Loading loaded={overview}>{(o) => <Overview o={o} />}</Loading>;
}

function Overview({ o }: { o: MemberOverview }) {
  const { t, date } = useI18n();
  const attentionText = useAttentionText();
  const upcomingText = useUpcomingText();
  const activityText = useActivityText();
  const openCases = o.cases.filter((c) => c.open);

  return (
    <div className="mp-stack">
      {o.policyCount > 0 && (
        <p className="mp-status" role="status">
          {o.policiesNeedingAttention === 0
            ? t('acct.home.summary.ok')
            : t('acct.home.summary.some', {
                n: o.policiesNeedingAttention,
                count: o.policyCount,
              })}
        </p>
      )}

      <section className="mp-card" aria-labelledby="attention-h">
        <h2 id="attention-h">{t('portal.attention')}</h2>
        {o.attention.length === 0 ? (
          <div className="mp-empty">
            <b>{t('portal.caughtUp')}</b>
            <span>{t('portal.caughtUp.body')}</span>
          </div>
        ) : (
          <ul className="mp-tasks">
            {o.attention.map((a) => (
              <li key={a.id} className={toneClass(a.tone)}>
                <div>
                  <span>{attentionText(a)}</span>
                </div>
                <a className="mp-btn" href={hrefOfTarget(a.link)}>
                  {a.kind === 'pay_overdue' || a.kind === 'pay_soon'
                    ? t('portal.act.pay')
                    : t('portal.act.view')}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mp-card" aria-labelledby="upcoming-h">
        <h2 id="upcoming-h">{t('acct.home.upcoming')}</h2>
        {o.upcoming.length === 0 ? (
          <p className="mp-muted">{t('acct.home.upcoming.none')}</p>
        ) : (
          <ul className="mp-tasks">
            {o.upcoming.map((u) => (
              <li key={u.id} className={toneClass(u.tone)}>
                <div>
                  <b>{date(u.date)}</b>
                  <span>{upcomingText(u)}</span>
                  {u.kind === 'hearing' && u.params.court ? (
                    <span>{String(u.params.court)}</span>
                  ) : null}
                </div>
                {u.link && (
                  <a className="mp-btn" href={hrefOfTarget(u.link)}>
                    {t('portal.act.view')}
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mp-card" aria-labelledby="policies-h">
        <h2 id="policies-h">{t('acct.home.policies')}</h2>
        {o.policies.length === 0 ? (
          <p className="mp-muted">{t('acct.home.nopolicy')}</p>
        ) : (
          <ul className="mp-list">
            {o.policies.map((p) => {
              const percent = p.annualLimitMinor ? (p.usedMinor / p.annualLimitMinor) * 100 : 0;
              return (
                <li key={p.id} className="mp-row">
                  <div>
                    <a href={hrefFor('cover', p.id)}>
                      <b>{p.number}</b>
                    </a>{' '}
                    <StandingPill standing={p.standing} />
                    <p className="mp-muted">
                      {p.product} · {t('member.paidTo', { date: date(p.paidTo) })}
                    </p>
                    <Meter
                      percent={percent}
                      label={t('member.usedOf', {
                        used: money(p.usedMinor),
                        limit: money(p.annualLimitMinor),
                      })}
                    />
                    <p className="mp-muted">
                      {t('member.usedOf', {
                        used: money(p.usedMinor),
                        limit: money(p.annualLimitMinor),
                      })}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mp-card" aria-labelledby="cases-h">
        <h2 id="cases-h">{t('acct.home.cases')}</h2>
        {o.cases.length === 0 ? (
          <p className="mp-muted">{t('acct.home.nocase')}</p>
        ) : (
          <>
            <ul className="mp-list">
              {(openCases.length > 0 ? openCases : o.cases).map((c) => (
                <li key={c.id} className="mp-row">
                  <div>
                    <a href={hrefFor('cases', c.id)}>
                      <b>{c.reference}</b>
                    </a>{' '}
                    <span className="mp-muted">{word(t, 'matter', c.matterType)}</span>
                    <p>{word(t, 'acct.stage', c.stage)}</p>
                    {c.nextHearing && (
                      <p className="mp-muted">
                        {t('check.nextCourt')}: {date(c.nextHearing.date)}, {c.nextHearing.time}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <p>
              <a href={hrefFor('cases')}>{t('acct.home.seeAll')}</a>
            </p>
          </>
        )}
      </section>

      {o.activity.length > 0 && (
        <section className="mp-card" aria-labelledby="activity-h">
          <h2 id="activity-h">{t('acct.home.activity')}</h2>
          <ul className="mp-list">
            {o.activity.map((a) => (
              <li key={a.id} className="mp-row">
                <span>{activityText(a)}</span>
                <span className="mp-muted">{date(a.date)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
