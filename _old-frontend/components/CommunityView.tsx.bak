'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { CurrentUser } from '@/lib/auth';
import {
  COMMUNITY_TAGS,
  type CommunityAnswer,
  type CommunityPost,
  type CommunityPostType,
} from '@/lib/types';
import Card from './ui/Card';
import Tag from './ui/Tag';
import { timeAgo } from '@/lib/dates';
import { ArrowUp, Bubble } from './icons';

type Props = {
  initialPosts: CommunityPost[];
  currentUser: CurrentUser | null;
};

const TABS: { type: CommunityPostType; label: string }[] = [
  { type: 'question', label: 'Questions' },
  { type: 'discussion', label: 'Discussions' },
  { type: 'announcement', label: 'Announcements' },
];

export default function CommunityView({ initialPosts, currentUser }: Props) {
  const [activeTab, setActiveTab] = useState<CommunityPostType>('question');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [posts, setPosts] = useState<CommunityPost[]>(initialPosts);

  // Composer state
  const [showComposer, setShowComposer] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [draftTags, setDraftTags] = useState<string[]>(['Web']);
  const [submitting, setSubmitting] = useState(false);
  const [composerError, setComposerError] = useState('');

  // Expanded post thread state
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [answersMap, setAnswersMap] = useState<Record<string, CommunityAnswer[]>>({});
  const [loadingAnswers, setLoadingAnswers] = useState<Record<string, boolean>>({});
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [submittingReply, setSubmittingReply] = useState<Record<string, boolean>>({});

  const isOrganizer = currentUser?.role === 'organizer';

  // Filter posts
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (post.type !== activeTab) return false;
      if (selectedTag !== 'All' && !post.tags.includes(selectedTag)) return false;
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const matchesTitle = post.title.toLowerCase().includes(query);
        const matchesContent = post.content.toLowerCase().includes(query);
        const matchesTag = post.tags.some((t) => t.toLowerCase().includes(query));
        if (!matchesTitle && !matchesContent && !matchesTag) return false;
      }
      return true;
    });
  }, [posts, activeTab, selectedTag, search]);

  const [now] = useState(() => Date.now());

  // Load answers when expanding
  function handleToggleExpand(postId: string) {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
      return;
    }

    setExpandedPostId(postId);
    if (!answersMap[postId]) {
      setLoadingAnswers((prev) => ({ ...prev, [postId]: true }));
      fetch(`/api/forum/posts/${postId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.answers) {
            setAnswersMap((prev) => ({ ...prev, [postId]: data.answers }));
          }
        })
        .catch((err) => console.error('Failed to load answers:', err))
        .finally(() => {
          setLoadingAnswers((prev) => ({ ...prev, [postId]: false }));
        });
    }
  }

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    if (!draftTitle.trim() || !draftContent.trim() || submitting) return;

    setSubmitting(true);
    setComposerError('');

    try {
      const response = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeTab,
          title: draftTitle.trim(),
          content: draftContent.trim(),
          tags: draftTags,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to submit post');

      const newPost: CommunityPost = {
        id: data.postId || `post-${Date.now()}`,
        type: activeTab,
        title: draftTitle.trim(),
        content: draftContent.trim(),
        authorId: currentUser?.id || 'me',
        authorName: currentUser?.name || 'You',
        authorEmail: currentUser?.email || '',
        tags: draftTags,
        acceptedAnswerId: null,
        isReported: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        upvotesCount: 0,
        answersCount: 0,
        hasUpvoted: false,
        canDelete: true,
      };

      setPosts((prev) => [newPost, ...prev]);
      setDraftTitle('');
      setDraftContent('');
      setShowComposer(false);
    } catch (err) {
      setComposerError(err instanceof Error ? err.message : 'Unable to create post.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleUpvote(itemType: 'post' | 'answer', itemId: string) {
    if (!currentUser) return;

    if (itemType === 'post') {
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== itemId) return p;
          const nextVoted = !p.hasUpvoted;
          return {
            ...p,
            hasUpvoted: nextVoted,
            upvotesCount: p.upvotesCount + (nextVoted ? 1 : -1),
          };
        }),
      );
    } else {
      setAnswersMap((prev) => {
        const next = { ...prev };
        for (const pId in next) {
          next[pId] = next[pId].map((a) => {
            if (a.id !== itemId) return a;
            const nextVoted = !a.hasUpvoted;
            return {
              ...a,
              hasUpvoted: nextVoted,
              upvotesCount: a.upvotesCount + (nextVoted ? 1 : -1),
            };
          });
        }
        return next;
      });
    }

    try {
      await fetch('/api/forum/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType, itemId }),
      });
    } catch (err) {
      console.error('Vote failed:', err);
    }
  }

  async function handleDeletePost(postId: string) {
    if (!confirm('Are you sure you want to delete this post?')) return;
    setPosts((prev) => prev.filter((p) => p.id !== postId));

    try {
      await fetch(`/api/forum/posts/${postId}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Delete failed:', err);
    }
  }

  async function handleReportPost(postId: string) {
    alert('Thank you. This post has been reported to organizers for review.');
    try {
      await fetch('/api/forum/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType: 'post', itemId: postId }),
      });
    } catch (err) {
      console.error('Report failed:', err);
    }
  }

  async function handleAddAnswer(postId: string) {
    const text = replyDrafts[postId]?.trim();
    if (!text || submittingReply[postId]) return;

    setSubmittingReply((prev) => ({ ...prev, [postId]: true }));

    try {
      const response = await fetch('/api/forum/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, content: text }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to submit answer');

      const newAnswer: CommunityAnswer = {
        id: data.answerId || `ans-${Date.now()}`,
        postId,
        authorId: currentUser?.id || 'me',
        authorName: currentUser?.name || 'You',
        authorEmail: currentUser?.email || '',
        content: text,
        isAccepted: false,
        isReported: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        upvotesCount: 0,
        hasUpvoted: false,
        canDelete: true,
        canAccept: false,
      };

      setAnswersMap((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newAnswer],
      }));
      setReplyDrafts((prev) => ({ ...prev, [postId]: '' }));

      // Increment answer count on post
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, answersCount: p.answersCount + 1 } : p)),
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unable to submit reply.');
    } finally {
      setSubmittingReply((prev) => ({ ...prev, [postId]: false }));
    }
  }

  async function handleAcceptAnswer(postId: string, answerId: string) {
    setAnswersMap((prev) => {
      const answers = (prev[postId] || []).map((a) => ({
        ...a,
        isAccepted: a.id === answerId,
      }));
      return {
        ...prev,
        [postId]: answers.sort((a, b) => (a.isAccepted ? -1 : b.isAccepted ? 1 : 0)),
      };
    });

    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, acceptedAnswerId: answerId } : p)),
    );

    try {
      await fetch(`/api/forum/answers/${answerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });
    } catch (err) {
      console.error('Accept answer failed:', err);
    }
  }

  function toggleTagInComposer(tag: string) {
    setDraftTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  return (
    <div className="community-view" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Community Primary Tabs */}
      <div
        className="segmented"
        role="tablist"
        aria-label="Community categories"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          border: '2px solid var(--ink)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          background: 'var(--bg)',
        }}
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.type;
          return (
            <button
              key={tab.type}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setActiveTab(tab.type);
                setShowComposer(false);
              }}
              style={{
                padding: '12px 16px',
                fontWeight: 800,
                fontSize: 15,
                border: 'none',
                background: active ? 'var(--highlight, #ffd166)' : 'transparent',
                color: 'var(--ink)',
                cursor: 'pointer',
                transition: 'background 150ms ease',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Action / Search / Tag Bar */}
      <div
        className="card"
        style={{
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 260px' }}>
            <input
              type="search"
              className="input"
              placeholder={`Search ${activeTab}s by keyword or tag…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            {currentUser ? (
              activeTab === 'announcement' && !isOrganizer ? (
                <span style={{ fontSize: 13, opacity: 0.75, alignSelf: 'center' }}>
                  📌 Only organizers can post announcements
                </span>
              ) : (
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => setShowComposer((v) => !v)}
                >
                  {showComposer ? '✕ Close Composer' : `+ New ${activeTab}`}
                </button>
              )
            ) : (
              <Link href="/auth/sign-in" className="btn btn--primary">
                Sign in to post
              </Link>
            )}
          </div>
        </div>

        {/* Tags filter row */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, marginRight: 4 }}>Tags:</span>
          {['All', ...COMMUNITY_TAGS].map((t) => {
            const on = selectedTag === t;
            return (
              <button
                key={t}
                type="button"
                className="chip"
                onClick={() => setSelectedTag(t)}
                style={{
                  background: on ? 'var(--ink)' : 'var(--card)',
                  color: on ? '#ffffff' : 'var(--ink)',
                  border: '1.5px solid var(--ink)',
                  cursor: 'pointer',
                  fontSize: 12,
                  padding: '3px 10px',
                }}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* Composer Modal/Card */}
      {showComposer && (
        <form onSubmit={handleCreatePost} className="card composer" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>
            Create a new {activeTab}
          </h2>
          {composerError && <p className="form-error" role="alert">{composerError}</p>}

          <div className="field">
            <label htmlFor="post-title" className="field__label">Title</label>
            <input
              id="post-title"
              type="text"
              className="input"
              placeholder={activeTab === 'question' ? 'e.g. How do I configure Supabase Auth with SSR?' : 'Title of your post'}
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="post-content" className="field__label">Content (Markdown or plain text)</label>
            <textarea
              id="post-content"
              rows={5}
              className="textarea"
              placeholder="Provide details, error frames, or what you've tried..."
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="field__label">Select Tags</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {COMMUNITY_TAGS.map((tag) => {
                const selected = draftTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    className="chip"
                    onClick={() => toggleTagInComposer(tag)}
                    style={{
                      background: selected ? 'var(--accent, #2563eb)' : '#f3f4f6',
                      color: selected ? '#ffffff' : '#1f2937',
                      border: '1.5px solid var(--ink)',
                      cursor: 'pointer',
                      fontSize: 12,
                      padding: '4px 10px',
                    }}
                  >
                    {selected ? `✓ ${tag}` : tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setShowComposer(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? 'Publishing…' : 'Publish'}
            </button>
          </div>
        </form>
      )}

      {/* Posts List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {filteredPosts.length === 0 ? (
          <Card className="card" style={{ padding: 32, textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 6px 0' }}>No {activeTab}s found</h3>
            <p style={{ margin: 0, opacity: 0.8 }}>
              {search || selectedTag !== 'All'
                ? 'Try clearing the search or choosing another tag filter.'
                : `Be the first to start a ${activeTab} in this category!`}
            </p>
          </Card>
        ) : (
          filteredPosts.map((post) => {
            const isExpanded = expandedPostId === post.id;
            const answers = answersMap[post.id] || [];
            const isLoadingReplies = loadingAnswers[post.id];

            return (
              <article
                key={post.id}
                className="card"
                style={{
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  border: post.acceptedAnswerId ? '2.5px solid #16a34a' : '2px solid var(--ink)',
                  background: 'var(--card)',
                }}
              >
                {/* Top Meta */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Tag className="chip" style={{ background: '#fef08a', color: '#854d0e', textTransform: 'uppercase', fontSize: 11 }}>
                      {post.type}
                    </Tag>
                    {post.acceptedAnswerId && (
                      <span
                        style={{
                          background: '#dcfce7',
                          color: '#15803d',
                          border: '1px solid #86efac',
                          borderRadius: 999,
                          padding: '2px 8px',
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        ✓ Solved
                      </span>
                    )}
                    <span style={{ fontSize: 13, opacity: 0.8 }}>
                      By <strong>{post.authorName}</strong> · {timeAgo(post.createdAt, now)}
                    </span>
                  </div>

                  {/* Moderate / Delete Actions */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {post.canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDeletePost(post.id)}
                        className="btn btn--ghost"
                        style={{ fontSize: 11, padding: '2px 8px', minHeight: 28, color: '#dc2626' }}
                      >
                        Delete
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleReportPost(post.id)}
                      className="btn btn--ghost"
                      style={{ fontSize: 11, padding: '2px 6px', minHeight: 28, opacity: 0.6 }}
                      title="Report content"
                    >
                      🚩
                    </button>
                  </div>
                </div>

                {/* Title & Body */}
                <h2 style={{ margin: '4px 0 0', fontSize: 'clamp(18px, 3.5vw, 22px)', fontWeight: 700 }}>
                  {post.title}
                </h2>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {post.content}
                </p>

                {/* Tags */}
                {post.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {post.tags.map((t) => (
                      <span key={t} className="chip chip--neutral" style={{ fontSize: 11, padding: '2px 8px' }}>
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Foot: Vote & Reply Toggle */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid var(--border-color, #e5e7eb)',
                    paddingTop: 12,
                    marginTop: 4,
                  }}
                >
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleToggleUpvote('post', post.id)}
                      className={`btn ${post.hasUpvoted ? 'btn--primary' : 'btn--ghost'}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 12px',
                        fontSize: 13,
                        minHeight: 34,
                      }}
                      title="Upvote post"
                    >
                      <ArrowUp />
                      <span>{post.upvotesCount}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleExpand(post.id)}
                      className="btn btn--ghost"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 12px',
                        fontSize: 13,
                        minHeight: 34,
                      }}
                    >
                      <Bubble />
                      <span>{post.answersCount} {post.answersCount === 1 ? 'reply' : 'replies'}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleExpand(post.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--ink)',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    {isExpanded ? 'Hide conversation ▲' : 'Open conversation ▼'}
                  </button>
                </div>

                {/* Expanded Answers Thread */}
                {isExpanded && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 14,
                      marginTop: 10,
                      padding: 16,
                      background: '#f9fafb',
                      borderRadius: 8,
                      border: '1.5px solid var(--ink)',
                    }}
                  >
                    <h3 style={{ margin: 0, fontSize: 16 }}>Replies & Solutions</h3>

                    {isLoadingReplies ? (
                      <p style={{ margin: 0, fontSize: 14, opacity: 0.75 }}>Loading conversation…</p>
                    ) : answers.length === 0 ? (
                      <p style={{ margin: 0, fontSize: 14, opacity: 0.75 }}>
                        No replies yet. Be the first to help out!
                      </p>
                    ) : (
                      answers.map((answer) => (
                        <div
                          key={answer.id}
                          style={{
                            padding: 14,
                            borderRadius: 6,
                            background: answer.isAccepted ? '#f0fdf4' : '#ffffff',
                            border: answer.isAccepted ? '2px solid #16a34a' : '1px solid #d1d5db',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <strong style={{ fontSize: 14 }}>{answer.authorName}</strong>
                              <span style={{ fontSize: 12, opacity: 0.65 }}>
                                {timeAgo(answer.createdAt, now)}
                              </span>
                              {answer.isAccepted && (
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 800,
                                    color: '#15803d',
                                    background: '#dcfce7',
                                    padding: '2px 8px',
                                    borderRadius: 999,
                                    border: '1px solid #86efac',
                                  }}
                                >
                                  ✓ Accepted Answer
                                </span>
                              )}
                            </div>

                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              {answer.canAccept && !answer.isAccepted && (
                                <button
                                  type="button"
                                  onClick={() => handleAcceptAnswer(post.id, answer.id)}
                                  className="btn btn--outline"
                                  style={{ fontSize: 11, padding: '2px 8px', minHeight: 28, color: '#15803d' }}
                                  title="Mark as accepted solution"
                                >
                                  ✓ Accept solution
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleToggleUpvote('answer', answer.id)}
                                className={`btn ${answer.hasUpvoted ? 'btn--primary' : 'btn--ghost'}`}
                                style={{ fontSize: 11, padding: '2px 8px', minHeight: 28 }}
                              >
                                ▲ {answer.upvotesCount}
                              </button>
                            </div>
                          </div>

                          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                            {answer.content}
                          </p>
                        </div>
                      ))
                    )}

                    {/* Reply Box */}
                    {currentUser ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
                        <textarea
                          rows={2}
                          className="textarea"
                          placeholder="Write a helpful reply or solution…"
                          value={replyDrafts[post.id] || ''}
                          onChange={(e) =>
                            setReplyDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))
                          }
                          style={{ fontSize: 14 }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={() => handleAddAnswer(post.id)}
                            className="btn btn--primary"
                            disabled={!replyDrafts[post.id]?.trim() || submittingReply[post.id]}
                            style={{ fontSize: 13, padding: '6px 14px' }}
                          >
                            {submittingReply[post.id] ? 'Posting…' : 'Reply'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: 10, fontSize: 13, textAlign: 'center', opacity: 0.8 }}>
                        <Link href="/auth/sign-in" style={{ fontWeight: 700, textDecoration: 'underline' }}>
                          Sign in
                        </Link>{' '}
                        to join this conversation.
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
