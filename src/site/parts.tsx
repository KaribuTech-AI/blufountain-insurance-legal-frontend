import { useI18n } from '@blufountain/i18n/react';
import type { ReactNode } from 'react';

export function Section({
  id,
  eyebrow,
  title,
  tone,
  children,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  tone?: 'soft' | 'dark';
  children: ReactNode;
}) {
  return (
    <section className={`s-sec${tone ? ` s-${tone}` : ''}`} aria-labelledby={`${id}-h`}>
      <div className="s-wrap">
        {eyebrow && <p className="s-eyebrow">{eyebrow}</p>}
        <h2 id={`${id}-h`} className="s-h2">
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}

export const FAQ: readonly (readonly [string, string])[] = [
  [
    'Is legal aid free?',
    'Yes, for people who cannot pay for a lawyer. We talk with you first and tell you plainly whether we can help.',
  ],
  [
    'What is the difference between legal aid and legal cover?',
    'Legal aid is help when you cannot pay. Legal cover is a monthly plan: you pay a little each month and can claim help from a lawyer, up to a yearly limit.',
  ],
  [
    'How soon will someone call me?',
    'Within one working day after you ask for help. Keep your phone on and near you.',
  ],
  [
    'How do I log in as a member?',
    'Use your phone number. We send a six digit code by SMS. There is no password.',
  ],
  [
    'How do I pay my premium?',
    'Log in, choose Pay, and approve the request on your phone with EcoCash or OneMoney. We never ask for your PIN.',
  ],
  [
    'What if I miss a payment?',
    'You get a short grace period and stay covered. After that cover pauses until you catch up. Your portal always shows where you stand.',
  ],
];

/** One open at a time. Native <details>, so Find in page still reaches closed answers. */
export function Faq({ items = FAQ }: { items?: readonly (readonly [string, string])[] }) {
  return (
    <div className="s-faq">
      {items.map(([q, a]) => (
        <details key={q} name="faq">
          <summary>{q}</summary>
          <p>{a}</p>
        </details>
      ))}
    </div>
  );
}

export function CtaBand({ title = 'Ready when you are.' }: { title?: string }) {
  const { t } = useI18n();
  return (
    <section className="s-cta" aria-label={title}>
      <div className="s-wrap">
        <h2 className="s-h2">{title}</h2>
        <p className="s-sub">Start with one conversation. We will tell you what we can do.</p>
        <div className="s-actions s-center">
          <a className="s-btn s-light" href="#/apply">
            {t('home.apply')}
          </a>
          <a className="s-link" href="#/member">
            {t('nav.login')} ›
          </a>
        </div>
      </div>
    </section>
  );
}

export type PhotoName =
  'hero' | 'lawyer' | 'family' | 'worker' | 'grandmother' | 'helpdesk' | 'court' | 'market';

/** Sizes of the source images, so the browser reserves the space before they load. */
const PHOTO_SIZE: Record<PhotoName, [number, number]> = {
  hero: [1536, 2048],
  lawyer: [2048, 1536],
  family: [2048, 1536],
  worker: [2048, 1536],
  grandmother: [2048, 1536],
  helpdesk: [2048, 1536],
  court: [2048, 1152],
  market: [2048, 1536],
};

/**
 * A photo in two sizes; small screens take the small one. Below the fold it waits until it is
 * nearly in view. The hero is the exception: it is the largest thing on the first screen.
 */
export function Photo({
  name,
  alt,
  className,
  sizes = '(min-width: 900px) 50vw, 100vw',
  priority,
}: {
  name: PhotoName;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const [w, h] = PHOTO_SIZE[name];
  return (
    <img
      className={className ? `s-photo ${className}` : 's-photo'}
      src={`/images/${name}-1600.webp`}
      srcSet={`/images/${name}-800.webp 800w, /images/${name}-1600.webp 1600w`}
      sizes={sizes}
      width={w}
      height={h}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : undefined}
    />
  );
}

/**
 * The top of every inner page: where you are, what the page is about, the key facts at a glance,
 * and buttons that jump to each part of the page. Jumps scroll rather than link, because the
 * address after # names the page.
 */
export function PageHead({
  eyebrow,
  title,
  children,
  facts,
  jump,
  action,
  photo,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  facts: readonly (readonly [string, string])[];
  jump?: readonly (readonly [string, string])[];
  action?: { label: string; href: string };
  photo?: { name: PhotoName; alt: string };
}) {
  const { t } = useI18n();
  return (
    <section className="s-pagehead">
      <div className="s-wrap s-pagehead-in">
        <div>
          <nav className="s-crumbs" aria-label="Breadcrumb">
            <a href="#/home">{t('nav.home')}</a>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{eyebrow}</span>
          </nav>
          <h1>{title}</h1>
          <p className="s-lede">{children}</p>
          {action && (
            <div className="s-actions">
              <a className="s-btn s-primary" href={action.href}>
                {action.label}
              </a>
            </div>
          )}
        </div>
        <aside className="s-glance" aria-label="At a glance">
          <p className="s-glance-h">At a glance</p>
          <dl>
            {facts.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
      {photo && (
        <div className="s-wrap">
          <figure className="s-banner">
            <Photo name={photo.name} alt={photo.alt} sizes="(min-width: 1120px) 1120px, 100vw" />
          </figure>
        </div>
      )}
      {jump && (
        <div className="s-wrap">
          <div className="s-jump" role="group" aria-label="On this page">
            <span>On this page</span>
            {jump.map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() =>
                  document.getElementById(`${id}-h`)?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
