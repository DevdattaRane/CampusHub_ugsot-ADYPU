'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import type { Project, Student } from '@/lib/types';
import type { MyEventRegistration, UserCertificate } from '@/lib/db/events';
import type { DashboardStats } from '@/lib/db/dashboard';
import { typeColors } from '@/lib/colors';
import { dayRange, MONTHS_SHORT, parseDate } from '@/lib/dates';
import { getEvent } from '@/lib/data';
import Avatar from './Avatar';
import { LinkIcon, Trophy } from './icons';
import Button from './ui/Button';
import Card from './ui/Card';
import Input from './ui/Input';
import Tag from './ui/Tag';
import DashboardTab from './DashboardTab';

const LINK_LABELS: { key: keyof Student['links']; label: string }[] = [
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'github', label: 'GitHub' },
  { key: 'x', label: 'X' },
  { key: 'portfolio', label: 'Portfolio' },
];

type Props = {
  student: Student;
  isOwn: boolean;
  registrations?: MyEventRegistration[];
  registrationsError?: string;
  certificates?: UserCertificate[];
  bookmarkedProjects?: Project[];
  dashboardStats?: DashboardStats;
  initialGithubUsername?: string | null;
};

function computeCompleteness(p: {
  name?: string;
  year?: string;
  skills?: string[];
  bio?: string;
  github?: string | null;
  links?: Record<string, string | undefined>;
}): number {
  let score = 0;
  if (p.name?.trim()) score += 20;
  if (p.year?.trim()) score += 15;
  if (Array.isArray(p.skills) && p.skills.length > 0) score += 20;
  if (p.bio?.trim()) score += 20;
  if (p.github?.trim()) score += 15;
  const hasSocial = Boolean(
    (p.links?.linkedin && !p.links.linkedin.includes('[')) ||
    (p.links?.x && !p.links.x.includes('[')) ||
    (p.links?.portfolio && !p.links.portfolio.includes('['))
  );
  if (hasSocial) score += 10;
  return Math.min(100, score);
}

