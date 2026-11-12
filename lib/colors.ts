import type { EventType, PostTag } from './types';

const ink = 'var(--ink)';
const card = 'var(--card)';

export const typeColors: Record<EventType, { bg: string; fg: string }> = {
  Hackathon: { bg: 'var(--event-hackathon)', fg: ink },
  Workshop: { bg: 'var(--event-workshop)', fg: ink },
  Contest: { bg: 'var(--event-contest)', fg: ink },
  Meetup: { bg: 'var(--event-meetup)', fg: ink },
  Sprint: { bg: 'var(--event-sprint)', fg: ink },
  'Design jam': { bg: 'var(--event-design-jam)', fg: ink },
};

export const tagColors: Record<PostTag, { bg: string; fg: string }> = {
  'Need help': { bg: 'var(--highlight)', fg: ink },
  Ask: { bg: 'var(--highlight)', fg: ink },
  'Find teammate': { bg: 'var(--highlight)', fg: ink },
  Showcase: { bg: 'var(--highlight)', fg: ink },
};

export const pastel = [
  { bg: card, fg: ink },
];

export const weekdayStripe = Array(7).fill(ink);
