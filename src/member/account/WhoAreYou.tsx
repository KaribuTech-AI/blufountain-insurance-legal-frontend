import type { MemberIdentityRequired, MemberVerified } from '@blufountain/domain';
import { useI18n } from '@blufountain/i18n/react';
import { Button, Choices, Field, Form, useAction, type PublicApi } from '@blufountain/public-kit';
import { useState } from 'react';

/** Several people use this phone: pick your name and prove it with part of your ID number. */
export function WhoAreYou({
  memberApi,
  pending,
  sharedDevice,
  onVerified,
  onBack,
}: {
  memberApi: PublicApi;
  pending: MemberIdentityRequired;
  sharedDevice: boolean;
  onVerified: (result: MemberVerified) => void;
  onBack: () => void;
}) {
  const { t } = useI18n();
  const [choice, setChoice] = useState(pending.choices[0]?.choice ?? '');
  const [idLast4, setIdLast4] = useState('');
  const go = useAction(
    () =>
      memberApi.send<MemberVerified>('POST', '/sessions/identity', {
        pendingToken: pending.pendingToken,
        choice,
        idLast4,
        sharedDevice,
      }),
    onVerified,
  );

  return (
    <Form onSubmit={() => void go.run()} error={go.error}>
      <p>{t('account.who.intro')}</p>
      <Choices
        legend={t('account.who.name')}
        value={choice}
        options={pending.choices.map((c) => ({ value: c.choice, label: c.firstName }))}
        onChange={setChoice}
      />
      <Field
        label={t('account.who.id')}
        hint={t('account.who.idHint')}
        autoComplete="off"
        autoCapitalize="characters"
        maxLength={4}
        value={idLast4}
        onChange={(e) => setIdLast4(e.target.value.replace(/[^a-z0-9]/gi, '').toUpperCase())}
        required
      />
      <Button type="submit" busy={go.busy} disabled={idLast4.length !== 4 || !choice}>
        {go.busy ? t('common.loading') : t('account.who.continue')}
      </Button>
      <Button type="button" variant="plain" onClick={onBack}>
        {t('common.back')}
      </Button>
    </Form>
  );
}
