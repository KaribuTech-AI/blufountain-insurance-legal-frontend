import { useI18n } from '@blufountain/i18n/react';
import { Hero, Icon } from '@blufountain/public-kit';

const OFFICE_PHONE = '0242 000 000';

/** Answers to the questions members ask most. Plain text, no network, so it works offline. */
export function Help() {
  const { t } = useI18n();
  return (
    <div className="pk-narrow">
      <Hero title={t('help.title')} small />
      {(['1', '2', '3', '4'] as const).map((n) => (
        <details key={n}>
          <summary>{t(`help.q${n}`)}</summary>
          <p>{t(`help.a${n}`, { phone: OFFICE_PHONE })}</p>
        </details>
      ))}
      <a
        className="pk-btn pk-primary"
        style={{ textDecoration: 'none' }}
        href={`tel:${OFFICE_PHONE.replace(/\s/g, '')}`}
      >
        <Icon name="phone" />
        {t('common.callUs', { phone: OFFICE_PHONE })}
      </a>
    </div>
  );
}
