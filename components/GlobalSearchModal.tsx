'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { GlobalSearchResults } from '@/lib/types';
import GlassPanel from './effects/GlassPanel';

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
      className="global-search-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Global Campus Search"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <GlassPanel className="global-search__panel">
        <div className="global-search__input-row">
          <span className="global-search__icon" aria-hidden="true">⌕</span>
          <input
            ref={inputRef}
            className="global-search__input"
            aria-label="Search projects, community posts, events, opportunities, and students"
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Search projects, community posts, events, opportunities, students..."
          />
          {query && (
            <button
              type="button"
              className="global-search__clear"
              aria-label="Clear search"
              onClick={() => setQuery('')}
            >
              ×
            </button>
          )}
          <span className="global-search__hint">Esc to close</span>
        </div>

        {results && results.totalCount > 0 && (
          <div className="global-search__tabs" role="group" aria-label="Filter search results">
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
                className="pill r sm global-search__tab"
                aria-pressed={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <div className="global-search__content">
          {loading && (
            <div className="global-search__status" role="status" aria-live="polite">
              Searching CampusHub...
            </div>
          )}

          {!loading && query.trim().length >= 2 && results && results.totalCount === 0 && (
            <div className="global-search__empty">
              <div className="global-search__empty-title">No matching results found</div>
              <div className="global-search__empty-copy">
                Try searching for a different keyword, tech stack, or student name.
              </div>
            </div>
          )}

          {!loading && query.trim().length < 2 && (
            <div className="global-search__status">
              Type at least 2 characters to search across all campus activities.
            </div>
          )}

          {results && !loading && (
            <>
              {(activeTab === 'all' || activeTab === 'events') && results.events.length > 0 && (
                <section className="global-search__group" aria-label="Campus events">
                  <h2 className="mono">Campus events · {results.events.length}</h2>
                  <div className="global-search__results">
                    {results.events.map((ev) => (
                      <Link
                        key={ev.id}
                        href={`/events/${ev.id}`}
                        onClick={onClose}
                        className="global-search__result"
                      >
                        <div className="global-search__result-copy">
                          <span className="global-search__result-title">{ev.title}</span>
                          <span className="global-search__result-meta">
                            {ev.category} · {ev.where} · {ev.start}
                          </span>
                        </div>
                        <span className="global-search__action">View →</span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {(activeTab === 'all' || activeTab === 'projects') && results.projects.length > 0 && (
                <section className="global-search__group" aria-label="Student projects">
                  <h2 className="mono">Student projects · {results.projects.length}</h2>
                  <div className="global-search__results">
                    {results.projects.map((proj) => (
                      <Link
                        key={proj.id}
                        href={`/projects/${proj.id}`}
                        onClick={onClose}
                        className="global-search__result"
                      >
                        <div className="global-search__result-copy">
                          <span className="global-search__result-title">{proj.title}</span>
                          <span className="global-search__result-description">{proj.shortDescription}</span>
                          <span className="global-search__result-meta">
                            {proj.techStack.slice(0, 3).join(', ')}
                          </span>
                        </div>
                        <span className="global-search__action">View →</span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {(activeTab === 'all' || activeTab === 'forum') && results.forum.length > 0 && (
                <section className="global-search__group" aria-label="Community">
                  <h2 className="mono">Community · {results.forum.length}</h2>
                  <div className="global-search__results">
                    {results.forum.map((post) => (
                      <Link
                        key={post.id}
                        href={`/community?post=${post.id}`}
                        onClick={onClose}
                        className="global-search__result"
                      >
                        <div className="global-search__result-copy">
                          <span className="global-search__result-title">{post.title}</span>
                          <span className="global-search__result-description">
                            {post.bodySnippet}...
                          </span>
                        </div>
                        <span className="global-search__action">Discuss →</span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {(activeTab === 'all' || activeTab === 'opportunities') && results.opportunities.length > 0 && (
                <section className="global-search__group" aria-label="Opportunities">
                  <h2 className="mono">Opportunities · {results.opportunities.length}</h2>
                  <div className="global-search__results">
                    {results.opportunities.map((opp) => (
                      <Link
                        key={opp.id}
                        href="/opportunities"
                        onClick={onClose}
                        className="global-search__result"
                      >
                        <div className="global-search__result-copy">
                          <span className="global-search__result-title">{opp.title}</span>
                          <span className="global-search__result-meta">
                            {opp.organization} · {opp.category} · {opp.location}
                          </span>
                        </div>
                        <span className="global-search__action">Apply →</span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {(activeTab === 'all' || activeTab === 'students') && results.students.length > 0 && (
                <section className="global-search__group" aria-label="Students and peers">
                  <h2 className="mono">Students and peers · {results.students.length}</h2>
                  <div className="global-search__results">
                    {results.students.map((st) => (
                      <Link
                        key={st.id}
                        href="/students"
                        onClick={onClose}
                        className="global-search__result"
                      >
                        <div className="global-search__result-copy">
                          <span className="global-search__result-title">{st.name}</span>
                          <span className="global-search__result-meta">
                            {st.courseYear || 'Student'} {st.skills.length > 0 ? `· ${st.skills.slice(0, 3).join(', ')}` : ''}
                          </span>
                        </div>
                        <span className="global-search__action">Profile →</span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </GlassPanel>
    </div>
  );
}
