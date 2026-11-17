'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { CampusEvent } from '@/lib/types';
import type { EventRegistrationStatus } from '@/lib/db/events';

type Props = {
  event: CampusEvent;
  status?: EventRegistrationStatus;
  signedIn: boolean;
  unavailable?: boolean;
};

type PendingAction = 'register' | 'cancel';

function isEventRegistrationStatus(value: unknown): value is EventRegistrationStatus {
  if (typeof value !== 'object' || value === null) return false;
  return 'eventId' in value && typeof value.eventId === 'string'
    && 'capacity' in value && typeof value.capacity === 'number'
    && 'registrationDeadline' in value && typeof value.registrationDeadline === 'string'
    && 'seatsLeft' in value && typeof value.seatsLeft === 'number'
    && 'isRegistered' in value && typeof value.isRegistered === 'boolean'
    && 'registrationOpen' in value && typeof value.registrationOpen === 'boolean';
}

export default function EventRegistrationControl({
  event,
  status: initialStatus,
  signedIn,
  unavailable = false,
}: Props) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [statusOverride, setStatusOverride] = useState<{
    serverStatus: EventRegistrationStatus | undefined;
    value: EventRegistrationStatus;
  }>();
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const status = statusOverride && statusOverride.serverStatus === initialStatus
    ? statusOverride.value
    : initialStatus;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (pendingAction && !dialog.open) dialog.showModal();
    if (!pendingAction && dialog.open) dialog.close();
  }, [pendingAction]);

  async function confirmAction() {
    if (!pendingAction) return;
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`/api/events/${encodeURIComponent(event.id)}/registration`, {
        method: pendingAction === 'register' ? 'POST' : 'DELETE',
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const formMessage = typeof payload === 'object' && payload !== null
          && 'form' in payload && typeof payload.form === 'string'
          ? payload.form
          : 'We couldn’t update your registration. Please try again.';
        setError(formMessage);
        router.refresh();
        return;
      }

      if (
        typeof payload !== 'object' || payload === null || !('status' in payload)
        || !isEventRegistrationStatus(payload.status)
      ) {
        setError('We couldn’t confirm the registration update. Please refresh and try again.');
        return;
      }
      setStatusOverride({ serverStatus: initialStatus, value: payload.status });
      setMessage(pendingAction === 'register' ? 'You’re registered.' : 'Your registration was cancelled.');
      setPendingAction(null);
      router.refresh();
    } catch (requestError) {
      console.error('Event registration request failed.', requestError);
      setError('We couldn’t reach CampusHub. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const unavailableMessage = unavailable || !status;
  const closed = status && !status.isRegistered && !status.registrationOpen && status.seatsLeft > 0;
  const full = status && !status.isRegistered && status.seatsLeft === 0;

  return (
    <div className="event-registration">
      {status && (
        <p className="event-registration__seats" aria-live="polite">
          {status.seatsLeft} {status.seatsLeft === 1 ? 'seat' : 'seats'} left
        </p>
      )}
      <div className="event-registration__actions">
        {status?.isRegistered ? (
          <>
            <span className="event-registration__registered" role="status">Registered</span>
            <button type="button" className="btn btn--outline"
              onClick={() => { setError(''); setMessage(''); setPendingAction('cancel'); }}>
              Cancel
            </button>
          </>
        ) : full ? (
          <span className="event-registration__closed" role="status">Full</span>
        ) : closed ? (
          <span className="event-registration__closed" role="status">Registration closed</span>
        ) : !signedIn ? (
          <Link href="/auth/sign-in" className="btn btn--dark">Sign in to register</Link>
        ) : unavailableMessage ? (
          <span className="event-registration__closed">Registration unavailable</span>
        ) : (
          <button type="button" className="btn btn--dark"
            onClick={() => { setError(''); setMessage(''); setPendingAction('register'); }}>
            Register
          </button>
        )}
      </div>
      {message && <p className="form-success" role="status">{message}</p>}
      <dialog ref={dialogRef} className="registration-dialog"
        aria-labelledby={`registration-title-${event.id}`}
        aria-describedby={`registration-description-${event.id}`}
        onCancel={(event) => { event.preventDefault(); setPendingAction(null); }}>
        <h2 id={`registration-title-${event.id}`}>
          {pendingAction === 'register' ? 'Confirm registration' : 'Cancel registration?'}
        </h2>
        <p id={`registration-description-${event.id}`}>
          {pendingAction === 'register'
            ? `Register for ${event.title}?`
            : `Cancel your registration for ${event.title}?`}
        </p>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="btn-row">
          <button type="button" className="btn btn--dark" onClick={confirmAction} disabled={submitting}>
            {submitting ? 'Saving…' : pendingAction === 'register' ? 'Confirm' : 'Yes, cancel'}
          </button>
          <button type="button" className="btn btn--outline"
            onClick={() => setPendingAction(null)} disabled={submitting}>
            {pendingAction === 'cancel' ? 'Keep registration' : 'Go back'}
          </button>
        </div>
      </dialog>
    </div>
  );
}
