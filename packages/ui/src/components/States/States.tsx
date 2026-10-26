import { cx } from '../../cx';
import { Button } from '../Button/Button';
import styles from './States.module.css';

export interface EmptyStateProps {
  message: string;
  /** Optional primary action, e.g. a "New case" button. */
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ message, action, className }: EmptyStateProps) {
  return (
    <div className={cx(styles.empty, className)}>
      <p>{message}</p>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  /** The API's requestId, so staff can quote it to support. */
  reference?: string;
  className?: string;
}

export function ErrorState({
  message = 'Something went wrong while loading this.',
  onRetry,
  reference,
  className,
}: ErrorStateProps) {
  return (
    <div role="alert" className={cx(styles.empty, styles.error, className)}>
      <p>{message}</p>
      {reference && <p className={styles.reference}>Support reference: {reference}</p>}
      {onRetry && (
        <div className={styles.action}>
          <Button onPress={onRetry}>Try again</Button>
        </div>
      )}
    </div>
  );
}

export interface LoadingSkeletonProps {
  variant?: 'list' | 'detail' | 'form';
  /** Announced to screen readers. */
  label?: string;
  className?: string;
}

const LINES: Record<NonNullable<LoadingSkeletonProps['variant']>, number[]> = {
  list: [100, 100, 100, 100, 100],
  detail: [40, 100, 85, 100, 60],
  form: [30, 100, 30, 100, 30, 100],
};

export function LoadingSkeleton({
  variant = 'list',
  label = 'Loading',
  className,
}: LoadingSkeletonProps) {
  return (
    // <output> has the implicit role "status", so screen readers announce the label.
    <output aria-busy="true" className={cx(styles.skeleton, className)}>
      <span className="visually-hidden">{label}</span>
      {LINES[variant].map((width, i) => (
        <span key={i} aria-hidden="true" className={styles.line} style={{ width: `${width}%` }} />
      ))}
    </output>
  );
}
