'use client';

import { GrainGradient, MeshGradient } from '@paper-design/shaders-react';
import type { CSSProperties } from 'react';

export type ShaderVariant = 'mesh' | 'grain';

type Props = {
  variant: ShaderVariant;
  lowPower: boolean;
};

const layerStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
};

export default function ShaderLayer({ variant, lowPower }: Props) {
  const quality = {
    maxPixelCount: lowPower ? 360_000 : 900_000,
    minPixelRatio: lowPower ? 0.75 : 1,
  };

  if (variant === 'grain') {
    return (
      <GrainGradient
        colorBack="#F5F3ED"
        colors={['#FF7048', '#F5F3ED']}
        softness={0.85}
        intensity={0.22}
        noise={0.12}
        shape="wave"
        speed={lowPower ? 0.08 : 0.14}
        style={layerStyle}
        {...quality}
      />
    );
  }

  return (
    <MeshGradient
      colors={['#F5F3ED', '#405CFF']}
      distortion={0.32}
      swirl={0.06}
      grainMixer={0}
      grainOverlay={0}
      speed={lowPower ? 0.08 : 0.14}
      style={layerStyle}
      {...quality}
    />
  );
}
