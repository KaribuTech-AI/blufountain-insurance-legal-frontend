import { cx } from '../../cx';
import styles from './Callout.module.css';

export interface CalloutProps {
  tone?: 'warning' | 'danger' | 'success' | 'info';
  title?: string;
  className?: string;
  children: React.ReactNode;
}

/** A highlighted note inside a page, e.g. a cover-check warning. Not a live region. */
export function Callout({ tone = 'warning', title, className, children }: CalloutProps) {
  return (
    <div className={cx(styles.callout, styles[tone], className)}>
      {title && <p className={styles.title}>{title}</p>}
      <div>{children}</div>
    </div>
  );
}
