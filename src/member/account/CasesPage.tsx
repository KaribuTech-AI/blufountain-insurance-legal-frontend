import type { MemberCaseCard, MemberCaseDetail } from '@blufountain/domain';
import { useI18n } from '@blufountain/i18n/react';
import { hrefFor, useMemberData, word } from './kit';
import { Loading } from './parts';

const OFFICE_PHONE = '0242 000 000';

export function CasesPage({ id }: { id: string | undefined }) {
  const list = useMemberData<MemberCaseCard[]>(id ? null : '/cases');
  const detail = useMemberData<MemberCaseDetail>(id ? `/cases/${id}` : null);
  if (id) return <Loading loaded={detail}>{(c) => <CaseDetail c={c} />}</Loading>;
  return <Loading loaded={list}>{(items) => <CaseList items={items} />}</Loading>;
}

function CaseRow({ c }: { c: MemberCaseCard }) {
  const { t, date } = useI18n();
  return (
    <li className="mp-row">
      <div>
        <a href={hrefFor('cases', c.id)}>
          <b>{c.reference}</b>
        </a>{' '}
        <span className="mp-muted">{word(t, 'matter', c.matterType)}</span>
        <p>{word(t, 'acct.stage', c.stage)}</p>
        <p className="mp-muted">{t('acct.cases.opened', { date: date(c.openedOn) })}</p>
        {c.nextHearing && (
          <p className="mp-muted">
            {t('check.nextCourt')}: {date(c.nextHearing.date)}, {c.nextHearing.time}
          </p>
        )}
      </div>
    </li>
  );
}

function CaseList({ items }: { items: MemberCaseCard[] }) {
  const { t } = useI18n();
  const open = items.filter((c) => c.open);
  const finished = items.filter((c) => !c.open);
  return (
    <div className="mp-stack">
      <h1>{t('acct.nav.cases')}</h1>
      {items.length === 0 && (
        <section className="mp-card">
          <p className="mp-muted">{t('acct.cases.none')}</p>
        </section>
      )}
      {open.length > 0 && (
        <section className="mp-card" aria-labelledby="open-h">
          <h2 id="open-h">{t('acct.cases.open')}</h2>
          <ul className="mp-list">
            {open.map((c) => (
              <CaseRow key={c.id} c={c} />
            ))}
          </ul>
        </section>
      )}
      {finished.length > 0 && (
        <section className="mp-card" aria-labelledby="done-h">
          <h2 id="done-h">{t('acct.cases.finished')}</h2>
          <ul className="mp-list">
            {finished.map((c) => (
              <CaseRow key={c.id} c={c} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function CaseDetail({ c }: { c: MemberCaseDetail }) {
  const { t, date } = useI18n();
  return (
    <div className="mp-stack">
      <p>
        <a href={hrefFor('cases')}>‹ {t('acct.back')}</a>
      </p>
      <header className="mp-head">
        <p className="mp-eyebrow">{c.reference}</p>
        <h1>{word(t, 'matter', c.matterType)}</h1>
        <p className="mp-status" role="status">
          {word(t, 'acct.stage', c.stage)}
        </p>
      </header>

      <section className="mp-card" aria-labelledby="facts-h">
        <h2 id="facts-h">{t('acct.nav.cases')}</h2>
        <dl className="mp-facts">
          <div>
            <dt>{t('check.lawyer')}</dt>
            <dd>{c.lawyerName ?? '–'}</dd>
          </div>
          <div>
            <dt>{t('check.nextCourt')}</dt>
            <dd>
              {c.nextHearing
                ? `${date(c.nextHearing.date)}, ${c.nextHearing.time}${c.nextHearing.court ? `, ${c.nextHearing.court}` : ''}`
                : t('check.noCourt')}
            </dd>
          </div>
        </dl>
        <p>
          <a className="mp-btn" href={`tel:${OFFICE_PHONE.replace(/\s/g, '')}`}>
            {t('common.callUs', { phone: OFFICE_PHONE })}
          </a>
        </p>
      </section>

      <section className="mp-card" aria-labelledby="timeline-h">
        <h2 id="timeline-h">{t('acct.case.timeline')}</h2>
        {c.timeline.length === 0 ? (
          <p className="mp-muted">{t('acct.case.noTimeline')}</p>
        ) : (
          <ol className="mp-list">
            {c.timeline.map((item) => (
              <li key={item.id} className="mp-row">
                <span>{t(`acct.tl.${item.kind}`, { time: String(item.params.time ?? '') })}</span>
                <span className="mp-muted">{date(item.date)}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {c.claims.length > 0 && (
        <section className="mp-card" aria-labelledby="claims-h">
          <h2 id="claims-h">{t('acct.case.claims')}</h2>
          <ul className="mp-list">
            {c.claims.map((x) => (
              <li key={x.id} className="mp-row">
                <a href={hrefFor('claims', x.id)}>
                  <b>{x.number}</b>
                </a>
                <span className="mp-muted">{word(t, 'acct.claim.status', x.status)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
