'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';
import useInView from './useInView';
import useReducedMotion from './useReducedMotion';
import useShaderCapabilities from './useShaderCapabilities';
import type { ShaderVariant } from './ShaderLayer';

const ShaderLayer = dynamic(() => import('./ShaderLayer'), {
  ssr: false,
  loading: () => null,
});

type Props = {
  children?: ReactNode;
  className?: string;
  variant?: ShaderVariant;
};

export default function ShaderBackground({
  children,
  className = '',
  variant = 'mesh',
}: Props) {
  const { ref, isInView } = useInView<HTMLDivElement>();
  const reducedMotion = useReducedMotion();
  const capabilities = useShaderCapabilities();
  const isActive = capabilities.ready
    && capabilities.supportsWebGL2
    && !capabilities.isSmallScreen
    && !reducedMotion
    && isInView;

  return (
    <div
      ref={ref}
      className={`shader-background shader-background--${variant} ${className}`.trim()}
      data-shader-active={isActive}
    >
      <div className="shader-background__paint" aria-hidden="true">
        {isActive && <ShaderLayer variant={variant} lowPower={capabilities.isLowPower} />}
      </div>
      {children && <div className="shader-background__content">{children}</div>}
    </div>
  );
}
