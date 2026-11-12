'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { Post, PostTag } from '@/lib/types';
import { tagColors } from '@/lib/colors';
import { timeAgo } from '@/lib/dates';
import { CURRENT_USER_ID, getEvent, getStudent } from '@/lib/data';
import Avatar from './Avatar';
import FilterPills from './FilterPills';
import { ArrowUp, Bubble } from './icons';
import Button from './ui/Button';
import Card from './ui/Card';
import Tag from './ui/Tag';

const TAGS: PostTag[] = ['Need help', 'Ask', 'Find teammate', 'Showcase'];
const FILTERS = ['All', ...TAGS] as const;

export default function CommunityFeed({ initialPosts, now: initialNow }: { initialPosts: Post[]; now: number }) {
  const [posts, setPosts] = useState(initialPosts);
  const [now, setNow] = useState(initialNow);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const [draft, setDraft] = useState('');
  const [draftTag, setDraftTag] = useState<PostTag>('Ask');
  const [voted, setVoted] = useState<Record<string, boolean>>({});

  const visible = useMemo(() => posts.filter((p) => filter === 'All' || p.tag === filter), [posts, filter]);

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    const createdAt = new Date().toISOString();
    const long = text.length > 80;
    const post: Post = {
      id: `local-${Date.now()}`,
      tag: draftTag,
      authorId: CURRENT_USER_ID,
      createdAt,
      title: long ? `${text.slice(0, 80)}…` : text,
      body: long ? text : '',
      score: 0,
      replies: 0,
    };
    setPosts((p) => [post, ...p]);
    setNow(Date.parse(createdAt));
    setDraft('');
    setFilter('All');
  };

  return (
    <>
      <Card role="region" aria-label="New post" className="composer">
        <label htmlFor="new-post" className="composer__label">Start a post</label>
        <textarea id="new-post" rows={3} className="textarea" placeholder="What do you need help with, or who are you looking for?" value={draft} onChange={(e) => setDraft(e.target.value)} />
        <div className="composer__foot">
          <div className="pill-group" role="group" aria-label="Post tag">
            {TAGS.map((t) => {
              const on = draftTag === t;
              return (
                <button key={t} type="button" className="pill pill--small" aria-pressed={on} onClick={() => setDraftTag(t)}
                  style={on ? undefined : { background: tagColors[t].bg, color: tagColors[t].fg, borderColor: tagColors[t].bg }}>
                  {t}
                </button>
              );
            })}
          </div>
          <Button onClick={submit} disabled={!draft.trim()}>
            Post it
          </Button>
        </div>
      </Card>

      <FilterPills label="Filter by tag" options={FILTERS} value={filter} onChange={setFilter} />

      {visible.map((p) => {
        const author = getStudent(p.authorId);
        const event = p.eventId ? getEvent(p.eventId) : undefined;
        const isVoted = !!voted[p.id];
        const c = tagColors[p.tag];
        return (
          <article key={p.id} className="post">
            <Button variant="outline" className="vote" aria-pressed={isVoted} aria-label={`Upvote, ${p.score + (isVoted ? 1 : 0)} votes`} onClick={() => setVoted((v) => ({ ...v, [p.id]: !v[p.id] }))}>
              <ArrowUp />
              <span className="vote__count">{p.score + (isVoted ? 1 : 0)}</span>
            </Button>
            <div className="post__body">
              <div className="post__meta">
                <Tag className="chip" style={{ background: c.bg, color: c.fg }}>{p.tag}</Tag>
                {author && (
                  <span className="post__author">
                    <Avatar studentId={author.id} name={author.name} size="sm" />
                    <Link href={author.id === CURRENT_USER_ID ? '/profile' : `/students/${author.id}`}>{author.name}</Link>
                    · {timeAgo(p.createdAt, now)}
                  </span>
                )}
              </div>
              <h2 className="post__title">{p.title}</h2>
              {p.body && <p className="post__text">{p.body}</p>}
              <div className="post__foot">
                <span className="post__replies"><Bubble />{p.replies === 1 ? '1 reply' : `${p.replies} replies`}</span>
                {event && <Link href="/events" className="event-link">{event.title} →</Link>}
              </div>
            </div>
          </article>
        );
      })}
      {visible.length === 0 && <p className="empty">No posts with this tag yet. Start one above.</p>}
    </>
  );
}
