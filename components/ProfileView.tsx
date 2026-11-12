import Link from 'next/link';
import type { Student } from '@/lib/types';
import { typeColors } from '@/lib/colors';
import { dayRange, MONTHS_SHORT, parseDate } from '@/lib/dates';
import { getEvent } from '@/lib/data';
import Avatar from './Avatar';
import { LinkIcon, Trophy } from './icons';

const LINK_LABELS: { key: keyof Student['links']; label: string }[] = [
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'github', label: 'GitHub' },
  { key: 'x', label: 'X' },
  { key: 'portfolio', label: 'Portfolio' },
];

export default function ProfileView({ student, isOwn }: { student: Student; isOwn: boolean }) {
  const going = student.going.map(getEvent).filter((e) => e !== undefined);
  const links = LINK_LABELS.filter((l) => student.links[l.key]);

  return (
    <div className="profile-layout">
      <section aria-label="Profile card" className="profile-card">
        <div aria-hidden="true" className="profile-card__banner">
          <span />
          <span />
          <span />
        </div>
        <div className="profile-card__body">
          <div className="profile-card__intro">
            <Avatar studentId={student.id} name={student.name} size="xl" />
            <div>
              <h1 className="profile-card__name">{student.name}</h1>
              <p className="profile-card__meta">{student.branch} · {student.year} · @{student.handle}</p>
            </div>
            {student.lookingForTeam && (
              <span className="chip">Looking for a team</span>
            )}
            <p className="profile-card__bio">{student.bio}</p>
          </div>

          {links.length > 0 && (
            <div className="link-list">
              {links.map((l) => {
                const value = student.links[l.key] as string;
                return (
                  <a key={l.key} href={value.startsWith('http') ? value : `https://${value}`} className="link-row" target="_blank" rel="noreferrer">
                    <span aria-hidden="true" className="icon-tile">
                      <LinkIcon />
                    </span>
                    <span className="link-row__label">{l.label}</span>
                    <span className="link-row__value">{value}</span>
                  </a>
                );
              })}
            </div>
          )}

          {isOwn && <button type="button" className="btn btn--primary">Edit profile</button>}
        </div>
      </section>

      <div className="profile-main">
        {isOwn && (
          <section className="card">
            <div className="progress-head">
              <span>Profile completeness</span>
              <span className="progress-head__value">{student.profileCompleteness}%</span>
            </div>
            <div className="progress" role="progressbar" aria-valuenow={student.profileCompleteness} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completeness">
              <div className="progress__bar" style={{ width: `${student.profileCompleteness}%` }} />
            </div>
            <p className="muted-note" style={{ fontSize: 14 }}>Add a portfolio project to hit 100%. Only you can see this.</p>
          </section>
        )}

        <section aria-labelledby="skills-title" className="card">
          <h2 id="skills-title" className="card__title" style={{ marginBottom: 14 }}>Skills</h2>
          <div className="chip-row" style={{ gap: 8 }}>
            {student.skills.map((k) => (
              <span key={k} className="skill-chip">{k}</span>
            ))}
          </div>
        </section>

        <section aria-labelledby="ach-title" className="card">
          <h2 id="ach-title" className="card__title" style={{ marginBottom: 6 }}>Achievements</h2>
          {student.achievements.length === 0 && <p className="muted-note" style={{ paddingTop: 8 }}>No achievements added yet.</p>}
          {student.achievements.map((a) => (
            <div key={a.title} className="achievement">
              <div className="achievement__icon"><Trophy /></div>
              <div>
                <div className="achievement__title">{a.title}</div>
                <div className="achievement__meta">{a.date}{a.verified ? ' · Verified by club admin' : ''}</div>
              </div>
            </div>
          ))}
        </section>

        <section aria-labelledby="going-title" className="card">
          <h2 id="going-title" className="card__title">Going to</h2>
          {going.length === 0 && <p className="muted-note" style={{ paddingTop: 8 }}>Not signed up for any events yet.</p>}
          <div className="going-list">
            {going.map((e) => (
              <Link key={e.id} href="/events" className="going-row" style={{ background: typeColors[e.type].bg }}>
                <span>{e.title}</span>
                <span style={{ fontSize: 14, color: typeColors[e.type].fg }}>{MONTHS_SHORT[parseDate(e.start).getMonth()]} {dayRange(e)}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
