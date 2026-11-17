'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { CurrentUser } from '@/lib/auth';
import type { Opportunity, OpportunityCategory } from '@/lib/types';
import { OPPORTUNITY_CATEGORIES } from '@/lib/types';

type Props = {
  initialOpportunities: Opportunity[];
  currentUser: CurrentUser | null;
};

export default function OpportunitiesView({ initialOpportunities, currentUser }: Props) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(initialOpportunities);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [hideExpired, setHideExpired] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null);

  // Form state for creating/editing
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [category, setCategory] = useState<OpportunityCategory>('Internships');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [deadline, setDeadline] = useState('');
  const [location, setLocation] = useState('Remote');
  const [eligibility, setEligibility] = useState('All students');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Bookmark loading states
  const [bookmarkingId, setBookmarkingId] = useState<string | null>(null);

  // Pure render timestamp
  const [renderNow] = useState(() => Date.now());

  const isOrganizer = currentUser?.role === 'organizer';

  // Filtered opportunities
  const filtered = useMemo(() => {
    let list = [...opportunities];

    if (selectedCategory !== 'All') {
      list = list.filter((o) => o.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          o.organization.toLowerCase().includes(q) ||
          o.description.toLowerCase().includes(q) ||
          o.location.toLowerCase().includes(q),
      );
    }

    if (hideExpired) {
      list = list.filter((o) => new Date(o.deadline).getTime() >= renderNow);
    }

    list.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    return list;
  }, [opportunities, selectedCategory, searchQuery, hideExpired, renderNow]);

  const handleToggleBookmark = async (oppId: string) => {
    if (!currentUser) {
      alert('Please sign in to bookmark opportunities.');
      return;
    }

    setBookmarkingId(oppId);
    try {
      const res = await fetch(`/api/opportunities/${oppId}/bookmark`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update bookmark');

      setOpportunities((prev) =>
        prev.map((o) => (o.id === oppId ? { ...o, isBookmarked: data.isBookmarked } : o)),
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error bookmarking');
    } finally {
      setBookmarkingId(null);
    }
  };

  const handleOpenPostModal = (oppToEdit?: Opportunity) => {
    if (oppToEdit) {
      setEditingOpp(oppToEdit);
      setTitle(oppToEdit.title);
      setOrganization(oppToEdit.organization);
      setCategory(oppToEdit.category);
      setDescription(oppToEdit.description);
      setLink(oppToEdit.link);
      setDeadline(oppToEdit.deadline.slice(0, 10));
      setLocation(oppToEdit.location);
      setEligibility(oppToEdit.eligibility);
    } else {
      setEditingOpp(null);
      setTitle('');
      setOrganization('');
      setCategory('Internships');
      setDescription('');
      setLink('');
      // Default to 14 days from now
      const defaultDate = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
      setDeadline(defaultDate);
      setLocation('Remote');
      setEligibility('All students');
    }
    setErrorMsg(null);
    setIsPosting(true);
  };

  const handleSaveOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        title,
        organization,
        category,
        description,
        link,
        deadline: new Date(`${deadline}T23:59:59Z`).toISOString(),
        location,
        eligibility,
      };

      if (editingOpp) {
        const res = await fetch(`/api/opportunities/${editingOpp.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update opportunity');

        setOpportunities((prev) =>
          prev.map((o) => (o.id === editingOpp.id ? { ...o, ...payload } : o)),
        );
      } else {
        const res = await fetch('/api/opportunities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create opportunity');

        const newOpp: Opportunity = {
          id: data.id,
          ...payload,
          creatorId: currentUser?.id,
          createdAt: new Date().toISOString(),
        };
        setOpportunities((prev) => [newOpp, ...prev]);
      }

      setIsPosting(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOpportunity = async (oppId: string) => {
    if (!confirm('Are you sure you want to delete this opportunity?')) return;

    try {
      const res = await fetch(`/api/opportunities/${oppId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');

      setOpportunities((prev) => prev.filter((o) => o.id !== oppId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error deleting opportunity');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Filter and Search Bar */}
      <div
        style={{
          border: '2px solid #1a1a1a',
          borderRadius: 4,
          padding: 16,
          backgroundColor: '#fff',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {/* Search Box */}
          <div style={{ flex: '1 1 260px' }}>
            <input
              type="text"
              placeholder="🔍 Search opportunities, companies, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '2px solid #1a1a1a',
                borderRadius: 4,
                fontFamily: 'inherit',
                fontSize: 14,
              }}
            />
          </div>

          {/* Hide Expired Toggle */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
              userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              checked={hideExpired}
              onChange={(e) => setHideExpired(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#1a1a1a' }}
            />
            Hide expired deadlines
          </label>

          {/* Organizer Add Opportunity Button */}
          {isOrganizer && (
            <button
              onClick={() => handleOpenPostModal()}
              style={{
                padding: '10px 18px',
                backgroundColor: '#FFE066',
                border: '2px solid #1a1a1a',
                borderRadius: 4,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '2px 2px 0 #1a1a1a',
              }}
            >
              + Post Opportunity
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {OPPORTUNITY_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 4,
                  border: '2px solid #1a1a1a',
                  backgroundColor: isSelected ? '#1a1a1a' : '#f4f4f4',
                  color: isSelected ? '#fff' : '#1a1a1a',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.1s ease',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Opportunities List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filtered.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              border: '2px dashed #1a1a1a',
              borderRadius: 4,
              backgroundColor: '#fff',
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>🎯</div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: 18, fontWeight: 700 }}>
              No matching opportunities found
            </h3>
            <p style={{ margin: 0, color: '#666', fontSize: 14 }}>
              Try clearing your search query or selecting a different category.
            </p>
          </div>
        ) : (
          filtered.map((opp) => {
            const isExpired = new Date(opp.deadline).getTime() < renderNow;
            const formattedDate = new Date(opp.deadline).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <article
                key={opp.id}
                style={{
                  border: '2px solid #1a1a1a',
                  borderRadius: 4,
                  padding: 20,
                  backgroundColor: '#fff',
                  boxShadow: '3px 3px 0 #1a1a1a',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  opacity: isExpired ? 0.75 : 1,
                  position: 'relative',
                }}
              >
                {/* Header row */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 10,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 8px',
                          border: '1.5px solid #1a1a1a',
                          borderRadius: 4,
                          backgroundColor: '#E8F5E9',
                          textTransform: 'uppercase',
                        }}
                      >
                        {opp.category}
                      </span>

                      {opp.isFromEvents && (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '2px 8px',
                            border: '1.5px solid #1a1a1a',
                            borderRadius: 4,
                            backgroundColor: '#FFE066',
                          }}
                        >
                          ⚡ Campus Hackathon
                        </span>
                      )}

                      {opp.isClosingSoon && !isExpired && (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '2px 8px',
                            border: '1.5px solid #1a1a1a',
                            borderRadius: 4,
                            backgroundColor: '#F25F5C',
                            color: '#fff',
                          }}
                        >
                          ⏳ Closing Soon
                        </span>
                      )}

                      {isExpired && (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '2px 8px',
                            border: '1.5px solid #666',
                            borderRadius: 4,
                            backgroundColor: '#eee',
                            color: '#666',
                          }}
                        >
                          Expired
                        </span>
                      )}
                    </div>

                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{opp.title}</h3>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 600, color: '#444', fontSize: 14 }}>
                      🏢 {opp.organization} · 📍 {opp.location}
                    </p>
                  </div>

                  {/* Bookmark Button */}
                  <button
                    onClick={() => handleToggleBookmark(opp.id)}
                    disabled={bookmarkingId === opp.id}
                    title={opp.isBookmarked ? 'Remove from bookmarks' : 'Bookmark this opportunity'}
                    style={{
                      padding: '6px 12px',
                      border: '2px solid #1a1a1a',
                      borderRadius: 4,
                      backgroundColor: opp.isBookmarked ? '#FFE066' : '#fff',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    {opp.isBookmarked ? '★ Bookmarked' : '☆ Bookmark'}
                  </button>
                </div>

                {/* Description */}
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: '#333' }}>
                  {opp.description}
                </p>

                {/* Eligibility & Deadline row */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    paddingTop: 10,
                    borderTop: '1px solid #eee',
                    fontSize: 13,
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>🎓 Eligibility:</span> {opp.eligibility}
                    </div>
                    <div>
                      <span style={{ fontWeight: 600 }}>📅 Deadline:</span> {formattedDate}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* Organizer edit/delete actions */}
                    {isOrganizer && !opp.isFromEvents && (
                      <>
                        <button
                          onClick={() => handleOpenPostModal(opp)}
                          style={{
                            padding: '6px 12px',
                            border: '1.5px solid #1a1a1a',
                            borderRadius: 4,
                            backgroundColor: '#fff',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteOpportunity(opp.id)}
                          style={{
                            padding: '6px 12px',
                            border: '1.5px solid #1a1a1a',
                            borderRadius: 4,
                            backgroundColor: '#ffebee',
                            color: '#c62828',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      </>
                    )}

                    {/* Action link */}
                    {opp.isFromEvents ? (
                      <Link
                        href={opp.eventUrl || '/events'}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#4EA8DE',
                          color: '#fff',
                          border: '2px solid #1a1a1a',
                          borderRadius: 4,
                          fontWeight: 700,
                          fontSize: 13,
                          textDecoration: 'none',
                          boxShadow: '2px 2px 0 #1a1a1a',
                        }}
                      >
                        View Hackathon & Register →
                      </Link>
                    ) : (
                      <a
                        href={opp.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#1a1a1a',
                          color: '#fff',
                          border: '2px solid #1a1a1a',
                          borderRadius: 4,
                          fontWeight: 700,
                          fontSize: 13,
                          textDecoration: 'none',
                          boxShadow: '2px 2px 0 #888',
                        }}
                      >
                        Visit & Apply ↗
                      </a>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Post / Edit Opportunity Modal */}
      {isPosting && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              border: '3px solid #1a1a1a',
              borderRadius: 4,
              boxShadow: '6px 6px 0 #1a1a1a',
              width: '100%',
              maxWidth: 580,
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 24,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>
                {editingOpp ? 'Edit Opportunity' : 'Post New Opportunity'}
              </h2>
              <button
                onClick={() => setIsPosting(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 22,
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div
                style={{
                  padding: 10,
                  backgroundColor: '#FFCDD2',
                  border: '2px solid #C62828',
                  borderRadius: 4,
                  color: '#B71C1C',
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 16,
                }}
              >
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveOpportunity} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                  Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summer 2027 Software Engineering Intern"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '2px solid #1a1a1a',
                    borderRadius: 4,
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                    Organization / Company *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Google, ADYPU Lab"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '2px solid #1a1a1a',
                      borderRadius: 4,
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as OpportunityCategory)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '2px solid #1a1a1a',
                      borderRadius: 4,
                      backgroundColor: '#fff',
                    }}
                  >
                    <option value="Internships">Internships</option>
                    <option value="Open-source programs">Open-source programs</option>
                    <option value="Hackathons">Hackathons</option>
                    <option value="Fellowships">Fellowships</option>
                    <option value="Competitions">Competitions</option>
                    <option value="Research">Research</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                  Description *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Summarize the opportunity, benefits, key responsibilities..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '2px solid #1a1a1a',
                    borderRadius: 4,
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                    Application Link *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://..."
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '2px solid #1a1a1a',
                      borderRadius: 4,
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                    Deadline *
                  </label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '2px solid #1a1a1a',
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                    Location / Mode
                  </label>
                  <input
                    type="text"
                    placeholder="Remote, Pune, Bengaluru..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '2px solid #1a1a1a',
                      borderRadius: 4,
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                    Eligibility
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2nd & 3rd year students"
                    value={eligibility}
                    onChange={(e) => setEligibility(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '2px solid #1a1a1a',
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsPosting(false)}
                  style={{
                    padding: '8px 16px',
                    border: '2px solid #1a1a1a',
                    borderRadius: 4,
                    backgroundColor: '#f5f5f5',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '8px 20px',
                    border: '2px solid #1a1a1a',
                    borderRadius: 4,
                    backgroundColor: '#FFE066',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '2px 2px 0 #1a1a1a',
                  }}
                >
                  {submitting ? 'Saving...' : editingOpp ? 'Update Opportunity' : 'Post Opportunity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
