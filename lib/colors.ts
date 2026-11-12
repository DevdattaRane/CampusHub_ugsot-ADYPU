import type { EventType, PostTag } from './types';

const highlight = 'var(--highlight)';
const ink = 'var(--ink)';
const card = 'var(--card)';

export const typeColors: Record<EventType, { bg: string; fg: string; sticker: string }> = {
  Hackathon: { bg: highlight, fg: ink, sticker: highlight },
  Workshop: { bg: highlight, fg: ink, sticker: highlight },
  Contest: { bg: highlight, fg: ink, sticker: highlight },
  Meetup: { bg: highlight, fg: ink, sticker: highlight },
  Sprint: { bg: highlight, fg: ink, sticker: highlight },
  'Design jam': { bg: highlight, fg: ink, sticker: highlight },
};

export const tagColors: Record<PostTag, { bg: string; fg: string }> = {
  'Need help': { bg: highlight, fg: ink },
  Ask: { bg: highlight, fg: ink },
  'Find teammate': { bg: highlight, fg: ink },
  Showcase: { bg: highlight, fg: ink },
};

export const pastel = [
  { bg: card, fg: ink },
];

export const weekdayStripe = Array(7).fill(ink);

export const stickerTilt = ['-2deg', '1.5deg', '-1deg', '2deg'];
