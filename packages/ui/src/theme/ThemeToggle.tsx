import { useEffect } from 'react';
import { cx } from '../cx';
import styles from './ThemeToggle.module.css';

/**
 * A two-state light/dark switch. The page follows the OS until someone switches; switching
 * back to what the OS shows forgets the choice, so the page follows the OS again.
 *
 * The stored value is read before first paint by the inline script in each index.html; keep
 * the key in step with it.
 */
export const THEME_STORAGE_KEY = 'bf-theme';

type Scheme = 'light' | 'dark';

function systemScheme(): Scheme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function renderedScheme(): Scheme {
  const pinned = document.documentElement.dataset.theme;
  return pinned === 'light' || pinned === 'dark' ? pinned : systemScheme();
}

function apply(scheme: Scheme | null) {
  const root = document.documentElement;
  if (scheme) root.dataset.theme = scheme;
  else delete root.dataset.theme;
  const meta = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
  if (meta) meta.content = scheme ?? 'light dark';
}

function store(scheme: Scheme | null) {
  try {
    if (scheme) localStorage.setItem(THEME_STORAGE_KEY, scheme);
    else localStorage.removeItem(THEME_STORAGE_KEY);
  } catch {
    // Storage can be blocked; the theme still applies for this page.
  }
}

export function toggleTheme() {
  const target: Scheme = renderedScheme() === 'dark' ? 'light' : 'dark';
  // Matching the OS undoes the override instead of pinning it.
  const pinned = target === systemScheme() ? null : target;
  store(pinned);
  apply(pinned);
}

export interface ThemeToggleProps {
  className?: string;
  /** Show the action as text beside the icon. */
  showLabel?: boolean;
}

/**
 * Both options are in the markup and CSS shows the one that applies, so the control stays
 * right when the OS changes scheme, with no re-render.
 */
export function ThemeToggle({ className, showLabel }: ThemeToggleProps) {
  // Another tab may switch the theme.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) return;
      const value = event.newValue;
      apply(value === 'light' || value === 'dark' ? value : null);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <button
      type="button"
      className={cx(styles.toggle, showLabel && styles.labelled, className)}
      onClick={toggleTheme}
    >
      <span className={styles.toDark}>
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
        </svg>
        <span className={showLabel ? undefined : 'visually-hidden'}>Dark theme</span>
      </span>
      <span className={styles.toLight}>
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
        </svg>
        <span className={showLabel ? undefined : 'visually-hidden'}>Light theme</span>
      </span>
    </button>
  );
}
