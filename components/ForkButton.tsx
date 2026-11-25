'use client';

import { useState } from 'react';
import Button from './ui/Button';

interface ForkButtonProps {
  targetUserId: string;
  targetName: string;
  initialIsForking?: boolean;
  initialDockersCount?: number;
  onCountChange?: (newCount: number, isForking: boolean) => void;
  size?: 'sm' | 'md';
}

export default function ForkButton({
  targetUserId,
  targetName,
  initialIsForking = false,
  initialDockersCount = 0,
  onCountChange,
  size = 'md',
}: ForkButtonProps) {
  const [isForking, setIsForking] = useState(initialIsForking);
  const [loading, setLoading] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;

    // Save previous state for rollback
    const prevForking = isForking;
    const nextForking = !prevForking;

    // Optimistic UI update
    setIsForking(nextForking);
    setRateLimitError(null);
    setLoading(true);

    const delta = nextForking ? 1 : -1;
    onCountChange?.(Math.max(0, initialDockersCount + delta), nextForking);

    try {
      const res = await fetch(`/api/students/${targetUserId}/fork`, {
        method: nextForking ? 'POST' : 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        // Rollback optimistic state
        setIsForking(prevForking);
        onCountChange?.(initialDockersCount, prevForking);

        const errorMsg = data.error || (res.status === 429 ? 'Slow down, try again in a minute.' : 'Failed to update Fork status');
        setRateLimitError(errorMsg);

        // Auto-clear error after 4 seconds
        setTimeout(() => setRateLimitError(null), 4000);
        return;
      }

      // Server confirmed live state
      setIsForking(Boolean(data.is_forking ?? data.isForking));
      if (typeof data.dockers_count === 'number' || typeof data.dockersCount === 'number') {
        const count = data.dockers_count ?? data.dockersCount;
        onCountChange?.(count, Boolean(data.is_forking ?? data.isForking));
      }
    } catch {
      // Network rollback
      setIsForking(prevForking);
      onCountChange?.(initialDockersCount, prevForking);
      setRateLimitError('Network error. Please try again.');
      setTimeout(() => setRateLimitError(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
      <Button
        type="button"
        variant={isForking ? 'outline' : 'primary'}
        onClick={handleToggle}
        disabled={loading}
        aria-busy={loading}
        aria-label={isForking ? `Unfork ${targetName}` : `Fork ${targetName}`}
        style={{
          minHeight: size === 'sm' ? 34 : 44,
          padding: size === 'sm' ? '0 12px' : '0 18px',
          fontSize: size === 'sm' ? 13 : 14,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontWeight: 800,
          opacity: loading ? 0.7 : 1,
        }}
      >
        <span>{isForking ? '⚓' : '🍴'}</span>
        <span>{loading ? 'Updating…' : isForking ? 'Docking' : 'Fork'}</span>
      </Button>

      {rateLimitError && (
        <span
          role="alert"
          style={{
            fontSize: 11,
            color: '#b91c1c',
            fontWeight: 700,
            background: '#fee2e2',
            padding: '2px 6px',
            borderRadius: 4,
            border: '1px solid #f87171',
            maxWidth: 220,
            lineHeight: 1.2,
          }}
        >
          {rateLimitError}
        </span>
      )}
    </div>
  );
}
