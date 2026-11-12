'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import type { Student } from '@/lib/types';
import { typeColors } from '@/lib/colors';
import { dayRange, MONTHS_SHORT, parseDate } from '@/lib/dates';
import { getEvent } from '@/lib/data';
import Avatar from './Avatar';
import { LinkIcon, Trophy } from './icons';
import Button from './ui/Button';
import Card from './ui/Card';
import Input from './ui/Input';
import Tag from './ui/Tag';

const LINK_LABELS: { key: keyof Student['links']; label: string }[] = [
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'github', label: 'GitHub' },
  { key: 'x', label: 'X' },
  { key: 'portfolio', label: 'Portfolio' },
];

export default function ProfileView({ student, isOwn }: { student: Student; isOwn: boolean }) {
  const [profile, setProfile] = useState(student);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(student.name);
  const [bio, setBio] = useState(student.bio);
  const [skills, setSkills] = useState(student.skills.join(', '));
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const going = profile.going.map(getEvent).filter((event) => event !== undefined);
  const links = LINK_LABELS.flatMap((link) => {
    const value = profile.links[link.key];
    return value && !value.includes('[') ? [{ ...link, value }] : [];
  });

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const updatedName = name.trim();
    const updatedBio = bio.trim();
    const updatedSkills = [...new Set(skills.split(',').map((skill) => skill.trim()).filter(Boolean))];
    if (!updatedName || !updatedBio || updatedSkills.length === 0) {
      setError('Add your name, a short bio, and at least one skill.');
      return;
    }
    setProfile({ ...profile, name: updatedName, bio: updatedBio, skills: updatedSkills });
    setError('');
    setSaved(true);
    setEditing(false);
  }

  function cancelEdit() {
    setName(profile.name);
    setBio(profile.bio);
    setSkills(profile.skills.join(', '));
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
                  <label className="field" htmlFor="profile-bio">
                    <span className="field__label">Short bio</span>
                    <textarea id="profile-bio" className="textarea" value={bio} onChange={(event) => setBio(event.target.value)} required maxLength={240} rows={3} />
                  </label>
                  <Input id="profile-skills" label="Skills (separate with commas)" value={skills} onChange={(event) => setSkills(event.target.value)} required maxLength={200} />
                  <p className="profile-edit__note">Demo only: edits stay on this page and reset when you reload.</p>
                  {error && <p className="form-error" role="alert">{error}</p>}
                  <div className="btn-row">
                    <Button type="submit">Save changes</Button>
                    <Button type="button" variant="outline" onClick={cancelEdit}>Cancel</Button>
                  </div>
                </form>
              ) : (
                <>
                  <Button type="button" onClick={() => { setSaved(false); setEditing(true); }}>Edit profile</Button>
                  {saved && <p className="form-success" role="status">Your demo profile has been updated.</p>}
                </>
              )}
            </>
          )}
        </div>
      </section>

      <div className="profile-main">
        {isOwn && (
          <Card className="profile-completeness">
            <div className="progress-head">
              <span>Profile completeness</span>
              <span className="progress-head__value">{profile.profileCompleteness}%</span>
            </div>
            <div className="progress" role="progressbar" aria-valuenow={profile.profileCompleteness} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completeness">
              <div className="progress__bar" style={{ width: `${profile.profileCompleteness}%` }} />
            </div>
            <p className="muted-note">Add a portfolio project to hit 100%. Only you can see this.</p>
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

        <Card aria-labelledby="going-title" className="profile-section">
          <h2 id="going-title" className="card__title">Going to</h2>
          {going.length ? (
            <div className="going-list">
              {going.map((event) => (
                <Link key={event.id} href="/events" className="going-row" style={{ background: typeColors[event.type].bg }}>
                  <span>{event.title}</span>
                  <span>{MONTHS_SHORT[parseDate(event.start).getMonth()]} {dayRange(event)}</span>
                </Link>
              ))}
            </div>
          ) : <p className="empty-note">No events saved yet. Browse events and find one to join.</p>}
        </Card>
      </div>
    </div>
  );
}
