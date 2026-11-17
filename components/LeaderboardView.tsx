'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import type {
  LeaderboardEntry,
  LeaderboardTimeFilter,
  LeaderboardCategoryFilter,
  UserLeaderboardPosition,
} from '@/lib/types';
import type { PointRuleItem } from '@/lib/db/leaderboard';

type Props = {
  initialEntries: LeaderboardEntry[];
  initialUserPosition: UserLeaderboardPosition | null;
  currentUserId: string | null;
  isOrganizer: boolean;
  pointRules: PointRuleItem[];
};

const TIME_FILTERS: { id: LeaderboardTimeFilter; label: string }[] = [
  { id: 'all', label: 'All time' },
  { id: 'month', label: 'This month' },
  { id: 'week', label: 'This week' },
];

const CATEGORY_FILTERS: { id: LeaderboardCategoryFilter; label: string; icon: string }[] = [
  { id: 'overall', label: 'Overall', icon: '🏆' },
  { id: 'events', label: 'Events', icon: '🎟️' },
  { id: 'projects', label: 'Projects', icon: '💻' },
  { id: 'forum', label: 'Forum', icon: '💬' },
  { id: 'mentorship', label: 'Mentorship', icon: '🤝' },
];

const BADGE_CONFIG: Record<string, { icon: string; bg: string }> = {
  'First Event': { icon: '🌱', bg: '#E0F2FE' },
  'Hackathon Hero': { icon: '🚀', bg: '#FEE2E2' },
  'Problem Solver': { icon: '💡', bg: '#FEF08A' },
  'Builder': { icon: '🛠️', bg: '#E9D5FF' },
  'Mentor': { icon: '🎓', bg: '#DCFCE7' },
  'Top 10 This Month': { icon: '🏆', bg: '#FFE14D' },
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function LeaderboardView({
  initialEntries,
  initialUserPosition,
  currentUserId,
  isOrganizer,
  pointRules,
}: Props) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(initialEntries);
  const [userPosition, setUserPosition] = useState<UserLeaderboardPosition | null>(initialUserPosition);
  const [timeFilter, setTimeFilter] = useState<LeaderboardTimeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<LeaderboardCategoryFilter>('overall');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [moderatingId, setModeratingId] = useState<string | null>(null);

  // Fetch updated data from API when filters change
  const refreshLeaderboard = (
    newTime: LeaderboardTimeFilter,
    newCat: LeaderboardCategoryFilter,
    search: string
  ) => {
    setLoading(true);
    setError(null);
    startTransition(async () => {
      try {
        const params = new URLSearchParams({
          time: newTime,
          category: newCat,
          search: search.trim(),
          limit: '50',
          offset: '0',
        });
        const res = await fetch(`/api/leaderboard?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to load leaderboard data.');
        const data = await res.json();
        setEntries(data.entries || []);
        if (data.userPosition !== undefined) {
          setUserPosition(data.userPosition);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not fetch leaderboard.');
      } finally {
        setLoading(false);
      }
    });
  };

  const handleTimeChange = (t: LeaderboardTimeFilter) => {
    setTimeFilter(t);
    refreshLeaderboard(t, categoryFilter, searchQuery);
  };

  const handleCategoryChange = (c: LeaderboardCategoryFilter) => {
    setCategoryFilter(c);
    refreshLeaderboard(timeFilter, c, searchQuery);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    refreshLeaderboard(timeFilter, categoryFilter, val);
  };

  // Moderate visibility (Step 6)
  const handleToggleHide = async (userId: string, currentHidden: boolean) => {
    if (!isOrganizer) return;
    const confirmMsg = currentHidden
      ? 'Restore this user to the campus leaderboard?'
      : 'Hide this user from all leaderboard rankings?';
    if (!window.confirm(confirmMsg)) return;

    setModeratingId(userId);
    try {
      const res = await fetch('/api/leaderboard/hide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isHidden: !currentHidden }),
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to moderate user');
      }
      // Optimistically remove
      setEntries((prev) => prev.filter((item) => item.userId !== userId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Moderation action failed');
    } finally {
      setModeratingId(null);
    }
  };

  // Filter local entries by search if not already handled
  const filteredEntries = entries.filter((e) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.name.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      (e.courseYear && e.courseYear.toLowerCase().includes(q))
    );
  });

  // Top 3 for Podium
  const top1 = filteredEntries[0] || null;
  const top2 = filteredEntries[1] || null;
  const top3 = filteredEntries[2] || null;

  // The rest for the list
  const listEntries = filteredEntries.slice(3);

  // Group point rules by category
  const eventRules = pointRules.filter((r) => r.category === 'events');
  const projectRules = pointRules.filter((r) => r.category === 'projects');
  const forumRules = pointRules.filter((r) => r.category === 'forum');
  const mentorRules = pointRules.filter((r) => r.category === 'mentorship');

  return (
    <div className="leaderboard-view" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Sticky "Your Rank" Bar / Card for Signed-in Users */}
      <div
        className="your-rank-card"
        style={{
          border: '2px solid #111',
          borderRadius: 4,
          backgroundColor: '#FFFFFF',
          padding: '14px 20px',
          boxShadow: '4px 4px 0 #111',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          position: 'sticky',
          top: 76,
          zIndex: 30,
        }}
      >
        {currentUserId && userPosition ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 4,
                  backgroundColor: '#FFE14D',
                  border: '2px solid #111',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: 18,
                }}
              >
                #{userPosition.rank}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>Your Campus Standing</div>
                <div style={{ fontSize: 13, color: '#444' }}>
                  {userPosition.score} pts in this view ({userPosition.totalPoints} total all-time)
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              {userPosition.rank > 1 ? (
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    backgroundColor: '#FEF3C7',
                    padding: '6px 12px',
                    borderRadius: 4,
                    border: '1.5px solid #111',
                  }}
                >
                  ⚡ {userPosition.pointsToNextRank} more pts needed to reach rank #{userPosition.rank - 1}
                </div>
              ) : (
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    backgroundColor: '#FFE14D',
                    padding: '6px 12px',
                    borderRadius: 4,
                    border: '1.5px solid #111',
                  }}
                >
                  👑 You are currently #1 on campus! Keep up the momentum!
                </div>
              )}
              <Link
                href="/profile"
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  textDecoration: 'underline',
                  color: '#2B50FF',
                }}
              >
                View Dashboard →
              </Link>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>
              💡 Sign in to view your real-time campus rank, track activity points, and unlock badges.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link
                href="/auth/sign-in"
                style={{
                  padding: '6px 14px',
                  backgroundColor: '#2B50FF',
                  color: '#fff',
                  border: '2px solid #111',
                  borderRadius: 4,
                  fontWeight: 800,
                  fontSize: 13,
                  textDecoration: 'none',
                }}
              >
                Sign in
              </Link>
              <Link
                href="/auth/register"
                style={{
                  padding: '6px 14px',
                  backgroundColor: '#fff',
                  color: '#111',
                  border: '2px solid #111',
                  borderRadius: 4,
                  fontWeight: 800,
                  fontSize: 13,
                  textDecoration: 'none',
                }}
              >
                Register
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Control Bar: Filters & Search */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          padding: 16,
          backgroundColor: '#FFFFFF',
          border: '2px solid #111',
          borderRadius: 4,
          boxShadow: '3px 3px 0 #111',
        }}
      >
        {/* Category Filter Tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {CATEGORY_FILTERS.map((cat) => {
            const active = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                style={{
                  padding: '8px 14px',
                  backgroundColor: active ? '#2B50FF' : '#FFFFFF',
                  color: active ? '#FFFFFF' : '#111111',
                  border: '2px solid #111',
                  borderRadius: 4,
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'background 0.15s ease',
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Time Filters & Search Row */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            borderTop: '1px solid #E5E7EB',
            paddingTop: 12,
          }}
        >
          {/* Time range buttons */}
          <div style={{ display: 'flex', gap: 6 }}>
            {TIME_FILTERS.map((t) => {
              const active = timeFilter === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTimeChange(t.id)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: active ? '#111' : '#F6F1E7',
                    color: active ? '#FFF' : '#111',
                    border: '1.5px solid #111',
                    borderRadius: 4,
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Search by Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 240px', maxWidth: 360 }}>
            <input
              type="text"
              placeholder="Search by student or course..."
              value={searchQuery}
              onChange={handleSearchChange}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '2px solid #111',
                borderRadius: 4,
                fontSize: 13,
                fontFamily: 'inherit',
                backgroundColor: '#FFFFFF',
              }}
            />
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      {(loading || isPending) && (
        <div
          style={{
            padding: 12,
            backgroundColor: '#FEF3C7',
            border: '2px solid #111',
            borderRadius: 4,
            fontWeight: 700,
            fontSize: 13,
            textAlign: 'center',
          }}
        >
          Updating leaderboard...
        </div>
      )}

      {error && (
        <div
          style={{
            padding: 14,
            backgroundColor: '#FEE2E2',
            border: '2px solid #111',
            borderRadius: 4,
            fontWeight: 700,
            fontSize: 14,
            color: '#991B1B',
          }}
        >
          {error}
        </div>
      )}

      {/* TOP 3 PODIUM (Bold Pop Style) */}
      {filteredEntries.length > 0 ? (
        <div
          className="podium-container"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            alignItems: 'flex-end',
            padding: '24px 16px 16px 16px',
            backgroundColor: '#FFFFFF',
            border: '2px solid #111',
            borderRadius: 4,
            boxShadow: '4px 4px 0 #111',
          }}
        >
          {/* Rank 2 (Silver) */}
          <div
            className="podium-col podium-rank-2"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              order: 1,
            }}
          >
            {top2 ? (
              <div style={{ width: '100%', textAlign: 'center' }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    backgroundColor: '#E2E8F0',
                    border: '2px solid #111',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: 20,
                    margin: '0 auto 8px auto',
                    boxShadow: '2px 2px 0 #111',
                  }}
                >
                  {getInitials(top2.name)}
                </div>
                <div style={{ fontWeight: 800, fontSize: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {top2.name}
                </div>
                <div style={{ fontSize: 12, color: '#555' }}>{top2.courseYear || 'Student'}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#111', margin: '4px 0' }}>
                  {top2.score} pts
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap', margin: '4px 0 10px 0' }}>
                  {top2.badges.slice(0, 2).map((b) => (
                    <span
                      key={b}
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 3,
                        border: '1px solid #111',
                        backgroundColor: BADGE_CONFIG[b]?.bg || '#fef08a',
                      }}
                    >
                      {BADGE_CONFIG[b]?.icon} {b}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ padding: 20, color: '#888', fontSize: 13 }}>Spot #2 Open</div>
            )}
            <div
              style={{
                width: '100%',
                height: 120,
                backgroundColor: '#E2E8F0',
                border: '2px solid #111',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                fontWeight: 900,
                fontSize: 28,
              }}
            >
              🥈 #2
              <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.8 }}>SILVER</span>
            </div>
          </div>

          {/* Rank 1 (Gold - Tallest) */}
          <div
            className="podium-col podium-rank-1"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              order: 2,
            }}
          >
            {top1 ? (
              <div style={{ width: '100%', textAlign: 'center' }}>
                <div
                  style={{
                    width: 68,
                    height: 68,
                    borderRadius: '50%',
                    backgroundColor: '#FFE14D',
                    border: '2px solid #111',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: 24,
                    margin: '0 auto 8px auto',
                    boxShadow: '3px 3px 0 #111',
                    position: 'relative',
                  }}
                >
                  <span style={{ position: 'absolute', top: -14, fontSize: 20 }}>👑</span>
                  {getInitials(top1.name)}
                </div>
                <div style={{ fontWeight: 900, fontSize: 18, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {top1.name}
                </div>
                <div style={{ fontSize: 12, color: '#555' }}>{top1.courseYear || 'Campus Leader'}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#2B50FF', margin: '4px 0' }}>
                  {top1.score} pts
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap', margin: '4px 0 12px 0' }}>
                  {top1.badges.slice(0, 3).map((b) => (
                    <span
                      key={b}
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 3,
                        border: '1px solid #111',
                        backgroundColor: BADGE_CONFIG[b]?.bg || '#fef08a',
                      }}
                    >
                      {BADGE_CONFIG[b]?.icon} {b}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ padding: 20, color: '#888', fontSize: 13 }}>Spot #1 Open</div>
            )}
            <div
              style={{
                width: '100%',
                height: 160,
                backgroundColor: '#FFE14D',
                border: '2px solid #111',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                fontWeight: 900,
                fontSize: 32,
              }}
            >
              🥇 #1
              <span style={{ fontSize: 12, fontWeight: 800, opacity: 0.9 }}>CAMPUS CHAMPION</span>
            </div>
          </div>

          {/* Rank 3 (Bronze) */}
          <div
            className="podium-col podium-rank-3"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              order: 3,
            }}
          >
            {top3 ? (
              <div style={{ width: '100%', textAlign: 'center' }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    backgroundColor: '#FFB088',
                    border: '2px solid #111',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: 18,
                    margin: '0 auto 8px auto',
                    boxShadow: '2px 2px 0 #111',
                  }}
                >
                  {getInitials(top3.name)}
                </div>
                <div style={{ fontWeight: 800, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {top3.name}
                </div>
                <div style={{ fontSize: 12, color: '#555' }}>{top3.courseYear || 'Student'}</div>
                <div style={{ fontSize: 17, fontWeight: 900, color: '#111', margin: '4px 0' }}>
                  {top3.score} pts
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap', margin: '4px 0 10px 0' }}>
                  {top3.badges.slice(0, 2).map((b) => (
                    <span
                      key={b}
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 3,
                        border: '1px solid #111',
                        backgroundColor: BADGE_CONFIG[b]?.bg || '#fef08a',
                      }}
                    >
                      {BADGE_CONFIG[b]?.icon} {b}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ padding: 20, color: '#888', fontSize: 13 }}>Spot #3 Open</div>
            )}
            <div
              style={{
                width: '100%',
                height: 96,
                backgroundColor: '#FFB088',
                border: '2px solid #111',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                fontWeight: 900,
                fontSize: 24,
              }}
            >
              🥉 #3
              <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.8 }}>BRONZE</span>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: 40,
            textAlign: 'center',
            backgroundColor: '#FFFFFF',
            border: '2px solid #111',
            borderRadius: 4,
            boxShadow: '3px 3px 0 #111',
          }}
        >
          <div style={{ fontSize: 44, marginBottom: 8 }}>🏅</div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>No points recorded yet</h3>
          <p style={{ margin: '6px 0 16px 0', fontSize: 14, color: '#555', maxWidth: 460, marginLeft: 'auto', marginRight: 'auto' }}>
            Be the first to register for an event, upload a project, or answer questions on the forum to claim the #1 spot on campus!
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            <Link
              href="/events"
              style={{
                padding: '8px 16px',
                backgroundColor: '#2B50FF',
                color: '#fff',
                border: '2px solid #111',
                borderRadius: 4,
                fontWeight: 800,
                fontSize: 13,
                textDecoration: 'none',
              }}
            >
              Browse Events →
            </Link>
            <Link
              href="/projects"
              style={{
                padding: '8px 16px',
                backgroundColor: '#fff',
                color: '#111',
                border: '2px solid #111',
                borderRadius: 4,
                fontWeight: 800,
                fontSize: 13,
                textDecoration: 'none',
              }}
            >
              Post a Project →
            </Link>
          </div>
        </div>
      )}

      {/* RANKED TABLE / CARDS (Ranks 4+) */}
      {listEntries.length > 0 && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '2px solid #111',
            borderRadius: 4,
            boxShadow: '3px 3px 0 #111',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '2px solid #111',
              backgroundColor: '#F6F1E7',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Contenders (Ranks 4+)</h3>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#555' }}>
              Showing {listEntries.length} student{listEntries.length === 1 ? '' : 's'}
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 620 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #111', backgroundColor: '#FAF8F5', fontSize: 12, fontWeight: 800 }}>
                  <th style={{ padding: '12px 16px', width: 60 }}>Rank</th>
                  <th style={{ padding: '12px 16px' }}>Student</th>
                  <th style={{ padding: '12px 16px' }}>Badges</th>
                  <th style={{ padding: '12px 16px' }}>Breakdown</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Points</th>
                  {isOrganizer && <th style={{ padding: '12px 16px', textAlign: 'center', width: 90 }}>Mod</th>}
                </tr>
              </thead>
              <tbody>
                {listEntries.map((entry) => {
                  const isCurrent = entry.userId === currentUserId;
                  return (
                    <tr
                      key={entry.userId}
                      style={{
                        borderBottom: '1px solid #E5E7EB',
                        backgroundColor: isCurrent ? '#FEF3C7' : '#FFFFFF',
                        transition: 'background 0.1s ease',
                      }}
                    >
                      {/* Rank */}
                      <td style={{ padding: '14px 16px', fontWeight: 900, fontSize: 15 }}>
                        #{entry.rank}
                      </td>

                      {/* Student info */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: '50%',
                              backgroundColor: '#E5E7EB',
                              border: '1.5px solid #111',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: 12,
                              flexShrink: 0,
                            }}
                          >
                            {getInitials(entry.name)}
                          </div>
                          <div>
                            <Link
                              href="/students"
                              style={{
                                fontWeight: 800,
                                fontSize: 14,
                                color: '#111',
                                textDecoration: 'none',
                              }}
                            >
                              {entry.name} {isCurrent && <span style={{ fontSize: 11, color: '#2B50FF' }}>(You)</span>}
                            </Link>
                            <div style={{ fontSize: 11, color: '#666' }}>{entry.courseYear || 'Student'}</div>
                          </div>
                        </div>
                      </td>

                      {/* Badges */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {entry.badges.length > 0 ? (
                            entry.badges.map((b) => (
                              <span
                                key={b}
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: '2px 6px',
                                  borderRadius: 3,
                                  border: '1px solid #111',
                                  backgroundColor: BADGE_CONFIG[b]?.bg || '#fef08a',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {BADGE_CONFIG[b]?.icon} {b}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: 11, color: '#999' }}>—</span>
                          )}
                        </div>
                      </td>

                      {/* Points Breakdown */}
                      <td style={{ padding: '14px 16px', fontSize: 12 }}>
                        <span style={{ color: '#555' }}>
                          🎟️ {entry.eventsPoints} · 💻 {entry.projectsPoints} · 💬 {entry.forumPoints} · 🤝 {entry.mentorshipPoints}
                        </span>
                      </td>

                      {/* Score */}
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 900, fontSize: 16 }}>
                        {entry.score}
                      </td>

                      {/* Organizer Moderation */}
                      {isOrganizer && (
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleHide(entry.userId, false)}
                            disabled={moderatingId === entry.userId}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#FEE2E2',
                              color: '#991B1B',
                              border: '1px solid #991B1B',
                              borderRadius: 3,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Hide
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* HOW POINTS WORK SECTION */}
      <div
        style={{
          border: '2px solid #111',
          borderRadius: 4,
          backgroundColor: '#FFFFFF',
          padding: 20,
          boxShadow: '3px 3px 0 #111',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
          }}
          onClick={() => setShowRules((prev) => !prev)}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>⚡ How Points & Badges Work</h3>
            <p style={{ margin: '2px 0 0 0', fontSize: 13, color: '#555' }}>
              Points are calculated securely in the database from authentic campus activities. Anti-farming rules apply.
            </p>
          </div>
          <button
            type="button"
            style={{
              padding: '6px 12px',
              backgroundColor: '#F6F1E7',
              border: '1.5px solid #111',
              borderRadius: 4,
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            {showRules ? 'Collapse ▲' : 'Learn more ▼'}
          </button>
        </div>

        {showRules && (
          <div style={{ marginTop: 16, borderTop: '1px solid #E5E7EB', paddingTop: 16 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 16,
              }}
            >
              {/* Events Rules */}
              <div style={{ padding: 12, backgroundColor: '#FAF8F5', border: '1px solid #DDD', borderRadius: 4 }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 800 }}>🎟️ Events & Hackathons</h4>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>
                  {eventRules.map((r) => (
                    <li key={r.actionKey}>
                      {r.description}: <strong>+{r.points} pts</strong>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Projects Rules */}
              <div style={{ padding: 12, backgroundColor: '#FAF8F5', border: '1px solid #DDD', borderRadius: 4 }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 800 }}>💻 Project Showcase</h4>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>
                  {projectRules.map((r) => (
                    <li key={r.actionKey}>
                      {r.description}: <strong>+{r.points} pts</strong>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Forum Rules */}
              <div style={{ padding: 12, backgroundColor: '#FAF8F5', border: '1px solid #DDD', borderRadius: 4 }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 800 }}>💬 Developer Forum</h4>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>
                  {forumRules.map((r) => (
                    <li key={r.actionKey}>
                      {r.description}: <strong>+{r.points} pts</strong>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mentorship Rules */}
              <div style={{ padding: 12, backgroundColor: '#FAF8F5', border: '1px solid #DDD', borderRadius: 4 }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 800 }}>🤝 Mentorship & Reviews</h4>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>
                  {mentorRules.map((r) => (
                    <li key={r.actionKey}>
                      {r.description}: <strong>+{r.points} pts</strong>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div
              style={{
                marginTop: 14,
                padding: '10px 14px',
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: 4,
                fontSize: 12,
                color: '#1E3A8A',
              }}
            >
              🔒 <strong>Fairness & Anti-Farming:</strong> Points are computed directly by PostgreSQL stored procedures. Self-likes, self-upvotes, and self-accepted answers are strictly ignored. Rank ties are resolved fairly by whoever reached the activity milestone first.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
