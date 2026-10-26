import {
  Button,
  FieldError,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select as AriaSelect,
  SelectValue,
  Text,
  type Key,
  type SelectProps as AriaSelectProps,
} from 'react-aria-components';
import { cx } from '../../cx';
import field from '../Field/Field.module.css';
import styles from './Select.module.css';

export interface SelectOption {
  id: string;
  label: string;
}

export interface SelectProps extends Omit<
  AriaSelectProps<SelectOption>,
  'className' | 'children' | 'items' | 'onChange' | 'value'
> {
  label: string;
  options: SelectOption[];
  value?: string | null;
  onChange?: (id: string | null) => void;
  description?: string;
  errorMessage?: string;
  className?: string;
}

export function Select({
  label,
  options,
  value,
  onChange,
  description,
  errorMessage,
  placeholder = 'Choose…',
  className,
  isInvalid,
  ...props
}: SelectProps) {
  return (
    <AriaSelect
      {...props}
      placeholder={placeholder}
      value={value}
      onChange={(key: Key | null) => onChange?.(key === null ? null : String(key))}
      isInvalid={isInvalid ?? !!errorMessage}
      className={cx(field.field, className)}
    >
      <Label className={field.label}>{label}</Label>
      <Button className={cx(field.control, styles.trigger)}>
        <SelectValue className={styles.value} />
        <span aria-hidden="true" className={styles.chevron}>
          ▾
        </span>
      </Button>
      {description && (
        <Text slot="description" className={field.description}>
          {description}
        </Text>
      )}
      <FieldError className={field.error}>{errorMessage}</FieldError>
      <Popover className={styles.popover}>
        <ListBox items={options} className={styles.listbox}>
          {(option) => <ListBoxItem className={styles.option}>{option.label}</ListBoxItem>}
        </ListBox>
      </Popover>
    </AriaSelect>
  );
}
