'use client';

import dynamic from 'next/dynamic';
import FallbackLogo from '@/components/ui/LiquidLogo';
import useInView from './useInView';
import useReducedMotion from './useReducedMotion';
import useShaderCapabilities from './useShaderCapabilities';

const LiquidMetalLayer = dynamic(() => import('./LiquidMetalLayer'), {
  ssr: false,
  loading: () => null,
});

type Props = {
  size?: number;
};

function StaticLogo({ size }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M12 8v18a12 12 0 0 0 24 0V8" stroke="var(--electric-blue)" strokeWidth="9" strokeLinecap="round" />
      <circle cx="36" cy="9" r="4" fill="var(--coral)" />
    </svg>
  );
}

export default function LiquidLogo({ size = 48 }: Props) {
  const { ref, isInView } = useInView<HTMLSpanElement>();
  const reducedMotion = useReducedMotion();
  const capabilities = useShaderCapabilities();
  const isActive = capabilities.ready
    && capabilities.supportsWebGL2
    && !capabilities.isSmallScreen
    && !reducedMotion
    && isInView;

  return (
    <span
      ref={ref}
      className="effects-liquid-logo"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {reducedMotion ? <StaticLogo size={size} /> : <FallbackLogo size={size} />}
      {isActive && <LiquidMetalLayer size={size} />}
    </span>
  );
}
