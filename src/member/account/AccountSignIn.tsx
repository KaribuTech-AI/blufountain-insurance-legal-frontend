import type { MemberIdentityRequired, MemberProfile, MemberVerified } from '@blufountain/domain';
import { useI18n } from '@blufountain/i18n/react';
import { Hero, Status, Stepper, type PublicApi } from '@blufountain/public-kit';
import { useState } from 'react';
import { CodeStep } from './CodeStep';
import { PhoneStep } from './PhoneStep';
import { WhoAreYou } from './WhoAreYou';

type Step =
  | { name: 'phone' }
  | { name: 'code'; sandboxCode: string | undefined }
  | { name: 'who'; pending: MemberIdentityRequired };

/** Phone number, one-time code, and (on a shared phone) who is signing in. */
export function AccountSignIn({
  api,
  memberApi,
  expired,
  onSignedIn,
}: {
  api: PublicApi;
  memberApi: PublicApi;
  /** The last session ended for lack of use. */
  expired: boolean;
  onSignedIn: (profile: MemberProfile, idleSeconds: number) => void;
}) {
  const { t } = useI18n();
  const [step, setStep] = useState<Step>({ name: 'phone' });
  const [phone, setPhone] = useState('');
  const [sharedDevice, setSharedDevice] = useState(false);
  const [failed, setFailed] = useState(false);

  const verified = async (result: MemberVerified) => {
    if (result.status === 'identity_required') {
      setStep({ name: 'who', pending: result });
      return;
    }
    memberApi.setToken(result.token);
    try {
      onSignedIn(await memberApi.get<MemberProfile>('/profile'), result.expiresInSeconds);
    } catch {
      memberApi.setToken(undefined);
      setFailed(true);
      setStep({ name: 'phone' });
    }
  };

  return (
    <div className="pk-narrow">
      <Hero title={t('account.title')}>{t('account.intro')}</Hero>
      {expired && <Status>{t('account.expired')}</Status>}
      {failed && <Status>{t('err.generic')}</Status>}
      <Stepper
        steps={[t('step.details'), t('step.code')]}
        current={step.name === 'phone' ? 0 : 1}
      />
      <div className="pk-card">
        {step.name === 'phone' && (
          <PhoneStep
            api={api}
            memberApi={memberApi}
            phone={phone}
            onPhone={setPhone}
            onSent={(sent) => {
              setFailed(false);
              setStep({ name: 'code', sandboxCode: sent.sandboxCode });
            }}
          />
        )}
        {step.name === 'code' && (
          <CodeStep
            memberApi={memberApi}
            phone={phone}
            sandboxCode={step.sandboxCode}
            sharedDevice={sharedDevice}
            onSharedDevice={setSharedDevice}
            onVerified={(r) => void verified(r)}
            onBack={() => setStep({ name: 'phone' })}
          />
        )}
        {step.name === 'who' && (
          <WhoAreYou
            memberApi={memberApi}
            pending={step.pending}
            sharedDevice={sharedDevice}
            onVerified={(r) => void verified(r)}
            onBack={() => setStep({ name: 'phone' })}
          />
        )}
      </div>
    </div>
  );
}
