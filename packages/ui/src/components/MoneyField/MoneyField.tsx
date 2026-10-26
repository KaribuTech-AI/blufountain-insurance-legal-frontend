import { useState } from 'react';
import { TextField, type TextFieldProps } from '../TextField/TextField';

/** "180", "180.5" or "1,250.75" to whole cents. Returns undefined for anything else. */
export function parseMoney(text: string): number | undefined {
  const cleaned = text.replace(/[\s,$]/g, '');
  if (cleaned === '') return 0;
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return undefined;
  // Done in whole cents, never through floating point, so $0.10 + $0.20 stays exact.
  const [dollars, cents = ''] = cleaned.split('.');
  return Number(dollars) * 100 + Number(cents.padEnd(2, '0'));
}

export function formatMoney(minor: number): string {
  const dollars = Math.floor(minor / 100);
  const cents = minor % 100;
  return cents === 0 ? String(dollars) : `${dollars}.${String(cents).padStart(2, '0')}`;
}

export interface MoneyFieldProps extends Omit<
  TextFieldProps,
  'value' | 'onChange' | 'type' | 'multiline' | 'errorMessage'
> {
  /** Amount in minor units (cents). */
  value: number;
  onChange: (minor: number) => void;
  errorMessage?: string;
}

/**
 * Money is typed in dollars and kept in cents (frontend F section 7). Typing "12.3" keeps what
 * was typed until the field is left, so the cursor never jumps; an unreadable entry is flagged.
 */
export function MoneyField({ value, onChange, errorMessage, onBlur, ...props }: MoneyFieldProps) {
  const [text, setText] = useState(value === 0 ? '' : formatMoney(value));
  const [invalid, setInvalid] = useState(false);

  return (
    <TextField
      {...props}
      inputMode="decimal"
      value={text}
      errorMessage={
        errorMessage ?? (invalid ? 'Enter an amount in dollars, like 120 or 120.50.' : undefined)
      }
      onChange={(next) => {
        setText(next);
        const minor = parseMoney(next);
        setInvalid(minor === undefined);
        if (minor !== undefined) onChange(minor);
      }}
      onBlur={(event) => {
        const minor = parseMoney(text);
        if (minor !== undefined) setText(minor === 0 ? '' : formatMoney(minor));
        onBlur?.(event);
      }}
    />
  );
}
