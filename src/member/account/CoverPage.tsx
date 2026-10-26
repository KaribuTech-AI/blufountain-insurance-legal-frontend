import type { MemberPolicyCard, MemberPolicyDetail } from '@blufountain/domain';
import { useI18n } from '@blufountain/i18n/react';
import { Meter } from '@blufountain/public-kit';
import { hrefFor, money, useMemberData, word } from './kit';
import { Loading, StandingPill } from './parts';

/** Your policies. With one policy it opens straight onto it; with several it lists them. */
export function CoverPage({ id }: { id: string | undefined }) {
  const list = useMemberData<MemberPolicyCard[]>(id ? null : '/policies');
  const detail = useMemberData<MemberPolicyDetail>(id ? `/policies/${id}` : null);
  if (id) return <Loading loaded={detail}>{(p) => <PolicyDetail p={p} />}</Loading>;
  return <Loading loaded={list}>{(items) => <PolicyList items={items} />}</Loading>;
}

function PolicyList({ items }: { items: MemberPolicyCard[] }) {
  const { t, date } = useI18n();
  if (items.length === 1) return <OnlyPolicy id={items[0]!.id} />;
  return (
    <div className="mp-stack">
      <h1>{t('acct.nav.cover')}</h1>
      <section className="mp-card" aria-labelledby="pick-h">
        <h2 id="pick-h">{t('acct.cover.pick')}</h2>
        {items.length === 0 ? (
          <p className="mp-muted">{t('acct.cover.none')}</p>
        ) : (
          <ul className="mp-list">
            {items.map((p) => (
              <li key={p.id} className="mp-row">
                <div>
                  <a href={hrefFor('cover', p.id)}>
                    <b>{p.number}</b>
                  </a>{' '}
                  <StandingPill standing={p.standing} />
                  <p className="mp-muted">
                    {p.product} · {t('member.paidTo', { date: date(p.paidTo) })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function OnlyPolicy({ id }: { id: string }) {
  const detail = useMemberData<MemberPolicyDetail>(`/policies/${id}`);
  return <Loading loaded={detail}>{(p) => <PolicyDetail p={p} />}</Loading>;
}

function PolicyDetail({ p }: { p: MemberPolicyDetail }) {
  const { t, date } = useI18n();
  const percent = p.annualLimitMinor ? (p.usedMinor / p.annualLimitMinor) * 100 : 0;
  const usedText = t('member.usedOf', {
    used: money(p.usedMinor),
    limit: money(p.annualLimitMinor),
  });

  return (
    <div className="mp-stack">
      <header className="mp-head">
        <p className="mp-eyebrow">{p.number}</p>
        <h1>{p.product}</h1>
        <p className="mp-status" role="status">
          <StandingPill standing={p.standing} /> {word(t, 'acct.standingText', p.standing)}
        </p>
      </header>

      <section className="mp-card" aria-labelledby="facts-h">
        <h2 id="facts-h">{t('acct.nav.cover')}</h2>
        <dl className="mp-facts">
          <div>
            <dt>{t('acct.cover.start')}</dt>
            <dd>{date(p.startDate)}</dd>
          </div>
          {p.renewsOn && (
            <div>
              <dt>{t('acct.cover.renews')}</dt>
              <dd>{date(p.renewsOn)}</dd>
            </div>
          )}
          <div>
            <dt>{t('acct.cover.paidTo')}</dt>
            <dd>{date(p.paidTo)}</dd>
          </div>
          <div>
            <dt>{t('member.premium')}</dt>
            <dd>{money(p.monthlyPremiumMinor)}</dd>
          </div>
          <div>
            <dt>{t('member.limit')}</dt>
            <dd>{money(p.annualLimitMinor)}</dd>
          </div>
          <div>
            <dt>{t('acct.cover.perMatter')}</dt>
            <dd>{money(p.perMatterLimitMinor)}</dd>
          </div>
          <div>
            <dt>{t('acct.cover.excess')}</dt>
            <dd>{money(p.excessMinor)}</dd>
          </div>
          <div>
            <dt>{t('acct.cover.method')}</dt>
            <dd>{word(t, 'acct.method', p.paymentMethod)}</dd>
          </div>
          {p.scheme && (
            <div>
              <dt>{t('acct.cover.scheme')}</dt>
              <dd>{p.scheme}</dd>
            </div>
          )}
        </dl>
        <Meter percent={percent} label={usedText} />
        <p className="mp-muted">{usedText}</p>
        <p>
          <a className="mp-btn mp-primary" href={hrefFor('payments', p.id)}>
            {t('acct.nav.payments')}
          </a>
        </p>
      </section>

      <section className="mp-card" aria-labelledby="waiting-h">
        <h2 id="waiting-h">{t('member.coverTitle')}</h2>
        <ul className="mp-list">
          {p.coveredFrom.map((c) => (
            <li key={c.matterType} className="mp-row">
              <span>{word(t, 'matter', c.matterType)}</span>
              <span className="mp-muted">
                {c.covered
                  ? t('member.covered.now')
                  : t('member.covered.from', { date: date(c.from) })}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mp-card" aria-labelledby="family-h">
        <h2 id="family-h">{t('acct.cover.family')}</h2>
        {p.family.length === 0 ? (
          <p className="mp-muted">{t('acct.cover.nofamily')}</p>
        ) : (
          <ul className="mp-list">
            {p.family.map((f) => (
              <li key={`${f.name}${f.since}`} className="mp-row">
                <span>
                  {f.name} <span className="mp-muted">({f.relationship})</span>
                </span>
                <span className="mp-muted">{t('acct.cover.since', { date: date(f.since) })}</span>
              </li>
            ))}
          </ul>
        )}
        <p>
          <a href={hrefFor('requests', 'add_dependant')}>{t('acct.fam.ask')}</a>
        </p>
      </section>

      <section className="mp-card" aria-labelledby="excl-h">
        <h2 id="excl-h">{t('acct.cover.exclusions')}</h2>
        {p.exclusions.length === 0 ? (
          <p className="mp-muted">{t('acct.cover.noexcl')}</p>
        ) : (
          <ul className="mp-list">
            {p.exclusions.map((e) => (
              <li key={e.matterType} className="mp-row">
                <span>
                  <b>{word(t, 'matter', e.matterType)}</b>
                  <br />
                  {e.description}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
