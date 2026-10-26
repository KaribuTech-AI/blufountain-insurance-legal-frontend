import type { PublicAck } from '@blufountain/domain';
import { useI18n } from '@blufountain/i18n/react';
import {
  Button,
  Field,
  Form,
  Hero,
  MATTERS,
  Select,
  Status,
  TextArea,
  useAction,
  type PublicApi,
} from '@blufountain/public-kit';
import { useState } from 'react';

/** Ask for legal help. It becomes a call-back for staff; no case is opened by itself (REQ-095). */
export function Apply({ api, onBack }: { api: PublicApi; onBack: () => void }) {
  const { t, language } = useI18n();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [matter, setMatter] = useState('');
  const [summary, setSummary] = useState('');
  // A field real people never see. A script that fills every field fills this one too.
  const [website, setWebsite] = useState('');
  const [ack, setAck] = useState<PublicAck>();

  const send = useAction(
    async () =>
      api.send<PublicAck>('POST', '/applications', {
        fullName: name,
        phone,
        matterType: matter,
        summary,
        language,
        challenge: await api.challenge(),
        ...(website ? { website } : {}),
      }),
    setAck,
  );

  if (ack) {
    return (
      <div className="pk-narrow">
        <Hero title={t('common.thanks')} small />
        <Status good>{t('apply.sent', { ref: ack.reference })}</Status>
        <Button variant="plain" type="button" onClick={onBack}>
          {t('common.back')}
        </Button>
      </div>
    );
  }

  const ready = name.trim().length >= 2 && phone.trim() && matter && summary.trim().length >= 10;

  return (
    <div className="pk-narrow">
      <Hero title={t('apply.title')} small>
        {t('apply.intro')}
      </Hero>
      <div className="pk-card">
        <Form onSubmit={() => void send.run()} error={send.error}>
          <Field
            label={t('apply.name')}
            value={name}
            autoComplete="name"
            onChange={(e) => setName(e.target.value)}
            error={send.error?.fieldMessage('fullName')}
            required
          />
          <Field
            label={t('apply.phone')}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={send.error?.fieldMessage('phone')}
            required
          />
          <Select
            label={t('apply.matter')}
            value={matter}
            onChange={setMatter}
            required
            options={[
              { value: '', label: '—' },
              ...MATTERS.map((m) => ({ value: m, label: t(`matter.${m}`) })),
            ]}
          />
          <TextArea
            label={t('apply.summary')}
            value={summary}
            onChange={setSummary}
            error={send.error?.fieldMessage('summary')}
            required
          />
          <div className="pk-hp" aria-hidden="true">
            <label>
              Website
              <input
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </label>
          </div>
          <Button type="submit" busy={send.busy} disabled={!ready}>
            {send.busy ? t('common.loading') : t('apply.send')}
          </Button>
        </Form>
      </div>
      <Button variant="plain" type="button" onClick={onBack}>
        {t('common.back')}
      </Button>
    </div>
  );
}
