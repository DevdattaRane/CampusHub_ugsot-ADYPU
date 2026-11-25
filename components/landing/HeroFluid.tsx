'use client';

import dynamic from 'next/dynamic';
import type { PaperShaderElement } from '@paper-design/shaders-react';
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import useInView from '@/components/effects/useInView';
import useReducedMotion from '@/components/effects/useReducedMotion';
import useShaderCapabilities from '@/components/effects/useShaderCapabilities';
import { LANDING_CONFIG } from './landing.config';
import styles from './welcome.module.css';

const ShaderMount = dynamic(
  () => import('@paper-design/shaders-react').then((module) => module.ShaderMount),
  { ssr: false, loading: () => null },
);

const fluidShader = `#version 300 es
precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_pointer;

out vec4 fragColor;

void main() {
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 point = (uv - 0.5) * vec2(aspect, 1.0);
  vec2 cursor = (u_pointer - 0.5) * vec2(aspect, 1.0);
  float time = u_time * 0.28;
  float influence = 1.0 - smoothstep(0.0, 1.0, length(point - cursor));
  vec2 flow = point
    + vec2(sin(point.y * 8.0 + time), cos(point.x * 7.0 - time))
    * 0.018
    * influence;

  vec2 blueOffset = vec2(sin(time * 0.7), cos(time * 0.8)) * 0.055;
  vec2 coralOffset = vec2(cos(time * 0.6), sin(time * 0.9)) * 0.05;
  vec2 mintOffset = vec2(sin(time * 0.8), cos(time * 0.6)) * 0.045;
  vec2 blueDelta = flow - vec2(-0.24, 0.12) - blueOffset - cursor * 0.26;
  vec2 coralDelta = flow - vec2(0.28, 0.04) - coralOffset - cursor * 0.22;
  vec2 mintDelta = flow - vec2(-0.02, -0.3) - mintOffset - cursor * 0.18;

  float blue = 0.075 / (dot(blueDelta, blueDelta) + 0.028);
  float coral = 0.07 / (dot(coralDelta, coralDelta) + 0.026);
  float mint = 0.064 / (dot(mintDelta, mintDelta) + 0.025);
  float energy = blue + coral + mint;

  vec3 base = vec3(0.96, 0.95, 0.92);
  vec3 liquid = (
    blue * vec3(0.25, 0.36, 1.0)
    + coral * vec3(1.0, 0.44, 0.28)
    + mint * vec3(0.72, 0.9, 0.81)
  ) / max(energy, 0.0001);
  float blend = smoothstep(0.55, 1.55, energy) * 0.78;
  float highlight = exp(-length(flow - cursor) * 20.0) * 0.08;
  vec3 color = mix(base, liquid, blend);
  color = mix(color, vec3(1.0), highlight);

  fragColor = vec4(color, 1.0);
}`;

const initialUniforms = { u_pointer: [0.5, 0.5] };

export default function HeroFluid({ children }: { children: ReactNode }) {
  const { ref, isInView } = useInView<HTMLDivElement>();
  const shaderRef = useRef<PaperShaderElement | null>(null);
  const capabilities = useShaderCapabilities();
  const reducedMotion = useReducedMotion();
  const [hasFinePointer, setHasFinePointer] = useState(false);

  useEffect(() => {
    const pointer = window.matchMedia(
      `(min-width: ${LANDING_CONFIG.motion.mobileBreakpointPx + 1}px) and (pointer: fine)`,
    );
    const updatePointer = () => setHasFinePointer(pointer.matches);

    updatePointer();
    pointer.addEventListener('change', updatePointer);

    return () => pointer.removeEventListener('change', updatePointer);
  }, []);

  const isActive = capabilities.ready
    && capabilities.supportsWebGL2
    && !capabilities.isSmallScreen
    && !capabilities.isLowPower
    && hasFinePointer
    && !reducedMotion
    && isInView;

  const updatePointer = (event: PointerEvent<HTMLDivElement>) => {
    if (!isActive || event.pointerType === 'touch') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width === 0 || bounds.height === 0) return;

    const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
    shaderRef.current?.paperShaderMount?.setUniforms({ u_pointer: [x, 1 - y] });
  };

  const resetPointer = () => {
    shaderRef.current?.paperShaderMount?.setUniforms({ u_pointer: [0.5, 0.5] });
  };

  return (
    <div
      ref={ref}
      className={styles.heroVisual}
      data-fluid-active={isActive}
      onPointerMove={updatePointer}
      onPointerLeave={resetPointer}
    >
      {isActive && (
        <div className={styles.fluidLayer} aria-hidden="true">
          <ShaderMount
            ref={shaderRef}
            className={styles.fluidShader}
            fragmentShader={fluidShader}
            uniforms={initialUniforms}
            speed={0.18}
            minPixelRatio={0.75}
            maxPixelCount={640_000}
          />
        </div>
      )}
      {children}
    </div>
  );
}
