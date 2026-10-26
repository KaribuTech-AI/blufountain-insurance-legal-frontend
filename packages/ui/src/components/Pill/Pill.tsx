import { cx } from '../../cx';
import styles from './Pill.module.css';

export type PillTone = 'neutral' | 'muted' | 'brand' | 'info' | 'warning' | 'danger' | 'success';

export interface PillProps {
  tone?: PillTone;
  /** Dashed outline, used by the prototype for "referred". */
  dashed?: boolean;
  className?: string;
  children: React.ReactNode;
}

/** Status label. Always has text, so meaning never depends on colour alone. */
export function Pill({ tone = 'neutral', dashed, className, children }: PillProps) {
  return (
    <span className={cx(styles.pill, styles[tone], dashed && styles.dashed, className)}>
      {children}
    </span>
  );
}
