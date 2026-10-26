import {
  Checkbox as AriaCheckbox,
  type CheckboxProps as AriaCheckboxProps,
} from 'react-aria-components';
import { cx } from '../../cx';
import styles from './Checkbox.module.css';

export interface CheckboxProps extends Omit<AriaCheckboxProps, 'className' | 'children'> {
  children: React.ReactNode;
  className?: string;
}

export function Checkbox({ children, className, ...props }: CheckboxProps) {
  return (
    <AriaCheckbox {...props} className={cx(styles.checkbox, className)}>
      {({ isSelected, isIndeterminate }) => (
        <>
          <span className={styles.box} aria-hidden="true">
            {isIndeterminate ? '–' : isSelected ? '✓' : ''}
          </span>
          <span>{children}</span>
        </>
      )}
    </AriaCheckbox>
  );
}
