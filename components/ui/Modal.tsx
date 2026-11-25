'use client';

import { useEffect, type ReactNode } from 'react';

type Props = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
};

export default function Modal({ open, title, children, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      className="ui-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="ui-modal" role="dialog" aria-modal="true" aria-label={title}>
        <header className="ui-modal__head">
          <h2>{title}</h2>
          <button type="button" className="topbar-icon" aria-label="Close dialog" onClick={onClose}>×</button>
        </header>
        {children}
      </section>
    </div>
  );
}
