import type { MemberClaimCard, MemberClaimDetail } from '@blufountain/domain';
import { useI18n } from '@blufountain/i18n/react';
import { hrefFor, useMemberData, word } from './kit';
import { Loading } from './parts';

const OFFICE_PHONE = '0242 000 000';

export function ClaimsPage({ id }: { id: string | undefined }) {
  const list = useMemberData<MemberClaimCard[]>(id ? null : '/claims');
  const detail = useMemberData<MemberClaimDetail>(id ? `/claims/${id}` : null);
  if (id) return <Loading loaded={detail}>{(c) => <ClaimDetail c={c} />}</Loading>;
  return <Loading loaded={list}>{(items) => <ClaimList items={items} />}</Loading>;
}

function ClaimList({ items }: { items: MemberClaimCard[] }) {
  const { t, date } = useI18n();
  return (
    <div className="mp-stack">
      <h1>{t('claims.title')}</h1>
      <section className="mp-card">
        {items.length === 0 ? (
          <p className="mp-muted">{t('claims.none')}</p>
        ) : (
          <ul className="mp-list">
            {items.map((c) => (
              <li key={c.id} className="mp-row">
                <div>
                  <a href={hrefFor('claims', c.id)}>
                    <b>{c.number}</b>
                  </a>{' '}
                  <span className="mp-muted">{date(c.registeredOn)}</span>
                  <p>{word(t, 'acct.claim.status', c.status)}</p>
                  {c.forName && (
                    <p className="mp-muted">{t('acct.claim.for', { name: c.forName })}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ClaimDetail({ c }: { c: MemberClaimDetail }) {
  const { t, date } = useI18n();
  return (
    <div className="mp-stack">
      <p>
        <a href={hrefFor('claims')}>‹ {t('acct.back')}</a>
      </p>
      <header className="mp-head">
        <p className="mp-eyebrow">{c.number}</p>
        <h1>{t('claims.title')}</h1>
        <p className="mp-status" role="status">
          {word(t, 'acct.claim.status', c.status)}
        </p>
      </header>

      <section className="mp-card" aria-labelledby="facts-h">
        <h2 id="facts-h">{c.number}</h2>
        <dl className="mp-facts">
          <div>
            <dt>{t('acct.claim.policy', { number: c.policyNumber })}</dt>
            <dd>{date(c.registeredOn)}</dd>
          </div>
          {c.forName && (
            <div>
              <dt>{t('acct.claim.for', { name: c.forName })}</dt>
              <dd />
            </div>
          )}
          {c.caseReference && c.caseId && (
            <div>
              <dt>{t('acct.claim.case', { reference: c.caseReference })}</dt>
              <dd>
                <a href={hrefFor('cases', c.caseId)}>{t('portal.act.view')}</a>
              </dd>
            </div>
          )}
        </dl>
        <p>
          <a className="mp-btn" href={`tel:${OFFICE_PHONE.replace(/\s/g, '')}`}>
            {t('common.callUs', { phone: OFFICE_PHONE })}
          </a>
        </p>
      </section>

      <section className="mp-card" aria-labelledby="steps-h">
        <h2 id="steps-h">{t('acct.claim.steps')}</h2>
        <ol className="mp-list">
          {c.steps.map((s) => (
            <li key={s.kind} className="mp-row">
              <span>
                {s.kind === 'decided'
                  ? t(`acct.step.decided.${s.outcome === 'declined' ? 'declined' : 'accepted'}`)
                  : t(`acct.step.${s.kind}`)}
              </span>
              <span className="mp-muted">{date(s.date)}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
