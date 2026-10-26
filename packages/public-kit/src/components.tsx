import { LANGUAGES, REVIEWED, type Language } from '@blufountain/i18n';
import { useI18n } from '@blufountain/i18n/react';
import { useId, type FormEvent, type ReactNode } from 'react';
import { BrandMark } from '@blufountain/ui/brand';
import { ThemeToggle } from '@blufountain/ui/theme';
export { ThemeToggle };
import { PublicError } from './api';

/**
 * The language switch is hidden until the Shona and isiNdebele wording has been reviewed by a
 * native speaker. Turn it back on here; the pages, the tests and the saved language all still work.
 */
export const LANGUAGE_SWITCH = false;

/** The three languages, at the top of every page, when the switch is turned on. */
export function LanguageBar({
  language,
  onChange,
}: {
  language: Language;
  onChange: (language: Language) => void;
}) {
  const { t } = useI18n();
  if (!LANGUAGE_SWITCH) return null;
  return (
    <nav className="pk-langs" aria-label={t('lang.label')}>
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          type="button"
          lang={l.code}
          aria-pressed={l.code === language}
          onClick={() => onChange(l.code)}
        >
          {l.label}
        </button>
      ))}
    </nav>
  );
}

/** Shona and Ndebele are drafts until reviewed: say so rather than pass them off as final. */
export function DraftNotice({ language }: { language: Language }) {
  if (!LANGUAGE_SWITCH || REVIEWED[language]) return null;
  return (
    <p className="pk-note" role="note">
      This translation is a draft. / Ushumo uyu ndewekuyedza.
    </p>
  );
}

export function Field({
  label,
  hint,
  error,
  ...input
}: {
  label: string;
  hint?: string;
  error?: string | undefined;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id' | 'aria-describedby'>) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errId = `${id}-err`;
  return (
    <div className="pk-field">
      <label htmlFor={id}>{label}</label>
      {hint && (
        <span id={hintId} className="pk-hint">
          {hint}
        </span>
      )}
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hint ? hintId : '', error ? errId : ''].join(' ').trim() || undefined}
        {...input}
      />
      {error && (
        <span id={errId} className="pk-error">
          {error}
        </span>
      )}
    </div>
  );
}

export function Select({
  label,
  options,
  value,
  onChange,
  required,
}: {
  label: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const id = useId();
  return (
    <div className="pk-field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} required={required} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  error,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
  required?: boolean;
}) {
  const id = useId();
  return (
    <div className="pk-field">
      <label htmlFor={id}>{label}</label>
      <textarea
        id={id}
        rows={4}
        value={value}
        required={required}
        aria-invalid={error ? true : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <span className="pk-error">{error}</span>}
    </div>
  );
}

export function Button({
  children,
  busy,
  variant = 'primary',
  ...rest
}: {
  children: ReactNode;
  busy?: boolean;
  variant?: 'primary' | 'plain';
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`pk-btn pk-${variant}`} disabled={busy || rest.disabled} {...rest}>
      {children}
    </button>
  );
}

/** A form that stops the page reloading, and announces errors to screen readers. */
export function Form({
  onSubmit,
  children,
  error,
}: {
  onSubmit: () => void;
  children: ReactNode;
  error?: PublicError | null;
}) {
  const { t } = useI18n();
  return (
    <form
      noValidate
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      {children}
      <div role="alert" aria-live="assertive">
        {error && <p className="pk-error">{t(error.messageKey)}</p>}
      </div>
    </form>
  );
}

export function Status({ children, good }: { children: ReactNode; good?: boolean }) {
  return (
    <p className={good ? 'pk-status pk-good' : 'pk-status'} role="status" aria-live="polite">
      {children}
    </p>
  );
}

/* ------------------------------------------------------------------------------- brand */

/** The Blufountain mark, drawn inline so it costs no extra request. */
export function Logo() {
  return <BrandMark className="pk-logo" />;
}

