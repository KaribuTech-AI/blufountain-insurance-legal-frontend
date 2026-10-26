import type { OtpSent, PortalCase, PublicAck, PublicSession } from '@blufountain/domain';
import { useI18n } from '@blufountain/i18n/react';
import {
  Button,
  Field,
  Form,
  Hero,
  Select,
  Status,
  Stepper,
  TextArea,
  Track,
  useAction,
  type PublicApi,
} from '@blufountain/public-kit';
import { useState } from 'react';

type Step = 'details' | 'code' | 'case';

/** Phone and case number, then a one-time code, then the case in plain words (REQ-095 to 097). */
export function CheckCase({ api, onBack }: { api: PublicApi; onBack: () => void }) {
  const { t } = useI18n();
  const [step, setStep] = useState<Step>('details');
  const [reference, setReference] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sandboxCode, setSandboxCode] = useState<string>();
  const [found, setFound] = useState<PortalCase>();

  const sendCode = useAction(
    async () =>
      api.send<OtpSent>('POST', '/codes', {
        purpose: 'case',
        reference,
        phone,
        challenge: await api.challenge(),
      }),
    (sent) => {
      setSandboxCode(sent.sandboxCode);
      setStep('code');
    },
  );

  const confirm = useAction(
    async () => {
      const session = await api.send<PublicSession>('POST', '/sessions', {
        purpose: 'case',
        reference,
        phone,
        code,
      });
      api.setToken(session.token);
      return api.get<PortalCase>('/case');
    },
    (result) => {
      setFound(result);
      setStep('case');
    },
  );

  const finish = async () => {
    try {
      await api.send('DELETE', '/sessions/current');
    } catch {
      // The session ends by itself in 20 minutes.
    }
    api.setToken(undefined);
    onBack();
  };

  const steps = [t('step.details'), t('step.code'), t('step.case')];

  if (step === 'case' && found) {
    return <CaseView api={api} found={found} onDone={() => void finish()} />;
  }

  return (
    <div className="pk-narrow">
      <Hero title={t('check.title')} small>
        {t('check.privacy')}
      </Hero>
      <Stepper steps={steps} current={step === 'details' ? 0 : 1} />
      <div className="pk-card">
        {step === 'details' && (
          <Form onSubmit={() => void sendCode.run()} error={sendCode.error}>
            <Field
              label={t('check.reference')}
              hint={t('check.referenceHint')}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
              required
            />
            <Field
              label={t('check.phone')}
              hint={t('check.phoneHint')}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={sendCode.error?.fieldMessage('phone')}
              required
            />
            <Button
              type="submit"
              busy={sendCode.busy}
              disabled={!reference.trim() || !phone.trim()}
            >
              {sendCode.busy ? t('common.loading') : t('check.sendCode')}
            </Button>
          </Form>
        )}

        {step === 'code' && (
          <Form onSubmit={() => void confirm.run()} error={confirm.error}>
            <Status>{t('check.codeSent')}</Status>
            {sandboxCode && <p className="pk-note">Sandbox code: {sandboxCode}</p>}
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
              {confirm.busy ? t('common.loading') : t('check.confirm')}
            </Button>
          </Form>
        )}
      </div>
      <Button variant="plain" type="button" onClick={onBack}>
        {t('common.back')}
      </Button>
    </div>
  );
}

function CaseView({
  api,
  found,
  onDone,
}: {
  api: PublicApi;
  found: PortalCase;
  onDone: () => void;
}) {
  const { t, date } = useI18n();
  const [asking, setAsking] = useState(false);
  const [time, setTime] = useState('any');
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);

  const callback = useAction(
    () =>
      api.send<PublicAck>('POST', '/case/callback', {
        preferredTime: time,
        ...(note.trim() ? { message: note.trim() } : {}),
      }),
    () => setSent(true),
  );

  const progress: Record<string, number> = {
    intake: 1,
    screening: 2,
    accepted: 3,
    active: 4,
    referred: 4,
    closed: 4,
  };

  return (
    <>
      <Hero title={found.reference} eyebrow={t('check.stage')} small>
        {found.stage}
      </Hero>
      <Track on={progress[found.stageCode] ?? 1} total={4} />
      <div className="pk-split">
        <section className="pk-card" aria-label={found.reference}>
          <dl className="pk-facts" style={{ marginTop: 0 }}>
            <div style={{ borderTop: 0, paddingTop: 0 }}>
              <dt>{t('check.nextCourt')}</dt>
              <dd>{found.nextCourtDate ? date(found.nextCourtDate) : t('check.noCourt')}</dd>
            </div>
            <div>
              <dt>{t('check.lawyer')}</dt>
              <dd>{found.lawyerName ?? t('check.noLawyer')}</dd>
            </div>
          </dl>
        </section>

        <div>
          {sent ? (
            <Status good>{t('check.callbackSent')}</Status>
          ) : asking ? (
            <div className="pk-card">
              <Form onSubmit={() => void callback.run()} error={callback.error}>
                <Select
                  label={t('check.callbackTime')}
                  value={time}
                  onChange={setTime}
                  options={[
                    { value: 'any', label: t('time.any') },
                    { value: 'morning', label: t('time.morning') },
                    { value: 'afternoon', label: t('time.afternoon') },
                  ]}
                />
                <TextArea label={t('check.callbackNote')} value={note} onChange={setNote} />
                <Button type="submit" busy={callback.busy}>
                  {t('common.send')}
                </Button>
              </Form>
            </div>
          ) : (
            <Button type="button" onClick={() => setAsking(true)}>
              {t('check.callback')}
            </Button>
          )}

          <Button variant="plain" type="button" onClick={onDone}>
            {t('common.signOut')}
          </Button>
        </div>
      </div>
    </>
  );
}
