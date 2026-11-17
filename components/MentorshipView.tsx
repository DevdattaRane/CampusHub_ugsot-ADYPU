'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { CurrentUser } from '@/lib/auth';
import type { CodeReview, MentorProfile, MentorshipSession } from '@/lib/types';

type Props = {
  initialMentors: MentorProfile[];
  initialSessions: { asMentee: MentorshipSession[]; asMentor: MentorshipSession[] };
  initialReviews: CodeReview[];
  myMentorProfile: MentorProfile | null;
  currentUser: CurrentUser | null;
};

const CAREER_TOPICS = [
  {
    id: 'resume',
    title: '📄 Resume & Portfolio Review',
    desc: 'Get personalized feedback on your tech resume, GitHub profile, and project demos.',
  },
  {
    id: 'internship',
    title: '💼 Internship & Job Strategy',
    desc: 'Learn how seniors landed top internships, off-campus referrals, and cold outreach.',
  },
  {
    id: 'opensource',
    title: '🌐 Open-Source Contributions',
    desc: 'Get guided through your first PR, GSOC/LFX programs, and navigating large repos.',
  },
  {
    id: 'interviews',
    title: '🎯 DSA & System Design Mock',
    desc: 'Practice live problem-solving, behavioral questions, and scalable system design.',
  },
];

const SKILL_FILTERS = ['All', 'Python', 'Go', 'React', 'Docker', 'Machine Learning', 'Git'];

