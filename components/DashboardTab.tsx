'use client';

import { useState } from 'react';
import type { DashboardStats } from '@/lib/db/dashboard';
import type { Student } from '@/lib/types';
import type { UserCertificate } from '@/lib/db/events';
import type { Project } from '@/lib/types';

type Props = {
  stats: DashboardStats;
  student: Student;
  certificates: UserCertificate[];
  bookmarkedProjects: Project[];
  githubUsername: string | null;
  onSaveGitHub: (username: string) => Promise<void>;
};

const BADGE_CONFIG: Record<string, { icon: string; bg: string; desc: string }> = {
  'First Event': { icon: '🌱', bg: '#E0F2FE', desc: 'Registered or attended your first campus event' },
  'Hackathon Hero': { icon: '🚀', bg: '#FEE2E2', desc: 'Joined or created 3+ hackathon teams' },
  'Problem Solver': { icon: '💡', bg: '#FEF08A', desc: '5+ accepted forum answers helping peers' },
  'Builder': { icon: '🛠️', bg: '#E9D5FF', desc: 'Published 3+ student projects to the showcase' },
  'Mentor': { icon: '🎓', bg: '#DCFCE7', desc: 'Completed 5+ 1:1 mentorship or review sessions' },
  'Top 10 This Month': { icon: '🏆', bg: '#FFE14D', desc: 'Ranked in the top 10 on the campus leaderboard' },
};

