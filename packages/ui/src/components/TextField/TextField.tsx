import {
  FieldError,
  Input,
  Label,
  Text,
  TextArea,
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps,
} from 'react-aria-components';
import { cx } from '../../cx';
import field from '../Field/Field.module.css';

export interface TextFieldProps extends Omit<AriaTextFieldProps, 'className' | 'children'> {
  label: string;
  /** Hint shown under the field, e.g. "Format 63-123456A78". */
  description?: string;
  /** Server or form error. Setting it also marks the field invalid. */
  errorMessage?: string;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
}

export function TextField({
  label,
  description,
  errorMessage,
  multiline,
  placeholder,
  className,
  isInvalid,
  ...props
}: TextFieldProps) {
  return (
    <AriaTextField
      {...props}
      isInvalid={isInvalid ?? !!errorMessage}
      className={cx(field.field, className)}
    >
      <Label className={field.label}>{label}</Label>
      {multiline ? (
        <TextArea className={field.control} placeholder={placeholder} />
      ) : (
        <Input className={field.control} placeholder={placeholder} />
      )}
      {description && (
        <Text slot="description" className={field.description}>
          {description}
        </Text>
      )}
      <FieldError className={field.error}>{errorMessage}</FieldError>
    </AriaTextField>
  );
}
