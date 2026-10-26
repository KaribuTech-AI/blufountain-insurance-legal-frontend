import { Dialog, Heading, Modal as AriaModal, ModalOverlay } from 'react-aria-components';
import { cx } from '../../cx';
import styles from './Modal.module.css';

export interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  /** Wider dialogs for forms with two columns. */
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

/**
 * A modal dialog. Focus is trapped inside and returned on close, Escape closes it, and the
 * page behind is hidden from screen readers (React Aria). Replaces the prototype's `confirm()`
 * and `prompt()` (frontend F section 3.4).
 */
export function Modal({ title, isOpen, onClose, size = 'sm', children }: ModalProps) {
  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      isDismissable
      className={styles.overlay}
    >
      <AriaModal className={cx(styles.modal, size === 'md' && styles.md)}>
        <Dialog className={styles.dialog}>
          <Heading slot="title" className={styles.title}>
            {title}
          </Heading>
          {children}
        </Dialog>
      </AriaModal>
    </ModalOverlay>
  );
}

export function ModalActions({ children }: { children: React.ReactNode }) {
  return <div className={styles.actions}>{children}</div>;
}
