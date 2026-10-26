import { Button as AriaButton, type ButtonProps as AriaButtonProps } from 'react-aria-components';
import { Children } from 'react';
import { cx } from '../../cx';
import styles from './Button.module.css';
import { RowIconSvg, rowIconFor } from './rowIcons';

export interface ButtonProps extends Omit<AriaButtonProps, 'className' | 'children'> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger';
  size?: 'md' | 'sm';
  className?: string;
  children: React.ReactNode;
}

/** The label as text, when the children are plain text. */
function labelOf(children: React.ReactNode): string | undefined {
  const parts = Children.toArray(children);
  if (parts.length === 0 || !parts.every((p) => typeof p === 'string' || typeof p === 'number')) {
    return undefined;
  }
  return parts.join('').replace(/\s+/g, ' ').trim();
}

/**
 * Use `isPending` while a mutation is sending: the button stays focusable, ignores presses
 * and announces progress, which prevents double submits (frontend F section 7).
 *
 * In a table cell, a small button with a recognisable label shows as an icon (the label stays
 * for screen readers and as the tooltip), so a column of actions stays narrow.
 */
export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  const label = size === 'sm' ? labelOf(children) : undefined;
  const icon = label ? rowIconFor(label) : undefined;
  return (
    <AriaButton
      {...props}
      className={cx(
        styles.button,
        styles[variant],
        size === 'sm' && styles.small,
        icon && styles.hasIcon,
        className,
      )}
      {...(icon && label && !('aria-label' in props) ? { 'data-tip': label } : {})}
    >
      {({ isPending }) => (
        <>
          {isPending && <span className={styles.spinner} aria-hidden="true" />}
          {icon && <RowIconSvg name={icon} className={styles.rowIcon} />}
          <span className={icon ? styles.label : undefined}>{children}</span>
        </>
      )}
    </AriaButton>
  );
}
