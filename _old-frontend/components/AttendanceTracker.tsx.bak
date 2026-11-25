'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { CampusEvent } from '@/lib/types';
import type { EventAttendanceRecord } from '@/lib/db/events';
import { formatShort } from '@/lib/dates';

type Props = {
  event: CampusEvent;
  initialRecords: EventAttendanceRecord[];
};

export default function AttendanceTracker({ event, initialRecords }: Props) {
  const [records, setRecords] = useState<EventAttendanceRecord[]>(initialRecords);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'absent'>('all');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // Live counters
  const totalCount = records.length;
  const presentCount = records.filter((r) => r.status === 'present').length;
  const absentCount = totalCount - presentCount;
  const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  // Filtered view
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const matchesFilter =
        statusFilter === 'all' ? true : record.status === statusFilter;
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        record.name.toLowerCase().includes(query) ||
        record.email.toLowerCase().includes(query) ||
        (record.courseYear && record.courseYear.toLowerCase().includes(query));

      return matchesFilter && matchesSearch;
    });
  }, [records, statusFilter, search]);

  async function handleToggleStatus(userId: string, newStatus: 'present' | 'absent') {
    const currentRecord = records.find((r) => r.userId === userId);
    if (!currentRecord || currentRecord.status === newStatus || updatingUserId) return;

    const previousStatus = currentRecord.status;
    const previousUpdatedAt = currentRecord.updatedAt;

    // Optimistic UI update
    setRecords((prev) =>
      prev.map((r) =>
        r.userId === userId
          ? { ...r, status: newStatus, updatedAt: new Date().toISOString() }
          : r,
      ),
    );
    setUpdatingUserId(userId);
    setFeedback(null);

    try {
      const response = await fetch(`/api/events/${event.id}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status: newStatus }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errorData?.error || 'Failed to update attendance status.');
      }

      setFeedback({
        type: 'success',
        message: `Marked ${currentRecord.name} as ${newStatus}.`,
      });
      // Clear success feedback after 3 seconds
      setTimeout(() => setFeedback((f) => (f?.type === 'success' ? null : f)), 3000);
    } catch (err) {
      // Revert optimistic update
      setRecords((prev) =>
        prev.map((r) =>
          r.userId === userId
            ? { ...r, status: previousStatus, updatedAt: previousUpdatedAt }
            : r,
        ),
      );
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to update attendance.',
      });
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function handleIssueCertificate(userId: string) {
    try {
      const response = await fetch(`/api/events/${event.id}/certificates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to issue certificate');

      setRecords((prev) =>
        prev.map((r) => (r.userId === userId ? { ...r, certificateId: data.certificateId } : r)),
      );
      setFeedback({ type: 'success', message: 'Certificate issued successfully!' });
      setTimeout(() => setFeedback((f) => (f?.type === 'success' ? null : f)), 3000);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Error issuing certificate',
      });
    }
  }

  return (
    <div className="attendance-container" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header with quick facts and CSV Export */}
      <div
        className="card attendance-header-card"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          background: 'var(--card)',
        }}
      >
        <div>
          <span className="eyebrow" style={{ color: 'var(--accent)', fontWeight: 700 }}>
            Organizer Access · Attendance Tracker
          </span>
          <h1 style={{ margin: '4px 0', fontSize: 'clamp(22px, 4vw, 30px)' }}>{event.title}</h1>
          <p style={{ margin: 0, opacity: 0.85, fontSize: 14 }}>
            {event.place} · {event.mode} · Starts {formatShort(event.start)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <a
            href={`/api/events/${event.id}/attendance/export`}
            download
            className="btn btn--primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <span>📥</span> Export CSV
          </a>
        </div>
      </div>

      {/* Live Counter Panel */}
      <section aria-label="Live attendance statistics">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 16,
          }}
        >
          <div className="card" style={{ padding: 18, textAlign: 'center' }}>
            <span style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
              Total Registrations
            </span>
            <div style={{ fontSize: 36, fontWeight: 800, marginTop: 4 }}>{totalCount}</div>
          </div>
          <div className="card" style={{ padding: 18, textAlign: 'center', background: '#e6f7ec' }}>
            <span style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: '#137333' }}>
              Present
            </span>
            <div style={{ fontSize: 36, fontWeight: 800, marginTop: 4, color: '#137333' }}>{presentCount}</div>
          </div>
          <div className="card" style={{ padding: 18, textAlign: 'center', background: '#fdf2f2' }}>
            <span style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: '#c5221f' }}>
              Absent
            </span>
            <div style={{ fontSize: 36, fontWeight: 800, marginTop: 4, color: '#c5221f' }}>{absentCount}</div>
          </div>
          <div className="card" style={{ padding: 18, textAlign: 'center' }}>
            <span style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
              Live Turnout
            </span>
            <div style={{ fontSize: 36, fontWeight: 800, marginTop: 4 }}>{attendanceRate}%</div>
          </div>
        </div>

        {/* Turnout Progress Bar */}
        <div
          style={{
            marginTop: 12,
            height: 12,
            background: 'var(--border-color, #e0e0e0)',
            borderRadius: 999,
            overflow: 'hidden',
            border: '2px solid var(--ink)',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${attendanceRate}%`,
              background: 'var(--accent, #16a34a)',
              transition: 'width 300ms ease',
            }}
          />
        </div>
      </section>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`card ${feedback.type === 'error' ? 'form-error' : 'form-success'}`}
          role={feedback.type === 'error' ? 'alert' : 'status'}
          style={{
            padding: '12px 16px',
            fontSize: 14,
            fontWeight: 600,
            background: feedback.type === 'error' ? '#fee2e2' : '#dcfce7',
            borderColor: feedback.type === 'error' ? '#ef4444' : '#22c55e',
          }}
        >
          {feedback.message}
        </div>
      )}

      {/* Filter and Search Bar */}
      <section
        className="card"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 16,
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            className={`btn ${statusFilter === 'all' ? 'btn--primary' : 'btn--ghost'}`}
            onClick={() => setStatusFilter('all')}
            style={{ fontSize: 13, padding: '6px 14px' }}
          >
            All ({totalCount})
          </button>
          <button
            type="button"
            className={`btn ${statusFilter === 'present' ? 'btn--primary' : 'btn--ghost'}`}
            onClick={() => setStatusFilter('present')}
            style={{ fontSize: 13, padding: '6px 14px' }}
          >
            Present ({presentCount})
          </button>
          <button
            type="button"
            className={`btn ${statusFilter === 'absent' ? 'btn--primary' : 'btn--ghost'}`}
            onClick={() => setStatusFilter('absent')}
            style={{ fontSize: 13, padding: '6px 14px' }}
          >
            Absent ({absentCount})
          </button>
        </div>

        <div style={{ flex: '1 1 240px', maxWidth: 360 }}>
          <input
            type="search"
            className="input"
            placeholder="Search by student name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', height: 40 }}
          />
        </div>
      </section>

      {/* Registrant Roll-Call List */}
      <section aria-label="Registrants attendance list">
        {totalCount === 0 ? (
          <div className="card" style={{ padding: 32, textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 8px 0' }}>No registrants yet</h3>
            <p style={{ margin: 0, opacity: 0.8 }}>Students who register for this event will appear here for roll-call.</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="card" style={{ padding: 24, textAlign: 'center' }}>
            <p style={{ margin: 0 }}>No registrants match your search or filter.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredRecords.map((record) => {
              const isPresent = record.status === 'present';
              const isUpdating = updatingUserId === record.userId;

              return (
                <div
                  key={record.userId}
                  className="card"
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 18px',
                    gap: 14,
                    borderColor: isPresent ? '#22c55e' : 'var(--ink)',
                    backgroundColor: isPresent ? '#f8fdf9' : 'var(--card)',
                    opacity: isUpdating ? 0.7 : 1,
                    transition: 'all 150ms ease',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: 16 }}>{record.name}</strong>
                      {record.courseYear && (
                        <span
                          className="chip chip--neutral"
                          style={{ fontSize: 11, padding: '2px 8px' }}
                        >
                          {record.courseYear}
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 999,
                          backgroundColor: isPresent ? '#dcfce7' : '#fee2e2',
                          color: isPresent ? '#15803d' : '#b91c1c',
                          border: `1px solid ${isPresent ? '#86efac' : '#fca5a5'}`,
                        }}
                      >
                        {isPresent ? '✓ Present' : '✗ Absent'}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.75 }}>
                      <span>{record.email}</span> ·{' '}
                      <span>Registered {formatShort(record.registeredAt.slice(0, 10))}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {/* Toggle Controls */}
                    <div
                      role="group"
                      aria-label={`Attendance for ${record.name}`}
                      style={{
                        display: 'inline-flex',
                        borderRadius: 'var(--radius, 8px)',
                        border: '2px solid var(--ink)',
                        overflow: 'hidden',
                        boxShadow: '2px 2px 0 var(--ink)',
                      }}
                    >
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleToggleStatus(record.userId, 'present')}
                        style={{
                          padding: '8px 16px',
                          border: 'none',
                          borderRight: '1px solid var(--ink)',
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: isUpdating ? 'wait' : 'pointer',
                          backgroundColor: isPresent ? '#22c55e' : '#f3f4f6',
                          color: isPresent ? '#ffffff' : '#374151',
                          transition: 'background-color 150ms ease',
                        }}
                        aria-pressed={isPresent}
                      >
                        Present
                      </button>
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleToggleStatus(record.userId, 'absent')}
                        style={{
                          padding: '8px 16px',
                          border: 'none',
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: isUpdating ? 'wait' : 'pointer',
                          backgroundColor: !isPresent ? '#ef4444' : '#f3f4f6',
                          color: !isPresent ? '#ffffff' : '#374151',
                          transition: 'background-color 150ms ease',
                        }}
                        aria-pressed={!isPresent}
                      >
                        Absent
                      </button>
                    </div>

                    {/* Certificate Action */}
                    {isPresent && (
                      <div>
                        {record.certificateId ? (
                          <Link
                            href={`/certificates/${record.certificateId}`}
                            target="_blank"
                            className="btn btn--outline"
                            style={{ fontSize: 12, padding: '7px 10px', minHeight: 34 }}
                            title="View issued certificate"
                          >
                            🎓 View Cert
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleIssueCertificate(record.userId)}
                            className="btn btn--primary"
                            style={{ fontSize: 12, padding: '7px 10px', minHeight: 34 }}
                            title="Issue certificate for present attendee"
                          >
                            🎓 Issue Cert
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Back link */}
      <div>
        <Link href={`/events/${event.id}`} className="back-link">
          ← Back to {event.title}
        </Link>
      </div>
    </div>
  );
}