export default function MentorshipView({
  initialMentors,
  initialSessions,
  initialReviews,
  myMentorProfile,
  currentUser,
}: Props) {
  const [activeTab, setActiveTab] = useState<'mentors' | 'sessions' | 'reviews' | 'career'>('mentors');
  const [mentors] = useState<MentorProfile[]>(initialMentors);
  const [sessions, setSessions] = useState(initialSessions);
  const [reviews, setReviews] = useState<CodeReview[]>(initialReviews);
  const [selectedSkill, setSelectedSkill] = useState('All');

  // Booking Modal State
  const [bookingMentor, setBookingMentor] = useState<MentorProfile | null>(null);
  const [bookDate, setBookDate] = useState('');
  const [bookSlot, setBookSlot] = useState('');
  const [bookTopic, setBookTopic] = useState('');
  const [bookNotes, setBookNotes] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Apply Mentor Modal State
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyBio, setApplyBio] = useState('');
  const [applySkills, setApplySkills] = useState('');
  const [applyAreas, setApplyAreas] = useState('');
  const [applySlots, setApplySlots] = useState('Monday 5:00 PM - 6:00 PM, Saturday 11:00 AM - 12:00 PM');
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  // Request Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [revTitle, setRevTitle] = useState('');
  const [revGithub, setRevGithub] = useState('');
  const [revSnippet, setRevSnippet] = useState('');
  const [revLanguage, setRevLanguage] = useState('TypeScript');
  const [revNotes, setRevNotes] = useState('');
  const [revSubmitting, setRevSubmitting] = useState(false);

  // Review Feedback Inline State
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({});

  const filteredMentors = useMemo(() => {
    if (selectedSkill === 'All') return mentors;
    return mentors.filter((m) =>
      m.skills.some((s) => s.toLowerCase().includes(selectedSkill.toLowerCase())),
    );
  }, [mentors, selectedSkill]);

  async function handleBookSession(e: React.FormEvent) {
    e.preventDefault();
    if (!bookingMentor || !bookDate || !bookSlot || !bookTopic.trim() || bookingSubmitting) return;

    setBookingSubmitting(true);
    setBookingError('');

    try {
      const response = await fetch('/api/mentorship/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentorId: bookingMentor.id,
          date: bookDate,
          slot: bookSlot,
          topic: bookTopic.trim(),
          notes: bookNotes.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to book session');

      const newSession: MentorshipSession = {
        id: data.sessionId || `sess-${Date.now()}`,
        mentorId: bookingMentor.id,
        mentorName: bookingMentor.name,
        mentorEmail: bookingMentor.email,
        menteeId: currentUser?.id || 'me',
        menteeName: currentUser?.name || 'You',
        menteeEmail: currentUser?.email || '',
        slot: bookSlot,
        date: bookDate,
        topic: bookTopic.trim(),
        notes: bookNotes.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      setSessions((prev) => ({
        ...prev,
        asMentee: [...prev.asMentee, newSession],
      }));
      setBookingSuccess(true);
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Error booking session');
    } finally {
      setBookingSubmitting(false);
    }
  }

  async function handleApplyMentor(e: React.FormEvent) {
    e.preventDefault();
    if (!applyBio.trim() || !applySkills.trim() || !applySlots.trim() || applySubmitting) return;

    setApplySubmitting(true);
    try {
      const response = await fetch('/api/mentorship/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: applyBio.trim(),
          skills: applySkills.split(',').map((s) => s.trim()).filter(Boolean),
          areas: applyAreas.split(',').map((s) => s.trim()).filter(Boolean),
          availabilitySlots: applySlots.split(',').map((s) => s.trim()).filter(Boolean),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to apply');

      setApplySuccess(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error applying for mentorship');
    } finally {
      setApplySubmitting(false);
    }
  }

  async function handleUpdateSession(sessionId: string, status: 'accepted' | 'declined' | 'completed' | 'cancelled') {
    setSessions((prev) => ({
      asMentee: prev.asMentee.map((s) => (s.id === sessionId ? { ...s, status } : s)),
      asMentor: prev.asMentor.map((s) => (s.id === sessionId ? { ...s, status } : s)),
    }));

    try {
      await fetch(`/api/mentorship/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      console.error('Session update failed:', err);
    }
  }

  async function handleRequestReview(e: React.FormEvent) {
    e.preventDefault();
    if (!revTitle.trim() || !revNotes.trim() || revSubmitting) return;

    setRevSubmitting(true);
    try {
      const response = await fetch('/api/mentorship/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: revTitle.trim(),
          githubUrl: revGithub.trim() || null,
          codeSnippet: revSnippet.trim() || null,
          language: revLanguage,
          notes: revNotes.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to request review');

      const newReview: CodeReview = {
        id: data.reviewId || `rev-${Date.now()}`,
        requesterId: currentUser?.id || 'me',
        requesterName: currentUser?.name || 'You',
        requesterEmail: currentUser?.email || '',
        title: revTitle.trim(),
        githubUrl: revGithub.trim() || null,
        codeSnippet: revSnippet.trim() || null,
        language: revLanguage,
        notes: revNotes.trim(),
        mentorId: null,
        mentorName: null,
        feedback: null,
        status: 'open',
        createdAt: new Date().toISOString(),
      };

      setReviews((prev) => [newReview, ...prev]);
      setShowReviewModal(false);
      setRevTitle('');
      setRevGithub('');
      setRevSnippet('');
      setRevNotes('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error submitting review request');
    } finally {
      setRevSubmitting(false);
    }
  }

  async function handleClaimReview(reviewId: string) {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? { ...r, status: 'claimed', mentorName: currentUser?.name || 'You' }
          : r,
      ),
    );

    try {
      await fetch(`/api/mentorship/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'claim' }),
      });
    } catch (err) {
      console.error('Claim failed:', err);
    }
  }

  async function handleSubmitFeedback(reviewId: string) {
    const feedbackText = feedbackDrafts[reviewId]?.trim();
    if (!feedbackText) return;

    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId ? { ...r, feedback: feedbackText, status: 'reviewed' } : r,
      ),
    );

    try {
      await fetch(`/api/mentorship/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'feedback', feedback: feedbackText }),
      });
    } catch (err) {
      console.error('Submit feedback failed:', err);
    }
  }

  async function handleResolveReview(reviewId: string) {
    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, status: 'resolved' } : r)),
    );

    try {
      await fetch(`/api/mentorship/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve' }),
      });
    } catch (err) {
      console.error('Resolve failed:', err);
    }
  }

  function startCareerMentorship(topicTitle: string) {
    setBookTopic(topicTitle);
    if (mentors.length > 0) {
      setBookingMentor(mentors[0]);
      setBookSlot(mentors[0].availabilitySlots[0] || 'Flexible');
      setBookingSuccess(false);
      setBookingError('');
    } else {
      setActiveTab('mentors');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Mentorship Navigation Tabs */}
      <div
        className="segmented"
        role="tablist"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          border: '2px solid var(--ink)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          background: 'var(--bg)',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('mentors')}
          style={{
            padding: '12px 14px',
            fontWeight: 800,
            fontSize: 14,
            border: 'none',
            background: activeTab === 'mentors' ? 'var(--highlight, #ffd166)' : 'transparent',
            cursor: 'pointer',
          }}
        >
          🎓 Find Mentors ({filteredMentors.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('sessions')}
          style={{
            padding: '12px 14px',
            fontWeight: 800,
            fontSize: 14,
            border: 'none',
            background: activeTab === 'sessions' ? 'var(--highlight, #ffd166)' : 'transparent',
            cursor: 'pointer',
          }}
        >
          📅 My Sessions ({sessions.asMentee.length + sessions.asMentor.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('reviews')}
          style={{
            padding: '12px 14px',
            fontWeight: 800,
            fontSize: 14,
            border: 'none',
            background: activeTab === 'reviews' ? 'var(--highlight, #ffd166)' : 'transparent',
            cursor: 'pointer',
          }}
        >
          🔍 Code Reviews ({reviews.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('career')}
          style={{
            padding: '12px 14px',
            fontWeight: 800,
            fontSize: 14,
            border: 'none',
            background: activeTab === 'career' ? 'var(--highlight, #ffd166)' : 'transparent',
            cursor: 'pointer',
          }}
        >
          🚀 Career Guidance
        </button>
      </div>

      {/* TAB 1: BROWSE MENTORS */}
      {activeTab === 'mentors' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Controls Bar */}
          <div className="card" style={{ padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, marginRight: 4 }}>Skill Area:</span>
              {SKILL_FILTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="chip"
                  onClick={() => setSelectedSkill(s)}
                  style={{
                    background: selectedSkill === s ? 'var(--ink)' : 'var(--card)',
                    color: selectedSkill === s ? '#ffffff' : 'var(--ink)',
                    border: '1.5px solid var(--ink)',
                    cursor: 'pointer',
                    fontSize: 12,
                    padding: '3px 10px',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            <div>
              {currentUser ? (
                <button
                  type="button"
                  className="btn btn--outline"
                  onClick={() => { setShowApplyModal(true); setApplySuccess(false); }}
                >
                  {myMentorProfile ? '✓ Edit Mentor Profile' : '+ Apply as a Mentor'}
                </button>
              ) : (
                <Link href="/auth/sign-in" className="btn btn--primary">
                  Sign in to book
                </Link>
              )}
            </div>
          </div>

          {/* Mentors Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 18 }}>
            {filteredMentors.map((mentor) => (
              <article key={mentor.id} className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{mentor.name}</h3>
                      <span style={{ fontSize: 12, opacity: 0.75 }}>{mentor.email}</span>
                    </div>
                    <span style={{ background: '#dcfce7', color: '#15803d', fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 999, border: '1px solid #86efac' }}>
                      ✓ Approved Mentor
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{mentor.bio}</p>

                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.75 }}>Focus Areas:</span>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                      {mentor.areas.map((a) => (
                        <span key={a} className="chip chip--neutral" style={{ fontSize: 11, padding: '2px 8px' }}>
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.75 }}>Skills:</span>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                      {mentor.skills.map((s) => (
                        <span key={s} className="chip" style={{ fontSize: 11, padding: '2px 8px', background: '#e0f2fe', color: '#0369a1' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: 10, borderRadius: 6, fontSize: 12 }}>
                    <strong>Weekly Availability:</strong>
                    <ul style={{ margin: '4px 0 0', paddingLeft: 16 }}>
                      {mentor.availabilitySlots.map((slot) => (
                        <li key={slot}>{slot}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setBookingMentor(mentor);
                      setBookSlot(mentor.availabilitySlots[0] || 'General session');
                      setBookingSuccess(false);
                      setBookingError('');
                    }}
                    className="btn btn--primary"
                    style={{ width: '100%' }}
                  >
                    📅 Book a Mentorship Session
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: MY SESSIONS */}
      {activeTab === 'sessions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* As Mentee */}
          <div className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>Sessions You Booked ({sessions.asMentee.length})</h2>
            {sessions.asMentee.length === 0 ? (
              <p style={{ margin: 0, opacity: 0.75, fontSize: 14 }}>You have no booked sessions yet. Pick a mentor above to schedule one!</p>
            ) : (
              sessions.asMentee.map((sess) => (
                <div key={sess.id} style={{ padding: 14, border: '1.5px solid var(--ink)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <strong>With {sess.mentorName}</strong>
                      <span className="chip chip--neutral" style={{ fontSize: 11, padding: '2px 6px' }}>{sess.date} · {sess.slot}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>[{sess.status}]</span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: 14 }}>Topic: <strong>{sess.topic}</strong> {sess.notes && `· Note: ${sess.notes}`}</p>
                  </div>
                  {sess.status === 'pending' && (
                    <button type="button" onClick={() => handleUpdateSession(sess.id, 'cancelled')} className="btn btn--ghost" style={{ color: '#dc2626', fontSize: 12 }}>
                      Cancel
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* As Mentor */}
          {sessions.asMentor.length > 0 && (
            <div className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>Mentee Requests for You ({sessions.asMentor.length})</h2>
              {sessions.asMentor.map((sess) => (
                <div key={sess.id} style={{ padding: 14, border: '1.5px solid var(--ink)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <strong>Mentee: {sess.menteeName}</strong> ({sess.menteeEmail})
                      <span className="chip chip--neutral" style={{ fontSize: 11, padding: '2px 6px' }}>{sess.date} · {sess.slot}</span>
                      <span style={{ fontSize: 12, fontWeight: 800 }}>[{sess.status}]</span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: 14 }}>Topic: <strong>{sess.topic}</strong> {sess.notes && `· Note: ${sess.notes}`}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {sess.status === 'pending' && (
                      <>
                        <button type="button" onClick={() => handleUpdateSession(sess.id, 'accepted')} className="btn btn--primary" style={{ fontSize: 12 }}>
                          Accept
                        </button>
                        <button type="button" onClick={() => handleUpdateSession(sess.id, 'declined')} className="btn btn--ghost" style={{ fontSize: 12, color: '#dc2626' }}>
                          Decline
                        </button>
                      </>
                    )}
                    {sess.status === 'accepted' && (
                      <button type="button" onClick={() => handleUpdateSession(sess.id, 'completed')} className="btn btn--outline" style={{ fontSize: 12, color: '#16a34a' }}>
                        ✓ Mark Completed
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CODE REVIEWS */}
      {activeTab === 'reviews' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18 }}>Peer & Mentor Code Reviews</h2>
              <p style={{ margin: '4px 0 0', opacity: 0.8, fontSize: 14 }}>Submit a GitHub repo link or snippet to get feedback on code quality and patterns.</p>
            </div>
            {currentUser && (
              <button type="button" onClick={() => setShowReviewModal(true)} className="btn btn--primary">
                + Request Code Review
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {reviews.map((rev) => (
              <article key={rev.id} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className="chip" style={{ background: '#fef08a', color: '#854d0e', fontSize: 11 }}>{rev.language}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>[{rev.status}]</span>
                      <span style={{ fontSize: 13, opacity: 0.8 }}>Requested by <strong>{rev.requesterName}</strong></span>
                    </div>
                    <h3 style={{ margin: '6px 0 0', fontSize: 18 }}>{rev.title}</h3>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    {rev.status === 'open' && (
                      <button type="button" onClick={() => handleClaimReview(rev.id)} className="btn btn--primary" style={{ fontSize: 12, padding: '4px 10px' }}>
                        Claim Review
                      </button>
                    )}
                    {rev.status === 'reviewed' && rev.requesterId === currentUser?.id && (
                      <button type="button" onClick={() => handleResolveReview(rev.id)} className="btn btn--outline" style={{ fontSize: 12, color: '#16a34a' }}>
                        ✓ Mark Resolved
                      </button>
                    )}
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: 14 }}><strong>Notes:</strong> {rev.notes}</p>

                {rev.githubUrl && (
                  <div>
                    <a href={rev.githubUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, textDecoration: 'underline', color: 'var(--accent)' }}>
                      🐙 View GitHub Code Reference ↗
                    </a>
                  </div>
                )}

                {rev.codeSnippet && (
                  <pre style={{ background: '#1e293b', color: '#f8fafc', padding: 12, borderRadius: 6, fontSize: 12, overflowX: 'auto' }}>
                    <code>{rev.codeSnippet}</code>
                  </pre>
                )}

                {/* Feedback */}
                {rev.feedback ? (
                  <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', padding: 14, borderRadius: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#15803d' }}>
                      Mentor Feedback ({rev.mentorName || 'Mentor'}):
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: 14, color: '#166534' }}>{rev.feedback}</p>
                  </div>
                ) : rev.status === 'claimed' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#f8fafc', padding: 12, borderRadius: 6 }}>
                    <label style={{ fontSize: 13, fontWeight: 700 }}>Submit Mentor Feedback:</label>
                    <textarea
                      rows={3}
                      className="textarea"
                      placeholder="Write your feedback, recommendations, and suggested fixes..."
                      value={feedbackDrafts[rev.id] || ''}
                      onChange={(e) => setFeedbackDrafts((prev) => ({ ...prev, [rev.id]: e.target.value }))}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button type="button" onClick={() => handleSubmitFeedback(rev.id)} className="btn btn--primary" style={{ fontSize: 12 }}>
                        Submit Feedback
                      </button>
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CAREER GUIDANCE */}
      {activeTab === 'career' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ padding: 20 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Senior Career Coaching & Prep Pods</h2>
            <p style={{ margin: '6px 0 0', opacity: 0.85, fontSize: 15 }}>
              Choose a topic below to connect directly with senior mentors who have gone through off-campus hiring, hackathon wins, and open-source programs.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
            {CAREER_TOPICS.map((topic) => (
              <div key={topic.id} className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18 }}>{topic.title}</h3>
                  <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.5, opacity: 0.85 }}>{topic.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => startCareerMentorship(topic.title)}
                  className="btn btn--primary"
                  style={{ alignSelf: 'flex-start' }}
                >
                  Ask a Mentor →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BOOKING MODAL */}
      {bookingMentor && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}>
          <div className="card" style={{ maxWidth: 480, width: '100%', padding: 24, background: '#ffffff', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ margin: 0, fontSize: 18 }}>Book Mentorship with {bookingMentor.name}</h3>

            {bookingSuccess ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#16a34a' }}>
                  ✓ Session booked successfully! View status under &quot;My Sessions&quot;.
                </p>
                <button type="button" className="btn btn--primary" onClick={() => { setBookingMentor(null); setBookingSuccess(false); setActiveTab('sessions'); }}>
                  View My Sessions
                </button>
              </div>
            ) : (
              <form onSubmit={handleBookSession} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {bookingError && <p className="form-error" role="alert">{bookingError}</p>}

                <div className="field">
                  <label htmlFor="book-date" className="field__label">Date *</label>
                  <input
                    id="book-date"
                    type="date"
                    className="input"
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="book-slot" className="field__label">Choose Availability Slot *</label>
                  <select
                    id="book-slot"
                    className="input"
                    value={bookSlot}
                    onChange={(e) => setBookSlot(e.target.value)}
                    required
                  >
                    {bookingMentor.availabilitySlots.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="book-topic" className="field__label">Topic / Goal *</label>
                  <input
                    id="book-topic"
                    type="text"
                    className="input"
                    placeholder="e.g. Resume review, Docker architecture, Hackathon ideation"
                    value={bookTopic}
                    onChange={(e) => setBookTopic(e.target.value)}
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="book-notes" className="field__label">Notes / Questions for {bookingMentor.name}</label>
                  <textarea
                    id="book-notes"
                    rows={3}
                    className="textarea"
                    placeholder="Provide context so your mentor can prepare..."
                    value={bookNotes}
                    onChange={(e) => setBookNotes(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
                  <button type="button" className="btn btn--ghost" onClick={() => setBookingMentor(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn--primary" disabled={bookingSubmitting}>
                    {bookingSubmitting ? 'Booking…' : 'Confirm Booking'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* APPLY MENTOR MODAL */}
      {showApplyModal && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}>
          <div className="card" style={{ maxWidth: 500, width: '100%', padding: 24, background: '#ffffff', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ margin: 0, fontSize: 18 }}>Apply to be a Student Mentor</h3>

            {applySuccess ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#16a34a' }}>
                  ✓ Application submitted! An organizer will review and approve your mentor profile.
                </p>
                <button type="button" className="btn btn--primary" onClick={() => setShowApplyModal(false)}>
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyMentor} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="field">
                  <label htmlFor="apply-bio" className="field__label">Bio & Track Record *</label>
                  <textarea
                    id="apply-bio"
                    rows={3}
                    className="textarea"
                    placeholder="Tell juniors about your achievements, internship, or hackathon experience..."
                    value={applyBio}
                    onChange={(e) => setApplyBio(e.target.value)}
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="apply-skills" className="field__label">Technical Skills (comma separated) *</label>
                  <input
                    id="apply-skills"
                    type="text"
                    className="input"
                    placeholder="e.g. Go, Docker, React, Python, DSA"
                    value={applySkills}
                    onChange={(e) => setApplySkills(e.target.value)}
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="apply-areas" className="field__label">Mentorship Focus Areas (comma separated)</label>
                  <input
                    id="apply-areas"
                    type="text"
                    className="input"
                    placeholder="e.g. Resume Reviews, System Design, Hackathons"
                    value={applyAreas}
                    onChange={(e) => setApplyAreas(e.target.value)}
                  />
                </div>

                <div className="field">
                  <label htmlFor="apply-slots" className="field__label">Weekly Availability Slots (comma separated) *</label>
                  <input
                    id="apply-slots"
                    type="text"
                    className="input"
                    placeholder="e.g. Mon 5-6pm, Sat 11am-12pm"
                    value={applySlots}
                    onChange={(e) => setApplySlots(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
                  <button type="button" className="btn btn--ghost" onClick={() => setShowApplyModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn--primary" disabled={applySubmitting}>
                    {applySubmitting ? 'Submitting…' : 'Submit Application'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* REQUEST CODE REVIEW MODAL */}
      {showReviewModal && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}>
          <div className="card" style={{ maxWidth: 500, width: '100%', padding: 24, background: '#ffffff', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ margin: 0, fontSize: 18 }}>Request a Code Review</h3>

            <form onSubmit={handleRequestReview} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="field">
                <label htmlFor="rev-title" className="field__label">Review Title *</label>
                <input
                  id="rev-title"
                  type="text"
                  className="input"
                  placeholder="e.g. Review my custom WebSocket client in Go"
                  value={revTitle}
                  onChange={(e) => setRevTitle(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="rev-language" className="field__label">Primary Language *</label>
                <select
                  id="rev-language"
                  className="input"
                  value={revLanguage}
                  onChange={(e) => setRevLanguage(e.target.value)}
                >
                  <option value="TypeScript">TypeScript / JavaScript</option>
                  <option value="Python">Python</option>
                  <option value="Go">Go</option>
                  <option value="Java">Java</option>
                  <option value="C/C++">C / C++</option>
                  <option value="SQL">SQL</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="rev-github" className="field__label">GitHub Repo or PR Link</label>
                <input
                  id="rev-github"
                  type="url"
                  className="input"
                  placeholder="https://github.com/..."
                  value={revGithub}
                  onChange={(e) => setRevGithub(e.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="rev-snippet" className="field__label">Or Paste Code Snippet</label>
                <textarea
                  id="rev-snippet"
                  rows={4}
                  className="textarea"
                  placeholder="Paste your snippet here..."
                  value={revSnippet}
                  onChange={(e) => setRevSnippet(e.target.value)}
                  style={{ fontFamily: 'monospace', fontSize: 12 }}
                />
              </div>

              <div className="field">
                <label htmlFor="rev-notes" className="field__label">What specific feedback do you need? *</label>
                <textarea
                  id="rev-notes"
                  rows={2}
                  className="textarea"
                  placeholder="e.g. Memory efficiency, concurrency, edge cases..."
                  value={revNotes}
                  onChange={(e) => setRevNotes(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
                <button type="button" className="btn btn--ghost" onClick={() => setShowReviewModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary" disabled={revSubmitting}>
                  {revSubmitting ? 'Submitting…' : 'Submit Review Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
