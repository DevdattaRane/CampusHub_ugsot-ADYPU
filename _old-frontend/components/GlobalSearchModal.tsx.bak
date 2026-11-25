'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { GlobalSearchResults } from '@/lib/types';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function GlobalSearchModal({ isOpen, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'events' | 'projects' | 'forum' | 'opportunities' | 'students'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen) {
      setQuery('');
      setResults(null);
    }
  }

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (val.trim().length < 2) {
      setResults(null);
      setLoading(false);
    } else {
      setLoading(true);
    }
  };

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    let active = true;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok && active) {
          const data = await res.json();
          setResults(data);
        }
      } catch {
        // Continue
      } finally {
        if (active) setLoading(false);
      }
    }, 200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Global Campus Search"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(2px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '60px 16px 24px 16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 680,
          backgroundColor: '#FFFFFF',
          border: '2px solid #111',
          borderRadius: 4,
          boxShadow: '6px 6px 0 #111',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '80vh',
          overflow: 'hidden',
        }}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '16px 20px',
            borderBottom: '2px solid #111',
            backgroundColor: '#FAF8F5',
          }}
        >
          <span style={{ fontSize: 20 }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Search projects, community posts, events, opportunities, students..."
            style={{
              width: '100%',
              border: 'none',
              background: 'transparent',
              fontSize: 16,
              fontWeight: 700,
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: 16,
              }}
            >
              ×
            </button>
          )}
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              backgroundColor: '#E5E7EB',
              padding: '2px 6px',
              borderRadius: 3,
              border: '1px solid #111',
              whiteSpace: 'nowrap',
            }}
          >
            ESC to close
          </span>
        </div>

        {/* Category Tabs */}
        {results && results.totalCount > 0 && (
          <div
            style={{
              display: 'flex',
              overflowX: 'auto',
              gap: 6,
              padding: '8px 16px',
              borderBottom: '1px solid #E5E7EB',
              backgroundColor: '#FFFFFF',
            }}
          >
            {(
              [
                { id: 'all', label: `All (${results.totalCount})` },
                { id: 'events', label: `Events (${results.events.length})` },
                { id: 'projects', label: `Projects (${results.projects.length})` },
                { id: 'forum', label: `Community (${results.forum.length})` },
                { id: 'opportunities', label: `Opps (${results.opportunities.length})` },
                { id: 'students', label: `Students (${results.students.length})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 3,
                  border: '1px solid #111',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: activeTab === tab.id ? '#FFE14D' : '#F6F1E7',
                  color: '#111',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Search Results Content */}
        <div style={{ overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: 24, fontSize: 13, fontWeight: 700, color: '#666' }}>
              Searching CampusHub...
            </div>
          )}

          {!loading && query.trim().length >= 2 && results && results.totalCount === 0 && (
            <div style={{ textAlign: 'center', padding: 36 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>No matching results found</div>
              <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                Try searching for a different keyword, tech stack, or student name.
              </div>
            </div>
          )}

          {!loading && query.trim().length < 2 && (
            <div style={{ padding: 16, color: '#666', fontSize: 13, textAlign: 'center' }}>
              Type at least 2 characters to search across all campus activities.
            </div>
          )}

          {results && !loading && (
            <>
              {/* Events Results */}
              {(activeTab === 'all' || activeTab === 'events') && results.events.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#666', marginBottom: 8 }}>
                    🎟️ Campus Events ({results.events.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {results.events.map((ev) => (
                      <Link
                        key={ev.id}
                        href={`/events/${ev.id}`}
                        onClick={onClose}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          border: '1.5px solid #111',
                          borderRadius: 4,
                          textDecoration: 'none',
                          color: '#111',
                          backgroundColor: '#FAF8F5',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 14 }}>{ev.title}</div>
                          <div style={{ fontSize: 11, color: '#666' }}>
                            {ev.category} · {ev.where} · {ev.start}
                          </div>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#2B50FF' }}>View →</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects Results */}
              {(activeTab === 'all' || activeTab === 'projects') && results.projects.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#666', marginBottom: 8 }}>
                    💻 Student Projects ({results.projects.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {results.projects.map((proj) => (
                      <Link
                        key={proj.id}
                        href={`/projects/${proj.id}`}
                        onClick={onClose}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          border: '1.5px solid #111',
                          borderRadius: 4,
                          textDecoration: 'none',
                          color: '#111',
                          backgroundColor: '#FAF8F5',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 14 }}>{proj.title}</div>
                          <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{proj.shortDescription}</div>
                          <div style={{ fontSize: 11, color: '#777', marginTop: 2 }}>
                            {proj.techStack.slice(0, 3).join(', ')}
                          </div>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#2B50FF' }}>View →</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Forum Results */}
              {(activeTab === 'all' || activeTab === 'forum') && results.forum.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#666', marginBottom: 8 }}>
                    💬 Community ({results.forum.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {results.forum.map((post) => (
                      <Link
                        key={post.id}
                        href={`/community?post=${post.id}`}
                        onClick={onClose}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          border: '1.5px solid #111',
                          borderRadius: 4,
                          textDecoration: 'none',
                          color: '#111',
                          backgroundColor: '#FAF8F5',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 14 }}>{post.title}</div>
                          <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>
                            {post.bodySnippet}...
                          </div>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#2B50FF' }}>Discuss →</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Opportunities Results */}
              {(activeTab === 'all' || activeTab === 'opportunities') && results.opportunities.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#666', marginBottom: 8 }}>
                    🚀 Opportunities ({results.opportunities.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {results.opportunities.map((opp) => (
                      <Link
                        key={opp.id}
                        href="/opportunities"
                        onClick={onClose}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          border: '1.5px solid #111',
                          borderRadius: 4,
                          textDecoration: 'none',
                          color: '#111',
                          backgroundColor: '#FAF8F5',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 14 }}>{opp.title}</div>
                          <div style={{ fontSize: 11, color: '#666' }}>
                            {opp.organization} · {opp.category} · {opp.location}
                          </div>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#2B50FF' }}>Apply →</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Students Results */}
              {(activeTab === 'all' || activeTab === 'students') && results.students.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#666', marginBottom: 8 }}>
                    👥 Students & Peers ({results.students.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {results.students.map((st) => (
                      <Link
                        key={st.id}
                        href="/students"
                        onClick={onClose}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          border: '1.5px solid #111',
                          borderRadius: 4,
                          textDecoration: 'none',
                          color: '#111',
                          backgroundColor: '#FAF8F5',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 14 }}>{st.name}</div>
                          <div style={{ fontSize: 11, color: '#666' }}>
                            {st.courseYear || 'Student'} {st.skills.length > 0 ? `· ${st.skills.slice(0, 3).join(', ')}` : ''}
                          </div>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#2B50FF' }}>Profile →</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
