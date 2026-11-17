import { todayISO } from './dates';

export type Suggestion = {
  id: string;
  title: string;
  description: string;
  author: string;
  createdAt: string;
  upvotes: number;
};

export type CreateSuggestionInput = {
  title: string;
  description: string;
  author?: string;
};

const SUGGESTIONS_KEY = 'campushub-suggestions-v1';
const UPVOTES_KEY = 'campushub-suggestion-upvotes-v1';
const SUGGESTIONS_EVENT = 'campushub-suggestions-changed';
const UPVOTES_EVENT = 'campushub-upvotes-changed';
const EMPTY_UPVOTED_IDS: string[] = [];

export const STARTER_SUGGESTIONS: Suggestion[] = [
  {
    id: 'starter-1',
    title: 'Campus project showcase wall',
    description: 'A dedicated page or board where teams can pin their active open-source hackathon builds and look for contributors across departments.',
    author: 'Aarav Sharma',
    createdAt: '2026-11-12',
    upvotes: 14,
  },
  {
    id: 'starter-2',
    title: 'Automated lab slot bookings',
    description: 'Real-time visibility into Innovation Lab and Studio workstation availability with one-tap reservations before hack weekends.',
    author: 'Riya Patil',
    createdAt: '2026-11-14',
    upvotes: 9,
  },
  {
    id: 'starter-3',
    title: 'Peer mock interview circles',
    description: 'Weekly peer-led technical and resume review sessions organized by senior students to practice DSA, open-source git workflows, and system design.',
    author: 'Anonymous',
    createdAt: '2026-11-16',
    upvotes: 18,
  },
];

// In-memory cache for SSR & client sync
let memorySuggestions: Suggestion[] = STARTER_SUGGESTIONS;
let lastRawSuggestions: string | null = null;

let memoryUpvotedIds: string[] = EMPTY_UPVOTED_IDS;
let lastRawUpvotes: string | null = null;

function safeLocalStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getSuggestions(): Suggestion[] {
  const storage = safeLocalStorage();
  if (!storage) return memorySuggestions;

  try {
    const raw = storage.getItem(SUGGESTIONS_KEY);
    if (!raw) {
      storage.setItem(SUGGESTIONS_KEY, JSON.stringify(STARTER_SUGGESTIONS));
      lastRawSuggestions = JSON.stringify(STARTER_SUGGESTIONS);
      memorySuggestions = STARTER_SUGGESTIONS;
      return memorySuggestions;
    }
    if (raw === lastRawSuggestions) {
      return memorySuggestions;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      lastRawSuggestions = raw;
      memorySuggestions = parsed;
      return memorySuggestions;
    }
    return STARTER_SUGGESTIONS;
  } catch {
    return memorySuggestions;
  }
}

export function getUpvotedIds(): string[] {
  const storage = safeLocalStorage();
  if (!storage) return memoryUpvotedIds;

  try {
    const raw = storage.getItem(UPVOTES_KEY);
    if (!raw) {
      lastRawUpvotes = null;
      memoryUpvotedIds = EMPTY_UPVOTED_IDS;
      return memoryUpvotedIds;
    }
    if (raw === lastRawUpvotes) {
      return memoryUpvotedIds;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      lastRawUpvotes = raw;
      memoryUpvotedIds = parsed;
      return memoryUpvotedIds;
    }
    memoryUpvotedIds = EMPTY_UPVOTED_IDS;
    return memoryUpvotedIds;
  } catch {
    return memoryUpvotedIds;
  }
}

export function subscribeSuggestions(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback();
  window.addEventListener(SUGGESTIONS_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(SUGGESTIONS_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

export function subscribeUpvotes(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback();
  window.addEventListener(UPVOTES_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(UPVOTES_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

export function createSuggestion(input: CreateSuggestionInput): Suggestion {
  const title = input.title.trim();
  const description = input.description.trim();
  const author = input.author?.trim() || 'Anonymous';

  const newSuggestion: Suggestion = {
    id: `sugg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    description,
    author,
    createdAt: todayISO(),
    upvotes: 0,
  };

  const current = getSuggestions();
  const updated = [newSuggestion, ...current];
  memorySuggestions = updated;

  const storage = safeLocalStorage();
  if (storage) {
    try {
      const serialized = JSON.stringify(updated);
      storage.setItem(SUGGESTIONS_KEY, serialized);
      lastRawSuggestions = serialized;
    } catch (e) {
      console.error('Unable to save suggestion to localStorage.', e);
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(SUGGESTIONS_EVENT));
  }

  return newSuggestion;
}

export function toggleUpvote(suggestionId: string): { upvoted: boolean; count: number } {
  const currentUpvotes = new Set(getUpvotedIds());
  const isUpvoted = currentUpvotes.has(suggestionId);
  const currentSuggestions = getSuggestions();

  let nextCount = 0;
  if (isUpvoted) {
    currentUpvotes.delete(suggestionId);
  } else {
    currentUpvotes.add(suggestionId);
  }

  const updatedSuggestions = currentSuggestions.map((item) => {
    if (item.id === suggestionId) {
      const delta = isUpvoted ? -1 : 1;
      const count = Math.max(0, item.upvotes + delta);
      nextCount = count;
      return { ...item, upvotes: count };
    }
    return item;
  });

  memorySuggestions = updatedSuggestions;
  memoryUpvotedIds = Array.from(currentUpvotes);

  const storage = safeLocalStorage();
  if (storage) {
    try {
      const serializedSugg = JSON.stringify(updatedSuggestions);
      const serializedUpvotes = JSON.stringify(memoryUpvotedIds);
      storage.setItem(SUGGESTIONS_KEY, serializedSugg);
      storage.setItem(UPVOTES_KEY, serializedUpvotes);
      lastRawSuggestions = serializedSugg;
      lastRawUpvotes = serializedUpvotes;
    } catch (e) {
      console.error('Unable to save upvotes to localStorage.', e);
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(SUGGESTIONS_EVENT));
    window.dispatchEvent(new Event(UPVOTES_EVENT));
  }

  return { upvoted: !isUpvoted, count: nextCount };
}
