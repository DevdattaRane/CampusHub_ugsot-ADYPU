'use client';

import { useState } from 'react';
import type { ReportItem, ModerationLog } from '@/lib/types';

type Props = {
  initialReports: ReportItem[];
  initialLogs: ModerationLog[];
};

export default function ModerationView({ initialReports, initialLogs }: Props) {
  const [reports, setReports] = useState<ReportItem[]>(initialReports);
  const [logs, setLogs] = useState<ModerationLog[]>(initialLogs);
  const [activeTab, setActiveTab] = useState<'pending' | 'resolved' | 'logs'>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');

  const pendingReports = reports.filter((r) => r.status === 'pending');
  const resolvedReports = reports.filter((r) => r.status !== 'pending');

  const refreshLogs = async () => {
    try {
      const res = await fetch('/api/moderation/action');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.logs)) setLogs(data.logs);
      }
    } catch {
      // Non-fatal
    }
  };

  const handleResolve = async (reportId: string, action: 'dismiss' | 'action_taken', notes?: string) => {
    setActionLoading(reportId);
    try {
      const res = await fetch('/api/moderation/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          action,
          resolutionNotes: notes || customReason || (action === 'dismiss' ? 'Dismissed as non-violating' : 'Action taken by moderator'),
        }),
      });

      if (res.ok) {
        setReports((prev) =>
          prev.map((r) =>
            r.id === reportId
              ? {
                  ...r,
                  status: action === 'dismiss' ? 'dismissed' : 'action_taken',
                  resolutionNotes: notes || customReason,
                  resolvedAt: new Date().toISOString(),
                }
              : r
          )
        );
        setCustomReason('');
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.error || 'Failed to resolve report.');
      }
    } catch {
      alert('Network error while resolving report.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleHide = async (reportId: string, targetType: string, targetId: string, isHidden: boolean) => {
    setActionLoading(`hide-${reportId}`);
    try {
      const res = await fetch('/api/moderation/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_hidden',
          targetType,
          targetId,
          isHidden,
        }),
      });

      if (res.ok) {
        alert(`Content successfully ${isHidden ? 'hidden (soft-deleted)' : 'restored'}.`);
        handleResolve(reportId, 'action_taken', `Content ${isHidden ? 'hidden' : 'restored'}`);
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.error || 'Failed to toggle content visibility.');
      }
    } catch {
      alert('Network error while toggling content.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleWarnUser = async (reportId: string, userId: string) => {
    const reason = prompt('Enter the warning message to send to the student:', 'Inappropriate community behavior violating CampusHub code of conduct');
    if (!reason) return;

    setActionLoading(`warn-${reportId}`);
    try {
      const res = await fetch('/api/moderation/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'warn_user',
          targetId: userId,
          reason,
        }),
      });

      if (res.ok) {
        alert('Warning recorded and delivered to student notifications.');
        handleResolve(reportId, 'action_taken', `User warned: ${reason}`);
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.error || 'Failed to warn user.');
      }
    } catch {
      alert('Network error while issuing warning.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspendUser = async (reportId: string, userId: string, isSuspended: boolean) => {
    const confirmMsg = isSuspended
      ? 'Suspend this student from posting projects and forum messages?'
      : 'Unsuspend this student and restore posting privileges?';
    if (!confirm(confirmMsg)) return;

    const reason = isSuspended ? prompt('Reason for suspension:', 'Repeated violations of community guidelines') : undefined;

    setActionLoading(`suspend-${reportId}`);
    try {
      const res = await fetch('/api/moderation/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_suspension',
          targetId: userId,
          isSuspended,
          reason,
        }),
      });

      if (res.ok) {
        alert(`User ${isSuspended ? 'suspended' : 'reinstated'}.`);
        handleResolve(reportId, 'action_taken', `User ${isSuspended ? 'suspended' : 'unsuspended'}`);
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.error || 'Failed to alter user suspension.');
      }
    } catch {
      alert('Network error while toggling user suspension.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Policy Summary Card */}
      <div
        className="card"
        style={{
          padding: 18,
          border: '2px solid #111',
          borderRadius: 4,
          backgroundColor: '#FFFFFF',
          boxShadow: '3px 3px 0 #111',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>🛡️ Active Spam Protections & Guardrails</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#555' }}>
            Automatic 15-second cooldown on new posts · 2-link maximum for accounts &lt;24 hours old · Soft-deletion guarantees no data loss.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 800, backgroundColor: '#DCFCE7', padding: '4px 10px', borderRadius: 4, border: '1px solid #111' }}>
            ✓ Anti-Spam Active
          </span>
          <span style={{ fontSize: 12, fontWeight: 800, backgroundColor: '#FFE14D', padding: '4px 10px', borderRadius: 4, border: '1px solid #111' }}>
            {pendingReports.length} Pending Reports
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          style={{
            padding: '8px 16px',
            borderRadius: 4,
            border: '2px solid #111',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            backgroundColor: activeTab === 'pending' ? '#FFE14D' : '#FFFFFF',
            color: '#111',
            boxShadow: activeTab === 'pending' ? '2px 2px 0 #111' : 'none',
          }}
        >
          Pending Reports ({pendingReports.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('resolved')}
          style={{
            padding: '8px 16px',
            borderRadius: 4,
            border: '2px solid #111',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            backgroundColor: activeTab === 'resolved' ? '#111' : '#FFFFFF',
            color: activeTab === 'resolved' ? '#FFF' : '#111',
            boxShadow: activeTab === 'resolved' ? '2px 2px 0 #111' : 'none',
          }}
        >
          Resolved Archive ({resolvedReports.length})
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('logs');
            refreshLogs();
          }}
          style={{
            padding: '8px 16px',
            borderRadius: 4,
            border: '2px solid #111',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            backgroundColor: activeTab === 'logs' ? '#2B50FF' : '#FFFFFF',
            color: activeTab === 'logs' ? '#FFF' : '#111',
            boxShadow: activeTab === 'logs' ? '2px 2px 0 #111' : 'none',
          }}
        >
          Moderation Audit Log ({logs.length})
        </button>
      </div>

      {/* PENDING REPORTS TAB */}
      {activeTab === 'pending' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {pendingReports.length > 0 ? (
            pendingReports.map((r) => {
              const loading = actionLoading === r.id || actionLoading?.endsWith(r.id);
              return (
                <div
                  key={r.id}
                  className="card"
                  style={{
                    padding: 20,
                    border: '2px solid #111',
                    borderRadius: 4,
                    backgroundColor: '#FFFFFF',
                    boxShadow: '3px 3px 0 #111',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            padding: '2px 8px',
                            backgroundColor: '#FEE2E2',
                            color: '#991B1B',
                            borderRadius: 3,
                            border: '1px solid #991B1B',
                          }}
                        >
                          {r.itemType.replace('_', ' ')}
                        </span>
                        <span style={{ fontSize: 13, color: '#777' }}>
                          Reported on {new Date(r.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 style={{ margin: '6px 0 2px 0', fontSize: 16, fontWeight: 800 }}>
                        Reason: {r.reason}
                      </h4>
                      {r.details && (
                        <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#444' }}>
                          Details: &ldquo;{r.details}&rdquo;
                        </p>
                      )}
                      <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>
                        Target ID: <code>{r.itemId}</code>
                      </div>
                    </div>
                  </div>

                  {/* Actions for this report */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: 8,
                      borderTop: '1px solid #E5E7EB',
                      paddingTop: 12,
                    }}
                  >
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleToggleHide(r.id, r.itemType, r.itemId, true)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#FEE2E2',
                        color: '#991B1B',
                        border: '1.5px solid #991B1B',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      🚫 Hide Content (Soft Delete)
                    </button>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleWarnUser(r.id, r.reporterId)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#FEF08A',
                        color: '#111',
                        border: '1.5px solid #111',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      ⚠️ Issue Warning to Author
                    </button>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleSuspendUser(r.id, r.reporterId, true)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#111',
                        color: '#FFF',
                        border: '1.5px solid #111',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      ⛔ Suspend Author
                    </button>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleResolve(r.id, 'dismiss')}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#FFFFFF',
                        color: '#666',
                        border: '1.5px solid #999',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        marginLeft: 'auto',
                      }}
                    >
                      Dismiss Report
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div
              className="card"
              style={{
                padding: 40,
                textAlign: 'center',
                backgroundColor: '#FFFFFF',
                border: '2px solid #111',
                borderRadius: 4,
                boxShadow: '3px 3px 0 #111',
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Clean queue</h3>
              <p style={{ margin: '6px 0 0 0', fontSize: 14, color: '#666' }}>
                There are no pending reports requiring organizer action.
              </p>
            </div>
          )}
        </div>
      )}

      {/* RESOLVED REPORTS TAB */}
      {activeTab === 'resolved' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {resolvedReports.length > 0 ? (
            resolvedReports.map((r) => (
              <div
                key={r.id}
                className="card"
                style={{
                  padding: 16,
                  border: '1.5px solid #DDD',
                  borderRadius: 4,
                  backgroundColor: '#FFFFFF',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: 3,
                        backgroundColor: r.status === 'action_taken' ? '#DCFCE7' : '#F3F4F6',
                        color: r.status === 'action_taken' ? '#166534' : '#666',
                      }}
                    >
                      {r.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span style={{ fontWeight: 800, fontSize: 14 }}>{r.reason}</span>
                  </div>
                  {r.resolutionNotes && (
                    <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>
                      Resolution: {r.resolutionNotes}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: 11, color: '#888' }}>
                  {r.resolvedAt ? new Date(r.resolvedAt).toLocaleDateString() : ''}
                </span>
              </div>
            ))
          ) : (
            <div style={{ padding: 24, textAlign: 'center', color: '#666' }}>
              No resolved reports in archive yet.
            </div>
          )}
        </div>
      )}

      {/* AUDIT LOG TAB */}
      {activeTab === 'logs' && (
        <div
          className="card"
          style={{
            border: '2px solid #111',
            borderRadius: 4,
            backgroundColor: '#FFFFFF',
            boxShadow: '3px 3px 0 #111',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 500 }}>
              <thead>
                <tr style={{ backgroundColor: '#FAF8F5', borderBottom: '2px solid #111', fontSize: 12, fontWeight: 800 }}>
                  <th style={{ padding: '12px 16px' }}>Timestamp</th>
                  <th style={{ padding: '12px 16px' }}>Action</th>
                  <th style={{ padding: '12px 16px' }}>Target</th>
                  <th style={{ padding: '12px 16px' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #E5E7EB', fontSize: 13 }}>
                      <td style={{ padding: '12px 16px', color: '#666' }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 800 }}>
                        {log.action}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {log.targetType} (<code>{log.targetId.slice(0, 8)}</code>)
                      </td>
                      <td style={{ padding: '12px 16px', color: '#555' }}>
                        {log.details || '—'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#666' }}>
                      No moderation actions recorded in audit log yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
