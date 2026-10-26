import type { MemberVerified } from '@blufountain/domain';
import { useI18n } from '@blufountain/i18n/react';
import { Button, Field, Form, Status, useAction, type PublicApi } from '@blufountain/public-kit';
import { useState } from 'react';

export function CodeStep({
  memberApi,
  phone,
  sandboxCode,
  sharedDevice,
  onSharedDevice,
  onVerified,
  onBack,
}: {
  memberApi: PublicApi;
  phone: string;
  sandboxCode: string | undefined;
  sharedDevice: boolean;
  onSharedDevice: (shared: boolean) => void;
  onVerified: (result: MemberVerified) => void;
  onBack: () => void;
}) {
  const { t } = useI18n();
  const [code, setCode] = useState('');
  const confirm = useAction(
    () => memberApi.send<MemberVerified>('POST', '/sessions', { phone, code, sharedDevice }),
    onVerified,
  );

  return (
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
      <label className="mp-check">
        <input
          type="checkbox"
          checked={sharedDevice}
          onChange={(e) => onSharedDevice(e.target.checked)}
        />
        <span>
          {t('account.shared')}
          <small className="mp-muted"> {t('account.sharedHint')}</small>
        </span>
      </label>
      <Button type="submit" busy={confirm.busy} disabled={code.length !== 6}>
        {confirm.busy ? t('common.loading') : t('member.confirm')}
      </Button>
      <Button type="button" variant="plain" onClick={onBack}>
        {t('common.back')}
      </Button>
    </Form>
  );
}
