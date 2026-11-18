'use client';

import { LiquidMetal } from '@paper-design/shaders-react';

const markSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M12 8v18a12 12 0 0 0 24 0V8" fill="none" stroke="#191B22" stroke-width="9" stroke-linecap="round"/></svg>';
const markImage = `data:image/svg+xml,${encodeURIComponent(markSvg)}`;

type Props = {
  size: number;
};

export default function LiquidMetalLayer({ size }: Props) {
  return (
    <LiquidMetal
      image={markImage}
      colorBack="#F5F3ED"
      colorTint="#191B22"
      contour={0.25}
      distortion={0.025}
      softness={0.24}
      repetition={1.6}
      shiftRed={0}
      shiftBlue={0}
      angle={70}
      shape="none"
      speed={0.12}
      width={size}
      height={size}
      maxPixelCount={260_000}
      minPixelRatio={0.75}
    />
  );
}
