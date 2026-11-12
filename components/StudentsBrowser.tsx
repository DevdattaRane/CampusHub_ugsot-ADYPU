'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { Student } from '@/lib/types';
import Avatar from './Avatar';
import FilterPills from './FilterPills';
import Button from './ui/Button';
import Input from './ui/Input';
import Tag from './ui/Tag';

const SKILLS = ['All', 'React', 'Python', 'ML', 'Figma', 'Flutter'] as const;

export default function StudentsBrowser({ students }: { students: Student[] }) {
  const [query, setQuery] = useState('');
  const [skill, setSkill] = useState<(typeof SKILLS)[number]>('All');
  const [teamOnly, setTeamOnly] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.filter(
      (s) =>
        (skill === 'All' || s.skills.includes(skill)) &&
        (!teamOnly || s.lookingForTeam) &&
        (!q || s.name.toLowerCase().includes(q) || s.skills.some((k) => k.toLowerCase().includes(q))),
    );
  }, [students, query, skill, teamOnly]);

  return (
    <>
      <section aria-label="Search and filters" className="card student-filters">
        <div className="search-row">
          <Input id="student-search" label="Search by name or skill" type="search" placeholder="e.g. React, Python, Sneha" value={query} onChange={(e) => setQuery(e.target.value)} />
          <Button variant="outline" className="toggle-btn" aria-pressed={teamOnly} onClick={() => setTeamOnly((v) => !v)}>
            Looking for a team only
          </Button>
        </div>
        <FilterPills label="Skill" options={SKILLS} value={skill} onChange={setSkill} />
      </section>

      <p className="count" aria-live="polite">{results.length === 1 ? '1 student' : `${results.length} students`}</p>

      {results.length > 0 ? (
        <div className="student-grid">
          {results.map((s) => (
            <article key={s.id} className="student-card card">
              <div className="student-card__head">
                <Avatar studentId={s.id} name={s.name} size="lg" />
                <div style={{ minWidth: 0 }}>
                  <h2 className="student-card__name">{s.name}</h2>
                  <p className="student-card__meta">{s.branch} · {s.year}</p>
                </div>
              </div>
              <div className="chip-row">
                {s.skills.map((k) => <span key={k} className="chip chip--neutral">{k}</span>)}
              </div>
              <div className="student-card__foot">
                {s.lookingForTeam ? (
                  <Tag className="chip">Looking for a team</Tag>
                ) : (
                  <span className="muted-note">Not looking right now</span>
                )}
                <Link href={`/students/${s.id}`} className="btn btn--dark">View profile</Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="empty">No one matches yet. Try a different skill.</p>
      )}
    </>
  );
}
