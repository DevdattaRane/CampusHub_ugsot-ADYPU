'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import type { HackathonTeam } from '@/lib/db/events';
import type { Student } from '@/lib/types';

type Props = {
  eventId: string;
  registrationDeadline: string;
  registrationClosed: boolean;
  teamSizeMin: number;
  teamSizeMax: number;
  teams: HackathonTeam[];
  studentsLookingForTeam: Student[];
  currentUserEmail: string | null;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readFormError(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null || !('form' in payload)) return null;
  return typeof payload.form === 'string' ? payload.form : null;
}

export default function HackathonTeamRegistration({
  eventId,
  registrationDeadline,
  registrationClosed,
  teamSizeMin,
  teamSizeMax,
  teams,
  studentsLookingForTeam,
  currentUserEmail,
}: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [memberEmails, setMemberEmails] = useState('');

  async function submitTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const nameValue = formData.get('teamName');
    const name = typeof nameValue === 'string' ? nameValue.trim() : '';
    if (!name || name.length > 80) {
      setError('Team names must be between 1 and 80 characters.');
      return;
    }
    if (!currentUserEmail) {
      setError('Sign in before creating a team.');
      return;
    }

    const emails = memberEmails
      .split(/[\n,;]/)
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
    if (emails.some((email) => !EMAIL_PATTERN.test(email))) {
      setError('Check each email address and try again.');
      return;
    }
    if (new Set(emails).size !== emails.length) {
      setError('Remove duplicate email addresses.');
      return;
    }
    if (emails.includes(currentUserEmail.toLowerCase())) {
      setError('Your email is already included as the team leader.');
      return;
    }
    const teamSize = emails.length + 1;
    if (teamSize < teamSizeMin || teamSize > teamSizeMax) {
      setError(`Add members so the team has ${teamSizeMin}–${teamSizeMax} people, including you.`);
      return;
    }

    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`/api/events/${encodeURIComponent(eventId)}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, memberEmails: emails }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        setError(readFormError(payload) ?? 'We couldn’t create the team. Please try again.');
        return;
      }

      form.reset();
      setMemberEmails('');
      setMessage('Your team is registered.');
      router.refresh();
    } catch (requestError) {
      console.error('Hackathon team registration request failed.', requestError);
      setError('We couldn’t reach CampusHub. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card hackathon-panel" aria-labelledby="team-registration-title">
      <div>
        <p className="eyebrow">Build your squad</p>
        <h2 id="team-registration-title" className="card__title">Team registration</h2>
        <p className="muted-note">
          Teams must have {teamSizeMin}–{teamSizeMax} members, including the leader. Each email can be on one team for this hackathon.
        </p>
      </div>

      {teams.length > 0 ? (
        <div className="hackathon-team-list">
          <p className="form-success" role="status">You’re already on a team for this hackathon.</p>
          {teams.map((team) => (
            <article key={team.id} className="team-card">
              <h3>{team.name}</h3>
              <p><strong>Team leader:</strong> {team.leaderEmail}</p>
              <p><strong>Members ({team.memberEmails.length}):</strong></p>
              <ul>
                {team.memberEmails.map((email) => (
                  <li key={email}>{email}{email === team.leaderEmail ? ' · Leader' : ''}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      ) : registrationClosed ? (
        <p className="empty-note">Team registration closed on {registrationDeadline}.</p>
      ) : currentUserEmail ? (
        <form className="hackathon-form" onSubmit={submitTeam}>
          <label className="field" htmlFor={`team-name-${eventId}`}>
            <span className="field__label">Team name</span>
            <input id={`team-name-${eventId}`} name="teamName" className="input"
              maxLength={80} required />
          </label>
          <p className="muted-note">You’ll be the team leader: {currentUserEmail}</p>
          <label className="field" htmlFor={`team-emails-${eventId}`}>
            <span className="field__label">Member emails (one per line)</span>
            <textarea id={`team-emails-${eventId}`} className="textarea" rows={4}
              value={memberEmails} onChange={(event) => setMemberEmails(event.target.value)}
              placeholder="teammate@example.com" aria-describedby={`team-email-help-${eventId}`} />
          </label>
          <p id={`team-email-help-${eventId}`} className="muted-note">
            Your own email is added as leader. Email addresses are checked and normalized before saving.
          </p>
          {error && <p className="form-error" role="alert">{error}</p>}
          {message && <p className="form-success" role="status">{message}</p>}
          <button type="submit" className="btn btn--dark" disabled={submitting}>
            {submitting ? 'Registering…' : 'Create team'}
          </button>
        </form>
      ) : (
        <div className="hackathon-sign-in">
          <p>Sign in to create a team and invite members by email.</p>
          <Link href="/auth/sign-in" className="btn btn--dark">Sign in to register a team</Link>
        </div>
      )}

      <div className="team-suggestions">
        <div>
          <h3>Looking for a team</h3>
          <p className="muted-note">
            Find a student to invite, view their profile, then enter the email they use on CampusHub.
          </p>
        </div>
        {studentsLookingForTeam.length ? (
          <ul className="team-suggestions__list">
            {studentsLookingForTeam.map((student) => (
              <li key={student.id} className="team-suggestion">
                <div>
                  <strong>{student.name}</strong>
                  <p>{student.skills.join(' · ')}</p>
                </div>
                <Link href={`/students/${student.id}`} className="link-more">
                  View profile
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-note">No students are currently marked as looking for a team.</p>
        )}
      </div>
    </section>
  );
}