const ICONS = {
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </>
  ),
  help: (
    <>
      <path d="M12 3l8 3v5.5c0 4.6-3.2 8.2-8 9.5-4.8-1.3-8-4.9-8-9.5V6z" />
      <path d="M9 12l2.2 2.2L15.5 10" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l8 3v5.5c0 4.6-3.2 8.2-8 9.5-4.8-1.3-8-4.9-8-9.5V6z" />
    </>
  ),
  pay: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2.5" />
      <path d="M3 10.5h18M7 15h3" />
    </>
  ),
  claims: (
    <>
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v4h4M10 12h5M10 16h5" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  home: (
    <>
      <path d="M4 11 12 4l8 7M6 10v10h12V10M10 20v-5h4v5" />
    </>
  ),
  phone: (
    <>
      <path d="M6 3h4l1.5 4.5-2.3 1.4a11 11 0 0 0 5.9 5.9l1.4-2.3L21 14v4a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2z" />
    </>
  ),
} as const;
export type IconName = keyof typeof ICONS;

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ICONS[name]}
    </svg>
  );
}

/**
 * The frame both apps share: a header with the brand and the language choice, the page, and a
 * footer with the office number. Content goes in `children`; the skip link lets keyboard and
 * screen reader users jump past the header.
 */
export interface NavItem {
  label: string;
  href: string;
  current?: boolean;
  cta?: boolean;
}

export function PublicShell({
  appName,
  tagline,
  phone,
  phoneLabel,
  skipLabel,
  language,
  onLanguage,
  nav,
  navLabel,
  children,
}: {
  appName: string;
  /** Links in the header. The last one with `cta` is drawn as a button (e.g. member login). */
  nav?: readonly NavItem[];
  navLabel?: string;
  tagline: string;
  phone: string;
  phoneLabel: string;
  skipLabel: string;
  language: Language;
  onLanguage: (language: Language) => void;
  children: ReactNode;
}) {
  return (
    <div className="pk-app">
      <a className="pk-skip" href="#main">
        {skipLabel}
      </a>
      <header className="pk-header">
        <div className="pk-header-in">
          <div className="pk-brand">
            <Logo />
            <span className="pk-wm">
              <b>{appName}</b>
              <span>{tagline}</span>
            </span>
          </div>
          {nav && (
            <nav className="pk-nav" aria-label={navLabel}>
              {nav.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={item.cta ? 'pk-nav-cta' : undefined}
                  aria-current={item.current ? 'page' : undefined}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          )}
          <div className="pk-header-tools">
            <LanguageBar language={language} onChange={onLanguage} />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main id="main" className="pk-main" tabIndex={-1}>
        <DraftNotice language={language} />
        {children}
      </main>
      <footer className="pk-footer">
        <div className="pk-footer-in">
          <p>{appName}</p>
          <p>
            <a href={`tel:${phone.replace(/\s/g, '')}`}>{phoneLabel}</a>
          </p>
        </div>
      </footer>
    </div>
  );
}

/** A blue banner that opens a page: what it is, and in a line, what to do. */
export function Hero({
  title,
  children,
  small,
  eyebrow,
}: {
  title: string;
  children?: ReactNode;
  small?: boolean;
  eyebrow?: string;
}) {
  return (
    <section className={small ? 'pk-hero pk-hero-sm' : 'pk-hero'}>
      {eyebrow && <span className="pk-eyebrow">{eyebrow}</span>}
      <h1>{title}</h1>
      {children && <p>{children}</p>}
    </section>
  );
}

/** Where someone is in a short flow. The current step is announced; the rest are decoration. */
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="pk-stepper">
      {steps.map((label, i) => (
        <li
          key={label}
          data-state={i < current ? 'done' : undefined}
          aria-current={i === current ? 'step' : undefined}
        >
          {label}
        </li>
      ))}
    </ol>
  );
}

/** A row of segments, `on` of `total` filled in. Decorative: the same fact is always in words too. */
export function Track({ on, total }: { on: number; total: number }) {
  return (
    <div className="pk-track" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <i key={i} data-on={i < on ? '' : undefined} />
      ))}
    </div>
  );
}

/** A filled bar showing `percent` (0 to 100), with a text value for assistive technology. */
export function Meter({ percent, label }: { percent: number; label: string }) {
  const value = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div
      className="pk-meter"
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      <i style={{ width: `${value}%` }} />
    </div>
  );
}

export function Pill({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'ok' | 'warn' | 'bad';
  children: ReactNode;
}) {
  return <span className={tone === 'info' ? 'pk-pill' : `pk-pill pk-${tone}`}>{children}</span>;
}

/** Buttons that behave like radio choices, for short lists such as the mobile money provider. */
export function Choices<T extends string>({
  legend,
  value,
  options,
  onChange,
}: {
  legend: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="pk-choices">
      <legend>{legend}</legend>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className="pk-choice"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </fieldset>
  );
}
