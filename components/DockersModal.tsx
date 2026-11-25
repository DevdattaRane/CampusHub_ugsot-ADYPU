'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Avatar from './Avatar';
import type { StudentForkSummary } from '@/lib/db/forks';

interface DockersModalProps {
  userId: string;
  userName: string;
  type: 'dockers' | 'docking';
  isOpen: boolean;
  onClose: () => void;
}

export default function DockersModal({
  userId,
  userName,
  type,
  isOpen,
  onClose,
}: DockersModalProps) {
  const [list, setList] = useState<StudentForkSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 15;

  useEffect(() => {
    if (!isOpen) return;
    let ignore = false;

    fetch(`/api/students/${userId}/${type}?limit=${limit}&offset=0`)
      .then((res) => res.json())
      .then((data) => {
        if (!ignore) {
          setList(data[type] || []);
          setTotal(data.total || 0);
          setOffset(0);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error('Failed to load list:', err);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [isOpen, userId, type]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const loadMore = async () => {
    const nextOffset = offset + limit;
    setLoading(true);
    try {
      const res = await fetch(`/api/students/${userId}/${type}?limit=${limit}&offset=${nextOffset}`);
      const data = await res.json();
      const newItems = data[type] || [];
      setList((prev) => [...prev, ...newItems]);
      setOffset(nextOffset);
    } catch (err) {
      console.error('Failed to load more:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dockers-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'grid',
        placeItems: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: 'min(100%, 480px)',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 24,
          backgroundColor: '#fff',
          boxShadow: '6px 6px 0 #111',
          border: '3px solid #111',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 id="dockers-modal-title" style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
            {type === 'dockers' ? `⚓ Dockers of ${userName}` : `🍴 Docking by ${userName}`} ({total})
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'none',
              border: 'none',
              fontSize: 22,
              fontWeight: 800,
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {list.map((student) => (
            <Link
              key={student.id}
              href={`/students/${student.id}`}
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                border: '1.5px solid #111',
                borderRadius: 4,
                textDecoration: 'none',
                color: '#111',
                backgroundColor: '#faf8f5',
              }}
            >
              <Avatar studentId={student.id} name={student.name} size="md" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{student.name}</div>
                <div style={{ fontSize: 12, color: '#666' }}>{student.courseYear}</div>
                {student.skills.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                    {student.skills.slice(0, 3).map((sk) => (
                      <span
                        key={sk}
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '1px 6px',
                          border: '1px solid #111',
                          borderRadius: 3,
                          background: '#fff',
                        }}
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#2563eb' }}>View →</span>
            </Link>
          ))}

          {!loading && list.length === 0 && (
            <div className="empty-note">
              No {type === 'dockers' ? 'dockers' : 'docking students'} yet.
            </div>
          )}

          {loading && (
            <div className="loading-inline" role="status">
              <span className="sr-only">Loading...</span>
              <span className="loading-inline__bar loading-state__bar" aria-hidden="true" />
            </div>
          )}
        </div>

        {list.length < total && !loading && (
          <button
            type="button"
            className="btn btn--outline"
            onClick={loadMore}
            style={{ marginTop: 14, width: '100%', minHeight: 40, fontSize: 13 }}
          >
            Load more
          </button>
        )}
      </div>
    </div>
  );
}