export default function DashboardTab({
  stats,
  student,
  certificates,
  bookmarkedProjects,
  githubUsername,
  onSaveGitHub,
}: Props) {
  const [ghInput, setGhInput] = useState(githubUsername || '');
  const [savingGh, setSavingGh] = useState(false);
  const [ghMsg, setGhMsg] = useState<string | null>(null);

  const handleUpdateGitHub = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGh(true);
    setGhMsg(null);
    try {
      await onSaveGitHub(ghInput);
      setGhMsg('GitHub username saved!');
    } catch (err) {
      setGhMsg(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSavingGh(false);
    }
  };

  const handlePrintBragSheet = () => {
    window.print();
  };

  // Find max monthly activity for scaling SVG bars
  const maxActivity = Math.max(1, ...stats.monthlyActivity.map((m) => m.count));

  return (
    <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Action Bar for Brag Sheet */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          padding: 16,
          backgroundColor: '#fff',
          border: '2px solid #1a1a1a',
          borderRadius: 4,
          boxShadow: '3px 3px 0 #1a1a1a',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Developer Activity & Insights</h2>
          <p style={{ margin: '2px 0 0 0', fontSize: 13, color: '#555' }}>
            Live metrics from your campus events, projects, community contributions, and GitHub.
          </p>
        </div>
        <button
          onClick={handlePrintBragSheet}
          style={{
            padding: '10px 18px',
            backgroundColor: '#FFE066',
            color: '#1a1a1a',
            border: '2px solid #1a1a1a',
            borderRadius: 4,
            fontWeight: 800,
            fontSize: 14,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '2px 2px 0 #1a1a1a',
          }}
        >
          📄 Export Resume / Brag Sheet (Print PDF)
        </button>
      </div>

      {/* Primary Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14,
        }}
      >
        {/* Leaderboard Rank & Points */}
        <div
          style={{
            border: '2px solid #1a1a1a',
            borderRadius: 4,
            padding: 16,
            backgroundColor: '#FFE14D',
            color: '#1a1a1a',
            boxShadow: '3px 3px 0 #1a1a1a',
            position: 'relative',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase' }}>🏆 Leaderboard</div>
          <div style={{ fontSize: 32, fontWeight: 900, margin: '6px 0 2px 0' }}>
            {stats.leaderboardRank ? `#${stats.leaderboardRank}` : 'Unranked'}
          </div>
          <div style={{ fontSize: 12, fontWeight: 600 }}>
            {stats.leaderboardPoints ?? 0} pts earned ·{' '}
            <a href="/leaderboard" style={{ textDecoration: 'underline', color: 'inherit' }}>
              View Board →
            </a>
          </div>
        </div>

        {/* Streak Counter */}
        <div
          style={{
            border: '2px solid #1a1a1a',
            borderRadius: 4,
            padding: 16,
            backgroundColor: '#FF6B6B',
            color: '#fff',
            boxShadow: '3px 3px 0 #1a1a1a',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase' }}>🔥 Dev Streak</div>
          <div style={{ fontSize: 32, fontWeight: 900, margin: '6px 0 2px 0' }}>{stats.streakDays} Days</div>
          <div style={{ fontSize: 12, opacity: 0.9 }}>Consecutive activity streak</div>
        </div>

        {/* Projects Posted */}
        <div
          style={{
            border: '2px solid #1a1a1a',
            borderRadius: 4,
            padding: 16,
            backgroundColor: '#4EA8DE',
            color: '#fff',
            boxShadow: '3px 3px 0 #1a1a1a',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase' }}>💻 Projects Posted</div>
          <div style={{ fontSize: 32, fontWeight: 900, margin: '6px 0 2px 0' }}>{stats.projectsCount}</div>
          <div style={{ fontSize: 12, opacity: 0.9 }}>Shared in Project Showcase</div>
        </div>

        {/* Events Attended vs Registered */}
        <div
          style={{
            border: '2px solid #1a1a1a',
            borderRadius: 4,
            padding: 16,
            backgroundColor: '#70C1B3',
            color: '#1a1a1a',
            boxShadow: '3px 3px 0 #1a1a1a',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase' }}>🎟️ Events Attended</div>
          <div style={{ fontSize: 32, fontWeight: 900, margin: '6px 0 2px 0' }}>
            {stats.eventsAttendedCount}
            <span style={{ fontSize: 18, fontWeight: 600, opacity: 0.8 }}> / {stats.eventsRegisteredCount}</span>
          </div>
          <div style={{ fontSize: 12 }}>Attended vs Registered</div>
        </div>

        {/* Certificates Earned */}
        <div
          style={{
            border: '2px solid #1a1a1a',
            borderRadius: 4,
            padding: 16,
            backgroundColor: '#FFE066',
            color: '#1a1a1a',
            boxShadow: '3px 3px 0 #1a1a1a',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase' }}>🎓 Certificates</div>
          <div style={{ fontSize: 32, fontWeight: 900, margin: '6px 0 2px 0' }}>{stats.certificatesCount}</div>
          <div style={{ fontSize: 12 }}>Verified event completions</div>
        </div>

        {/* Forum Answers Accepted */}
        <div
          style={{
            border: '2px solid #1a1a1a',
            borderRadius: 4,
            padding: 16,
            backgroundColor: '#9B5DE5',
            color: '#fff',
            boxShadow: '3px 3px 0 #1a1a1a',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase' }}>💡 Accepted Answers</div>
          <div style={{ fontSize: 32, fontWeight: 900, margin: '6px 0 2px 0' }}>{stats.acceptedAnswersCount}</div>
          <div style={{ fontSize: 12, opacity: 0.9 }}>Helpful solutions verified</div>
        </div>

        {/* Mentorship Completed */}
        <div
          style={{
            border: '2px solid #1a1a1a',
            borderRadius: 4,
            padding: 16,
            backgroundColor: '#F3C68F',
            color: '#1a1a1a',
            boxShadow: '3px 3px 0 #1a1a1a',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase' }}>🤝 Mentorships</div>
          <div style={{ fontSize: 32, fontWeight: 900, margin: '6px 0 2px 0' }}>{stats.completedMentorshipCount}</div>
          <div style={{ fontSize: 12 }}>1:1 sessions completed</div>
        </div>
      </div>

      {/* Badges Earned Section */}
      <div
        style={{
          border: '2px solid #1a1a1a',
          borderRadius: 4,
          padding: 20,
          backgroundColor: '#fff',
          boxShadow: '3px 3px 0 #1a1a1a',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>🎖️ Activity Badges Earned</h3>
            <p style={{ margin: '2px 0 0 0', fontSize: 13, color: '#555' }}>
              Badges unlocked automatically from your verified campus activity.
            </p>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: 4, border: '1px solid #1a1a1a' }}>
            {stats.badges?.length || 0} Unlocked
          </span>
        </div>

        {stats.badges && stats.badges.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {stats.badges.map((badgeName) => {
              const info = BADGE_CONFIG[badgeName] || { icon: '⭐', bg: '#fef08a', desc: 'Active contributor' };
              return (
                <div
                  key={badgeName}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    borderRadius: 4,
                    border: '2px solid #1a1a1a',
                    backgroundColor: info.bg,
                    boxShadow: '2px 2px 0 #1a1a1a',
                  }}
                >
                  <span style={{ fontSize: 22 }}>{info.icon}</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{badgeName}</div>
                    <div style={{ fontSize: 11, color: '#333', lineHeight: 1.3 }}>{info.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              padding: 16,
              backgroundColor: '#fafafa',
              border: '1px dashed #bbb',
              borderRadius: 4,
              fontSize: 13,
              color: '#666',
              textAlign: 'center',
            }}
          >
            No badges unlocked yet. Register for an event, publish a project, or answer questions in the forum to earn your first badge!
          </div>
        )}
      </div>

      {/* Monthly Activity SVG Chart */}
      <div
        style={{
          border: '2px solid #1a1a1a',
          borderRadius: 4,
          padding: 20,
          backgroundColor: '#fff',
          boxShadow: '3px 3px 0 #1a1a1a',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>📊 Monthly Activity Breakdown (Last 6 Months)</h3>
          <span style={{ fontSize: 12, color: '#666', fontWeight: 600 }}>Pure SVG / CSS Native Chart</span>
        </div>

        <div style={{ width: '100%', overflowX: 'auto' }}>
          <svg
            viewBox="0 0 600 200"
            style={{ width: '100%', height: 'auto', maxHeight: 220, display: 'block' }}
            aria-label="Monthly activity bar chart"
          >
            {/* Grid lines */}
            <line x1="40" y1="30" x2="580" y2="30" stroke="#e0e0e0" strokeDasharray="4" />
            <line x1="40" y1="85" x2="580" y2="85" stroke="#e0e0e0" strokeDasharray="4" />
            <line x1="40" y1="140" x2="580" y2="140" stroke="#e0e0e0" strokeDasharray="4" />
            <line x1="40" y1="165" x2="580" y2="165" stroke="#1a1a1a" strokeWidth="2" />

            {/* Bars */}
            {stats.monthlyActivity.map((item, index) => {
              const barWidth = 44;
              const xPos = 70 + index * 85;
              const barHeight = Math.max(8, (item.count / maxActivity) * 125);
              const yPos = 165 - barHeight;

              const colors = ['#4EA8DE', '#70C1B3', '#FFE066', '#FF6B6B', '#9B5DE5', '#06D6A0'];
              const fillColor = colors[index % colors.length];

              return (
                <g key={item.month}>
                  {/* The Bar */}
                  <rect
                    x={xPos}
                    y={yPos}
                    width={barWidth}
                    height={barHeight}
                    fill={fillColor}
                    stroke="#1a1a1a"
                    strokeWidth="2"
                    rx="2"
                  />
                  {/* Count Label */}
                  <text
                    x={xPos + barWidth / 2}
                    y={yPos - 6}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="800"
                    fill="#1a1a1a"
                  >
                    {item.count}
                  </text>
                  {/* Month Label */}
                  <text
                    x={xPos + barWidth / 2}
                    y="185"
                    textAnchor="middle"
                    fontSize="13"
                    fontWeight="700"
                    fill="#1a1a1a"
                  >
                    {item.month}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* GitHub Integration Section */}
      <div
        style={{
          border: '2px solid #1a1a1a',
          borderRadius: 4,
          padding: 20,
          backgroundColor: '#fff',
          boxShadow: '3px 3px 0 #1a1a1a',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>🐙 GitHub Activity & Insights</h3>
          {stats.githubData?.username && (
            <a
              href={`https://github.com/${stats.githubData.username}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 13, fontWeight: 700, textDecoration: 'underline' }}
            >
              @{stats.githubData.username} on GitHub ↗
            </a>
          )}
        </div>

        {stats.githubData ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {stats.githubData.error ? (
              <p style={{ margin: 0, color: '#d32f2f', fontSize: 13 }}>{stats.githubData.error}</p>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: 12,
                }}
              >
                <div style={{ border: '1.5px solid #1a1a1a', borderRadius: 4, padding: 12, background: '#f9f9f9' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#666' }}>PUBLIC REPOS</div>
                  <div style={{ fontSize: 24, fontWeight: 800 }}>{stats.githubData.publicRepos}</div>
                </div>
                <div style={{ border: '1.5px solid #1a1a1a', borderRadius: 4, padding: 12, background: '#f9f9f9' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#666' }}>FOLLOWERS</div>
                  <div style={{ fontSize: 24, fontWeight: 800 }}>{stats.githubData.followers}</div>
                </div>
                <div style={{ border: '1.5px solid #1a1a1a', borderRadius: 4, padding: 12, background: '#f9f9f9' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#666' }}>RECENT COMMITS</div>
                  <div style={{ fontSize: 24, fontWeight: 800 }}>{stats.githubData.recentCommits}</div>
                </div>
                <div style={{ border: '1.5px solid #1a1a1a', borderRadius: 4, padding: 12, background: '#f9f9f9' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#666' }}>PUBLIC EVENTS</div>
                  <div style={{ fontSize: 24, fontWeight: 800 }}>{stats.githubData.recentEventsCount}</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: 14, color: '#555' }}>
            No GitHub username linked yet. Connect your GitHub profile below to automatically pull repository stats and public contribution insights!
          </p>
        )}

        {/* Update GitHub input */}
        <form onSubmit={handleUpdateGitHub} style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Your GitHub username (e.g. torvalds)"
            value={ghInput}
            onChange={(e) => setGhInput(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '2px solid #1a1a1a',
              borderRadius: 4,
              fontSize: 13,
              width: 260,
            }}
          />
          <button
            type="submit"
            disabled={savingGh}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1a1a1a',
              color: '#fff',
              border: '2px solid #1a1a1a',
              borderRadius: 4,
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {savingGh ? 'Saving...' : 'Link GitHub'}
          </button>
          {ghMsg && <span style={{ fontSize: 12, fontWeight: 600, color: '#2e7d32' }}>{ghMsg}</span>}
        </form>
      </div>

      {/* Skills Radar / Tags Cloud */}
      <div
        style={{
          border: '2px solid #1a1a1a',
          borderRadius: 4,
          padding: 20,
          backgroundColor: '#fff',
          boxShadow: '3px 3px 0 #1a1a1a',
        }}
      >
        <h3 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 800 }}>🏷️ Skills Cloud & Technical Strengths</h3>
        {student.skills.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {student.skills.map((skill, index) => {
              const bgColors = ['#FFE066', '#4EA8DE', '#70C1B3', '#FF6B6B', '#9B5DE5', '#B8E994'];
              const bg = bgColors[index % bgColors.length];
              return (
                <span
                  key={skill}
                  style={{
                    padding: '6px 14px',
                    backgroundColor: bg,
                    border: '2px solid #1a1a1a',
                    borderRadius: 4,
                    fontWeight: 700,
                    fontSize: 13,
                    boxShadow: '1.5px 1.5px 0 #1a1a1a',
                  }}
                >
                  {skill}
                </span>
              );
            })}
          </div>
        ) : (
          <p style={{ margin: 0, color: '#666', fontSize: 13 }}>
            No skills added yet. Use the Edit Profile form on the Overview tab to add your languages and frameworks!
          </p>
        )}
      </div>

      {/* Printable Brag Sheet / Resume Layout (Displayed when printing) */}
      <div
        className="print-only-brag-sheet"
        style={{
          display: 'none',
        }}
      >
        <div style={{ padding: 24, fontFamily: 'sans-serif', color: '#1a1a1a' }}>
          <header style={{ borderBottom: '2px solid #1a1a1a', paddingBottom: 16, marginBottom: 20 }}>
            <h1 style={{ margin: '0 0 4px 0', fontSize: 26, fontWeight: 800 }}>{student.name}</h1>
            <p style={{ margin: '0 0 8px 0', fontSize: 14, color: '#444' }}>
              {student.branch} · {student.year} · ADYPU UGSOT · @{student.handle}
            </p>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.4 }}>{student.bio}</p>
          </header>

          <section style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, borderBottom: '1px solid #ccc', paddingBottom: 4 }}>
              TECHNICAL SKILLS
            </h2>
            <p style={{ fontSize: 13, marginTop: 6 }}>{student.skills.join(' • ')}</p>
          </section>

          <section style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, borderBottom: '1px solid #ccc', paddingBottom: 4 }}>
              CAMPUS & DEVELOPER STATS
            </h2>
            <ul style={{ fontSize: 13, lineHeight: 1.6, paddingLeft: 20, marginTop: 6 }}>
              <li>
                <strong>Projects Showcase:</strong> {stats.projectsCount} technical projects posted
              </li>
              <li>
                <strong>Event Attendance:</strong> {stats.eventsAttendedCount} events attended (out of {stats.eventsRegisteredCount} registered)
              </li>
              <li>
                <strong>Official Certificates:</strong> {stats.certificatesCount} verified certificates earned
              </li>
              <li>
                <strong>Peer Mentorship & Solutions:</strong> {stats.acceptedAnswersCount} accepted answers, {stats.completedMentorshipCount} mentorship sessions
              </li>
              {stats.githubData?.username && (
                <li>
                  <strong>GitHub ({stats.githubData.username}):</strong> {stats.githubData.publicRepos} public repos, {stats.githubData.recentCommits} recent commits
                </li>
              )}
            </ul>
          </section>

          {certificates.length > 0 && (
            <section style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, borderBottom: '1px solid #ccc', paddingBottom: 4 }}>
                VERIFIED EVENT CERTIFICATES
              </h2>
              <ul style={{ fontSize: 13, lineHeight: 1.6, paddingLeft: 20, marginTop: 6 }}>
                {certificates.map((c) => (
                  <li key={c.id}>
                    <strong>{c.eventTitle}</strong> — Issued {new Date(c.issuedAt).toLocaleDateString()} (ID: {c.id})
                  </li>
                ))}
              </ul>
            </section>
          )}

          {bookmarkedProjects.length > 0 && (
            <section>
              <h2 style={{ fontSize: 16, fontWeight: 800, borderBottom: '1px solid #ccc', paddingBottom: 4 }}>
                FEATURED COLLABORATIONS & PROJECTS
              </h2>
              <ul style={{ fontSize: 13, lineHeight: 1.6, paddingLeft: 20, marginTop: 6 }}>
                {bookmarkedProjects.map((p) => (
                  <li key={p.id}>
                    <strong>{p.title}</strong>: {p.shortDescription}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {/* Global Print Style for clean PDF output */}
      <style jsx global>{`
        @media print {
          nav, header, footer, .no-print, .profile-card, .profile-page__heading, .back-link {
            display: none !important;
          }
          .dashboard-container {
            display: block !important;
          }
          .print-only-brag-sheet {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