export default function ProfileView({
  student,
  isOwn,
  registrations = [],
  registrationsError = '',
  certificates = [],
  bookmarkedProjects = [],
  dashboardStats,
  initialGithubUsername = null,
}: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'dashboard'>('overview');
  const [profile, setProfile] = useState(student);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(student.name);
  const [bio, setBio] = useState(student.bio);
  const [skills, setSkills] = useState(student.skills.join(', '));
  const [githubUsername, setGithubUsername] = useState(initialGithubUsername || '');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const completeness = computeCompleteness({
    name: profile.name,
    year: profile.year,
    skills: profile.skills,
    bio: profile.bio,
    github: githubUsername || profile.links.github,
    links: profile.links,
  });
  const going = profile.going.map(getEvent).filter((event) => event !== undefined);
  const registeredEvents = registrations.flatMap((registration) => {
    const event = getEvent(registration.eventId);
    return event ? [{ registration, event }] : [];
  });
  const links = LINK_LABELS.flatMap((link) => {
    const value = profile.links[link.key];
    return value && !value.includes('[') ? [{ ...link, value }] : [];
  });

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const updatedName = name.trim();
    const updatedBio = bio.trim();
    const updatedSkills = [...new Set(skills.split(',').map((skill) => skill.trim()).filter(Boolean))];
    if (!updatedName || !updatedBio || updatedSkills.length === 0) {
      setError('Add your name, a short bio, and at least one skill.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Persist to Supabase profiles
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: updatedName,
          bio: updatedBio,
          skills: updatedSkills,
          githubUsername: githubUsername.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      setProfile({ ...profile, name: updatedName, bio: updatedBio, skills: updatedSkills });
      setSaved(true);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving profile');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveGitHub(newUsername: string) {
    const res = await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ githubUsername: newUsername.trim() || null }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to update GitHub username');
    }
    setGithubUsername(newUsername.trim());
  }

  function cancelEdit() {
    setName(profile.name);
    setBio(profile.bio);
    setSkills(profile.skills.join(', '));
    setGithubUsername(initialGithubUsername || '');
    setError('');
    setEditing(false);
  }

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
            <Avatar studentId={profile.id} name={profile.name} size="xl" />
            <h1 className="profile-card__name">{profile.name}</h1>
            <p className="profile-card__meta">{profile.branch} · {profile.year} · @{profile.handle}</p>
            {profile.lookingForTeam && <Tag>Looking for a team</Tag>}
            <p className="profile-card__bio">{profile.bio}</p>
          </div>

          {links.length > 0 && (
            <div className="link-list">
              {links.map((link) => {
                const value = link.value;
                return (
                  <a key={link.key} href={value.startsWith('http') ? value : `https://${value}`} className="link-row" target="_blank" rel="noreferrer">
                    <span aria-hidden="true" className="icon-tile"><LinkIcon /></span>
                    <span className="link-row__label">{link.label}</span>
                    <span className="link-row__value">{value}</span>
                  </a>
                );
              })}
            </div>
          )}
          {links.length === 0 && <p className="empty-note">Social links haven’t been added yet.</p>}

          {isOwn && (
            <>
              {editing ? (
                <form className="profile-edit" onSubmit={saveProfile}>
                  <h2 className="card__title">Edit your profile</h2>
                  <Input id="profile-name" label="Name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} />
                  <Input id="profile-github" label="GitHub Username" value={githubUsername} onChange={(event) => setGithubUsername(event.target.value)} placeholder="e.g. aditya-dev" maxLength={50} />
                  <label className="field" htmlFor="profile-bio">
                    <span className="field__label">Short bio</span>
                    <textarea id="profile-bio" className="textarea" value={bio} onChange={(event) => setBio(event.target.value)} required maxLength={240} rows={3} />
                  </label>
                  <Input id="profile-skills" label="Skills (separate with commas)" value={skills} onChange={(event) => setSkills(event.target.value)} required maxLength={200} />
                  <p className="profile-edit__note">Update your public student details below.</p>
                  {error && <p className="form-error" role="alert">{error}</p>}
                  <div className="btn-row">
                    <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</Button>
                    <Button type="button" variant="outline" onClick={cancelEdit}>Cancel</Button>
                  </div>
                </form>
              ) : (
                <>
                  <Button type="button" onClick={() => { setSaved(false); setEditing(true); }}>Edit profile</Button>
                  {saved && <p className="form-success" role="status">Your profile has been updated.</p>}
                </>
              )}
            </>
          )}
        </div>
      </section>

      <div className="profile-main">
        {isOwn && (
          <div
            className="no-print"
            style={{
              display: 'flex',
              gap: 8,
              borderBottom: '2px solid #1a1a1a',
              paddingBottom: 10,
              marginBottom: 16,
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              style={{
                padding: '8px 16px',
                borderRadius: 4,
                border: '2px solid #1a1a1a',
                backgroundColor: activeTab === 'overview' ? '#1a1a1a' : '#fff',
                color: activeTab === 'overview' ? '#fff' : '#1a1a1a',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              👤 Profile Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              style={{
                padding: '8px 16px',
                borderRadius: 4,
                border: '2px solid #1a1a1a',
                backgroundColor: activeTab === 'dashboard' ? '#FFE066' : '#fff',
                color: '#1a1a1a',
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: activeTab === 'dashboard' ? '2px 2px 0 #1a1a1a' : 'none',
              }}
            >
              📊 Developer Dashboard
            </button>
          </div>
        )}

        {activeTab === 'dashboard' && dashboardStats ? (
          <DashboardTab
            stats={dashboardStats}
            student={profile}
            certificates={certificates}
            bookmarkedProjects={bookmarkedProjects}
            githubUsername={githubUsername}
            onSaveGitHub={handleSaveGitHub}
          />
        ) : (
          <>
            {isOwn && (
              <Card className="profile-completeness">
                <div className="progress-head">
                  <span>Profile completeness</span>
                  <span className="progress-head__value">{completeness}%</span>
                </div>
                <div className="progress" role="progressbar" aria-valuenow={completeness} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completeness">
                  <div className="progress__bar" style={{ width: `${completeness}%` }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, flexWrap: 'wrap', gap: 6 }}>
                  <p className="muted-note" style={{ margin: 0 }}>Add skills, interests, and projects to hit 100%. Only you can see this.</p>
                  <Link href="/onboarding" style={{ fontSize: 12, fontWeight: 700, color: '#2B50FF', textDecoration: 'underline' }}>
                    Quick Onboarding Wizard →
                  </Link>
                </div>
              </Card>
            )}

            <Card aria-labelledby="skills-title" className="profile-section">
              <h2 id="skills-title" className="card__title">Skills</h2>
              {profile.skills.length ? (
                <div className="chip-row">
                  {profile.skills.map((skill) => <Tag key={skill} className="skill-chip">{skill}</Tag>)}
                </div>
              ) : <p className="empty-note">Add a few skills so teammates can find you.</p>}
            </Card>

            {dashboardStats?.badges && dashboardStats.badges.length > 0 && (
              <Card aria-labelledby="badges-title" className="profile-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 id="badges-title" className="card__title">Activity Badges ({dashboardStats.badges.length})</h2>
                  <Link href="/leaderboard" style={{ fontSize: 13, textDecoration: 'underline' }}>
                    View Leaderboard →
                  </Link>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                  {dashboardStats.badges.map((b) => (
                    <span
                      key={b}
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        padding: '4px 10px',
                        borderRadius: 4,
                        border: '1.5px solid #111',
                        backgroundColor: '#FFE14D',
                        boxShadow: '1.5px 1.5px 0 #111',
                      }}
                    >
                      🎖️ {b}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            <Card aria-labelledby="ach-title" className="profile-section">
              <h2 id="ach-title" className="card__title">Achievements</h2>
              {profile.achievements.length ? profile.achievements.map((achievement) => (
                <div key={achievement.title} className="achievement">
                  <div className="achievement__icon"><Trophy /></div>
                  <div>
                    <div className="achievement__title">{achievement.title}</div>
                    <div className="achievement__meta">{achievement.date}{achievement.verified ? ' · Verified by club admin' : ''}</div>
                  </div>
                </div>
              )) : <p className="empty-note">No achievements added yet. Your next win starts here.</p>}
            </Card>

            {isOwn && (
              <Card aria-labelledby="certificates-title" className="profile-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 id="certificates-title" className="card__title">My certificates ({certificates.length})</h2>
                  <Link href="/verify" style={{ fontSize: 13, textDecoration: 'underline' }}>
                    Verify a certificate →
                  </Link>
                </div>
                {certificates.length ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                    {certificates.map((cert) => (
                      <div
                        key={cert.id}
                        className="going-row"
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: '#fef9c3',
                          border: '2px solid var(--ink)',
                          borderRadius: 'var(--radius)',
                          padding: '10px 14px',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15 }}>🎓 {cert.eventTitle}</div>
                          <div style={{ fontSize: 12, opacity: 0.75 }}>
                            Issued {new Date(cert.issuedAt).toLocaleDateString()} · ID: {cert.id.slice(0, 8)}…
                          </div>
                        </div>
                        <Link
                          href={`/certificates/${cert.id}`}
                          className="btn btn--primary"
                          style={{ fontSize: 12, padding: '4px 10px', minHeight: 32 }}
                        >
                          View & Print
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-note">
                    No certificates earned yet. Attend events and get marked present by the organizer to receive your official certificate!
                  </p>
                )}
              </Card>
            )}

            {isOwn && (
              <Card aria-labelledby="bookmarks-title" className="profile-section">
                <h2 id="bookmarks-title" className="card__title">My bookmarks ({bookmarkedProjects.length})</h2>
                {bookmarkedProjects.length ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                    {bookmarkedProjects.map((proj) => (
                      <div
                        key={proj.id}
                        className="going-row"
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: '#f0fdf4',
                          border: '2px solid var(--ink)',
                          borderRadius: 'var(--radius)',
                          padding: '10px 14px',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15 }}>🔖 {proj.title}</div>
                          <div style={{ fontSize: 12, opacity: 0.75 }}>
                            {proj.shortDescription.slice(0, 60)}…
                          </div>
                        </div>
                        <Link
                          href={`/projects/${proj.id}`}
                          className="btn btn--primary"
                          style={{ fontSize: 12, padding: '4px 10px', minHeight: 32 }}
                        >
                          View Project
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-note">
                    No bookmarked projects yet. Bookmark interesting projects in the Project Showcase to view them here.
                  </p>
                )}
              </Card>
            )}

            {isOwn ? (
              <Card aria-labelledby="registrations-title" className="profile-section">
                <h2 id="registrations-title" className="card__title">My registrations</h2>
                {registrationsError && <p className="form-error" role="alert">{registrationsError}</p>}
                {registeredEvents.length ? (
                  <div className="going-list">
                    {registeredEvents.map(({ registration, event }) => (
                      <Link key={registration.id} href="/events" className="going-row"
                        style={{ background: typeColors[event.category].bg }}>
                        <span>{event.title}</span>
                        <span>{MONTHS_SHORT[parseDate(event.start).getMonth()]} {dayRange(event)}</span>
                      </Link>
                    ))}
                  </div>
                ) : !registrationsError ? (
                  <p className="empty-note">You haven’t registered for any events yet. Browse events to find one to join.</p>
                ) : null}
              </Card>
            ) : (
              <Card aria-labelledby="going-title" className="profile-section">
                <h2 id="going-title" className="card__title">Going to</h2>
                {going.length ? (
                  <div className="going-list">
                    {going.map((event) => (
                      <Link key={event.id} href="/events" className="going-row" style={{ background: typeColors[event.category].bg }}>
                        <span>{event.title}</span>
                        <span>{MONTHS_SHORT[parseDate(event.start).getMonth()]} {dayRange(event)}</span>
                      </Link>
                    ))}
                  </div>
                ) : <p className="empty-note">No events saved yet. Browse events and find one to join.</p>}
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
