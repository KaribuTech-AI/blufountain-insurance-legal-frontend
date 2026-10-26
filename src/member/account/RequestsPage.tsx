import type { MemberPolicyCard, MemberTicket } from '@blufountain/domain';
import { TICKET_KINDS } from '@blufountain/domain';
import { useI18n } from '@blufountain/i18n/react';
import { Button, Field, Form, Select, Status, TextArea, useAction } from '@blufountain/public-kit';
import { useState } from 'react';
import { useAccount, useMemberData, word } from './kit';
import { Loading } from './parts';

/** Kinds a member can start from here. Closing the account is asked for on the Me page. */
const ASKABLE = TICKET_KINDS.filter((k) => k !== 'close_account');
type Kind = (typeof TICKET_KINDS)[number];

const isKind = (value: string | undefined): value is Kind =>
  (ASKABLE as readonly string[]).includes(value ?? '');

/** Everything the member has asked for, the answers, and a form to ask for something new. */
export function RequestsPage({ id }: { id: string | undefined }) {
  const list = useMemberData<MemberTicket[]>('/requests');
  const policies = useMemberData<MemberPolicyCard[]>('/policies');
  const { t, date } = useI18n();

  return (
    <div className="mp-stack">
      <h1>{t('acct.req.title')}</h1>
      <Loading loaded={policies}>
        {(ps) => (
          <NewRequest policies={ps} initial={isKind(id) ? id : 'general'} onSent={list.reload} />
        )}
      </Loading>
      <Loading loaded={list}>
        {(items) => (
          <section className="mp-card" aria-labelledby="list-h">
            <h2 id="list-h">{t('acct.req.title')}</h2>
            {items.length === 0 ? (
              <p className="mp-muted">{t('acct.req.none')}</p>
            ) : (
              <ul className="mp-list">
                {items.map((r) => (
                  <li key={r.id} className="mp-row">
                    <div>
                      <b>{word(t, 'acct.req.kind', r.kind)}</b>{' '}
                      <span className="mp-muted">
                        {word(t, 'acct.req.status', r.status)} ·{' '}
                        {t('acct.req.sentOn', { date: date(r.createdAt.slice(0, 10)) })}
                      </span>
                      <p>{r.body}</p>
                      {(r.policyNumber || r.caseReference) && (
                        <p className="mp-muted">
                          {r.policyNumber && t('acct.req.policyRef', { number: r.policyNumber })}
                          {r.policyNumber && r.caseReference && ' · '}
                          {r.caseReference && t('acct.req.caseRef', { reference: r.caseReference })}
                        </p>
                      )}
                      <p className={r.reply ? 'mp-status' : 'mp-muted'}>
                        {r.reply ? (
                          <>
                            <b>{t('acct.req.reply')}:</b> {r.reply}
                          </>
                        ) : (
                          t('acct.req.waiting')
                        )}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </Loading>
    </div>
  );
}

function NewRequest({
  policies,
  initial,
  onSent,
}: {
  policies: MemberPolicyCard[];
  initial: Kind;
  onSent: () => void;
}) {
  const { t } = useI18n();
  const { api } = useAccount();
  const [kind, setKind] = useState<Kind>(initial);
  const [body, setBody] = useState('');
  const [policyId, setPolicyId] = useState('');
  const [caseReference, setCaseReference] = useState('');
  const [sent, setSent] = useState(false);

  const send = useAction(
    () =>
      api.send<MemberTicket>('POST', '/requests', {
        kind,
        body,
        ...(policyId ? { policyId } : {}),
        ...(kind === 'link_case' ? { caseReference } : {}),
      }),
    () => {
      setSent(true);
      setBody('');
      setCaseReference('');
      onSent();
    },
  );

  return (
    <section className="mp-card" aria-labelledby="new-h">
      <h2 id="new-h">{t('acct.req.new')}</h2>
      <Form onSubmit={() => void send.run()} error={send.error}>
        <Select
          label={t('acct.req.kind')}
          value={kind}
          onChange={(v) => {
            setKind(v as Kind);
            setSent(false);
          }}
          options={ASKABLE.map((k) => ({ value: k, label: word(t, 'acct.req.kind', k) }))}
        />
        {kind === 'link_case' && (
          <Field
            label={t('acct.req.case')}
            hint={t('acct.req.caseHint')}
            autoCapitalize="characters"
            autoComplete="off"
            value={caseReference}
            onChange={(e) => setCaseReference(e.target.value)}
            error={send.error?.fieldMessage('caseReference')}
            required
          />
        )}
        {policies.length > 0 && kind !== 'link_case' && (
          <Select
            label={t('acct.req.policy')}
            value={policyId}
            onChange={setPolicyId}
            options={[
              { value: '', label: t('acct.req.policy.none') },
              ...policies.map((p) => ({ value: p.id, label: p.number })),
            ]}
          />
        )}
        <TextArea
          label={t('acct.req.body')}
          value={body}
          onChange={setBody}
          error={send.error?.fieldMessage('body')}
          required
        />
        <Button
          type="submit"
          busy={send.busy}
          disabled={body.trim().length < 10 || (kind === 'link_case' && !caseReference.trim())}
        >
          {send.busy ? t('common.loading') : t('acct.req.send')}
        </Button>
      </Form>
      {sent && <Status good>{t('acct.req.sent')}</Status>}
    </section>
  );
}
