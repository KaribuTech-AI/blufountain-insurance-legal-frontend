import { useState } from 'react';
import { Button } from '../Button/Button';
import { Callout } from '../Callout/Callout';
import { Modal, ModalActions } from '../Modal/Modal';
import { TextField } from '../TextField/TextField';

export interface ConfirmDialogProps {
  title: string;
  /** What will happen, in plain words. */
  message: React.ReactNode;
  confirmLabel: string;
  isOpen: boolean;
  onClose: () => void;
  /** Called with the reason when `reasonLabel` is set. Throw or reject to keep the dialog open. */
  onConfirm: (reason: string) => void | Promise<void>;
  isPending?: boolean;
  /** Set to ask for a written reason, which then becomes required. */
  reasonLabel?: string;
  reasonHint?: string;
  tone?: 'primary' | 'danger';
  /** A failure to show inside the dialog, e.g. the server's explanation. */
  error?: string;
}

/**
 * Asks the person to confirm an action, optionally with a required reason. The confirm button
 * stays disabled until the reason is long enough, so a decision is never made without one.
 */
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  isOpen,
  onClose,
  onConfirm,
  isPending,
  reasonLabel,
  reasonHint,
  tone = 'primary',
  error,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState('');
  const needsReason = reasonLabel !== undefined;
  const reasonOk = !needsReason || reason.trim().length >= 5;

  return (
    <Modal title={title} isOpen={isOpen} onClose={onClose}>
      <div>{message}</div>
      {needsReason && (
        <TextField
          label={reasonLabel}
          description={reasonHint ?? 'At least 5 characters.'}
          value={reason}
          onChange={setReason}
          multiline
        />
      )}
      {error && (
        <div role="alert">
          <Callout tone="danger">{error}</Callout>
        </div>
      )}
      <ModalActions>
        <Button onPress={onClose}>Cancel</Button>
        <Button
          variant={tone === 'danger' ? 'danger' : 'primary'}
          isPending={isPending}
          isDisabled={!reasonOk}
          onPress={() => void onConfirm(reason.trim())}
        >
          {confirmLabel}
        </Button>
      </ModalActions>
    </Modal>
  );
}
