import { NOTIFY_TOPICS } from '@blufountain/domain';
import type { MemberNotifyPrefs, MemberProfile, MemberTicket } from '@blufountain/domain';
import { useI18n } from '@blufountain/i18n/react';
import { Button, Field, Form, Status, useAction } from '@blufountain/public-kit';
import { useState } from 'react';
import { Help } from '../Help';
import { useAccount, useMemberData } from './kit';
import { Loading } from './parts';

/** The member's own settings: reminders, phone number, closing the account, and help. */
export function ProfilePage() {
  const { t } = useI18n();
  const profile = useMemberData<MemberProfile>('/profile');
  const prefs = useMemberData<MemberNotifyPrefs>('/profile/notifications');

  return (
    <div className="mp-stack">
      <h1>{t('acct.prof.title')}</h1>
      <Loading loaded={profile}>
        {(p) => (
          <section className="mp-card" aria-labelledby="details-h">
            <h2 id="details-h">{t('acct.prof.details')}</h2>
            <dl className="mp-facts">
              <div>
                <dt>{t('acct.prof.name')}</dt>
                <dd>{p.fullName}</dd>
              </div>
              <div>
                <dt>{t('acct.prof.phone')}</dt>
                <dd>{p.phoneHint}</dd>
              </div>
            </dl>
          </section>
        )}
      </Loading>
      <Loading loaded={prefs}>{(p) => <Reminders initial={p} />}</Loading>
      <ChangePhone onChanged={profile.reload} />
      <CloseAccount />
      <section aria-label={t('help.title')}>
        <Help />
      </section>
    </div>
  );
}

function Reminders({ initial }: { initial: MemberNotifyPrefs }) {
  const { t } = useI18n();
  const { api } = useAccount();
  const [prefs, setPrefs] = useState(initial);
  const [saved, setSaved] = useState(false);
  const save = useAction(
    () => api.send<MemberNotifyPrefs>('PUT', '/profile/notifications', prefs),
    () => setSaved(true),
  );

  return (
    <section className="mp-card" aria-labelledby="reminders-h">
      <h2 id="reminders-h">{t('acct.prof.reminders')}</h2>
      <p className="mp-muted">{t('acct.prof.reminders.hint')}</p>
      <Form onSubmit={() => void save.run()} error={save.error}>
        {NOTIFY_TOPICS.map((topic) => (
          <label key={topic} className="mp-check">
            <input
              type="checkbox"
              checked={prefs[topic]}
              onChange={(e) => {
                setSaved(false);
                setPrefs({ ...prefs, [topic]: e.target.checked });
              }}
            />
            <span>{t(`acct.topic.${topic}`)}</span>
          </label>
        ))}
        <Button type="submit" busy={save.busy}>
          {t('acct.prof.save')}
        </Button>
      </Form>
      {saved && <Status good>{t('acct.prof.saved')}</Status>}
    </section>
  );
}

function ChangePhone({ onChanged }: { onChanged: () => void }) {
  const { t } = useI18n();
  const { api } = useAccount();
  const [newPhone, setNewPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'start' | 'code' | 'done'>('start');

  const ask = useAction(
    () => api.send('POST', '/profile/phone/codes', { newPhone }),
    () => setStep('code'),
  );
  const confirm = useAction(
    () => api.send<MemberProfile>('POST', '/profile/phone', { newPhone, code }),
    () => {
      setStep('done');
      setCode('');
      onChanged();
    },
  );

  return (
    <section className="mp-card" aria-labelledby="phone-h">
      <h2 id="phone-h">{t('acct.prof.phoneChange')}</h2>
      {step === 'start' && (
        <Form onSubmit={() => void ask.run()} error={ask.error}>
          <Field
            label={t('acct.prof.phoneNew')}
            type="tel"
            inputMode="tel"
            autoComplete="off"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            error={ask.error?.fieldMessage('newPhone')}
            required
          />
          <Button type="submit" busy={ask.busy} disabled={!newPhone.trim()}>
            {t('acct.prof.phoneCode')}
          </Button>
        </Form>
      )}
      {step === 'code' && (
        <Form onSubmit={() => void confirm.run()} error={confirm.error}>
          <Status>{t('acct.prof.phoneSent')}</Status>
          <div className="pk-code">
            <Field
              label={t('check.code')}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              required
            />
          </div>
          <Button type="submit" busy={confirm.busy} disabled={code.length !== 6}>
            {t('acct.prof.phoneConfirm')}
          </Button>
        </Form>
      )}
      {step === 'done' && <Status good>{t('acct.prof.phoneDone')}</Status>}
    </section>
  );
}

function CloseAccount() {
  const { t } = useI18n();
  const { api } = useAccount();
  const [sent, setSent] = useState(false);
  const close = useAction(
    () =>
      api.send<MemberTicket>('POST', '/requests', {
        kind: 'close_account',
        body: 'Please close my online account.',
      }),
    () => setSent(true),
  );
  return (
    <section className="mp-card" aria-labelledby="close-h">
      <h2 id="close-h">{t('acct.prof.close')}</h2>
      <p className="mp-muted">{t('acct.prof.close.body')}</p>
      <Form onSubmit={() => void close.run()} error={close.error}>
        <Button type="submit" variant="plain" busy={close.busy} disabled={sent}>
          {t('acct.prof.close.send')}
        </Button>
      </Form>
      {sent && <Status good>{t('acct.prof.close.sent')}</Status>}
    </section>
  );
}
