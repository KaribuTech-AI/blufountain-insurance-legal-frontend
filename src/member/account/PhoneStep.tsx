import type { OtpSent } from '@blufountain/domain';
import { useI18n } from '@blufountain/i18n/react';
import { Button, Field, Form, useAction, type PublicApi } from '@blufountain/public-kit';
import { useState } from 'react';

/** The only thing a member needs to start: the phone number we have for them. */
export function PhoneStep({
  api,
  memberApi,
  phone,
  onPhone,
  onSent,
}: {
  /** The public API, which serves the bot check. */
  api: PublicApi;
  memberApi: PublicApi;
  phone: string;
  onPhone: (phone: string) => void;
  onSent: (sent: OtpSent) => void;
}) {
  const { t } = useI18n();
  const [website, setWebsite] = useState('');
  const send = useAction(
    async () =>
      memberApi.send<OtpSent>('POST', '/codes', {
        phone,
        challenge: await api.challenge(),
        ...(website ? { website } : {}),
      }),
    onSent,
  );

  return (
    <Form onSubmit={() => void send.run()} error={send.error}>
      <Field
        label={t('check.phone')}
        hint={t('check.phoneHint')}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        value={phone}
        onChange={(e) => onPhone(e.target.value)}
        required
      />
      {/* A hidden field people never see. Scripts fill it in, and are quietly ignored. */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px' }}>
        <input
          tabIndex={-1}
          autoComplete="off"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>
      <Button type="submit" busy={send.busy} disabled={!phone.trim()}>
        {send.busy ? t('common.loading') : t('member.sendCode')}
      </Button>
    </Form>
  );
}
