'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CurrentUser } from '@/lib/auth';

type Props = {
  currentUser: CurrentUser;
};

const INTEREST_OPTIONS = [
  'Web Development',
  'AI / Machine Learning',
  'Mobile Apps & Flutter',
  'Cloud & DevOps',
  'CyberSecurity',
  'Open Source & Git',
  'UI / UX Design',
  'Data Structures & Algorithms',
  'IoT & Robotics',
  'Game Dev',
];

const GOAL_OPTIONS = [
  { id: 'learn', label: '🧠 Learn & level up tech skills' },
  { id: 'build', label: '🛠️ Build & publish real-world projects' },
  { id: 'mentor', label: '🎓 Mentor and guide fellow students' },
  { id: 'find_team', label: '🤝 Find teammates for hackathons' },
];

const COURSE_YEARS = [
  'B.Tech CSE - 1st Year',
  'B.Tech CSE - 2nd Year',
  'B.Tech CSE - 3rd Year',
  'B.Tech CSE - 4th Year',
  'B.Tech AI-DS / Cyber - 1st Year',
  'B.Tech AI-DS / Cyber - 2nd Year',
  'B.Tech AI-DS / Cyber - 3rd Year',
  'B.Tech AI-DS / Cyber - 4th Year',
  'BCA / MCA',
  'Other Campus Degree',
];

export default function OnboardingView({ currentUser }: Props) {
  const router = useRouter();
  const [fullName, setFullName] = useState(currentUser.name || '');
  const [courseYear, setCourseYear] = useState(currentUser.courseYear || '');
  const [skillsInput, setSkillsInput] = useState((currentUser.skills || []).join(', '));
  const [selectedInterests, setSelectedInterests] = useState<string[]>(currentUser.interests || []);
  const [selectedGoals, setSelectedGoals] = useState<string[]>(currentUser.goals || []);
  const [githubUsername, setGithubUsername] = useState(currentUser.githubUsername || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const toggleGoal = (goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId) ? prev.filter((g) => g !== goalId) : [...prev, goalId]
    );
  };

  const handleFinish = async (skip = false) => {
    setSubmitting(true);
    setError(null);

    const skills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch('/api/profile/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim() || currentUser.name,
          courseYear,
          skills,
          interests: selectedInterests,
          goals: selectedGoals,
          githubUsername,
          skip,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Unable to save onboarding preferences.');
      }

      router.push('/profile');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete onboarding');
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div
        className="card"
        style={{
          padding: '28px 24px',
          border: '2px solid #111',
          borderRadius: 4,
          backgroundColor: '#FFFFFF',
          boxShadow: '4px 4px 0 #111',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-block',
              padding: '4px 10px',
              backgroundColor: '#FFE14D',
              border: '1.5px solid #111',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 800,
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            👋 Welcome to CampusHub!
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>Set up your student profile</h1>
          <p style={{ margin: '6px 0 0 0', fontSize: 14, color: '#555', lineHeight: 1.5 }}>
            Help fellow ADYPU students and mentors find you for projects, hackathons, and study groups.
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: 12,
              backgroundColor: '#FEE2E2',
              border: '2px solid #111',
              borderRadius: 4,
              color: '#991B1B',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {error}
          </div>
        )}

        {/* 1. Name */}
        <div className="field">
          <label className="field__label" htmlFor="onboard-name">Your Full Name *</label>
          <input
            id="onboard-name"
            type="text"
            className="input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Aditya Chaudhari"
            required
          />
        </div>

        {/* 2. Course and Year */}
        <div className="field">
          <label className="field__label" htmlFor="onboard-year">Course & Academic Year</label>
          <select
            id="onboard-year"
            className="input"
            value={courseYear}
            onChange={(e) => setCourseYear(e.target.value)}
          >
            <option value="">Select your course & year</option>
            {COURSE_YEARS.map((cy) => (
              <option key={cy} value={cy}>
                {cy}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Skills */}
        <div className="field">
          <label className="field__label" htmlFor="onboard-skills">
            Skills (comma separated)
          </label>
          <input
            id="onboard-skills"
            type="text"
            className="input"
            value={skillsInput}
            onChange={(e) => setSkillsInput(e.target.value)}
            placeholder="e.g. React, Next.js, Python, Figma, PostgreSQL"
          />
        </div>

        {/* 4. Interests (Pill Toggles) */}
        <div className="field">
          <label className="field__label">Areas of Interest (Select all that apply)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
            {INTEREST_OPTIONS.map((interest) => {
              const selected = selectedInterests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 4,
                    border: '1.5px solid #111',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: selected ? '#2B50FF' : '#F6F1E7',
                    color: selected ? '#FFFFFF' : '#111111',
                    boxShadow: selected ? '2px 2px 0 #111' : 'none',
                    transition: 'all 0.1s ease',
                  }}
                >
                  {interest} {selected ? '✓' : '+'}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. What are you looking to do? (Goals) */}
        <div className="field">
          <label className="field__label">What do you want to accomplish on CampusHub?</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            {GOAL_OPTIONS.map((goal) => {
              const checked = selectedGoals.includes(goal.id);
              return (
                <label
                  key={goal.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 4,
                    border: '1.5px solid #111',
                    backgroundColor: checked ? '#FEF08A' : '#FAF8F5',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleGoal(goal.id)}
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <span>{goal.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* 6. GitHub Profile */}
        <div className="field">
          <label className="field__label" htmlFor="onboard-gh">
            GitHub Username (Optional)
          </label>
          <input
            id="onboard-gh"
            type="text"
            className="input"
            value={githubUsername}
            onChange={(e) => setGithubUsername(e.target.value)}
            placeholder="e.g. aditya-dev"
          />
          <span style={{ fontSize: 11, color: '#666' }}>
            We use this to display your public repositories and open-source contributions.
          </span>
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '2px solid #111',
            paddingTop: 16,
            marginTop: 8,
          }}
        >
          <button
            type="button"
            onClick={() => handleFinish(true)}
            disabled={submitting}
            style={{
              background: 'none',
              border: 'none',
              color: '#666',
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            Skip for now →
          </button>

          <button
            type="button"
            className="btn btn--primary"
            onClick={() => handleFinish(false)}
            disabled={submitting}
          >
            {submitting ? 'Saving Profile...' : 'Complete Profile & Continue →'}
          </button>
        </div>
      </div>
    </div>
  );
}
