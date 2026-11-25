'use client';

import { useEffect, useState } from 'react';

type ShaderCapabilities = {
  ready: boolean;
  supportsWebGL2: boolean;
  isSmallScreen: boolean;
  isLowPower: boolean;
};

const initialCapabilities: ShaderCapabilities = {
  ready: false,
  supportsWebGL2: false,
  isSmallScreen: true,
  isLowPower: true,
};

export default function useShaderCapabilities(): ShaderCapabilities {
  const [capabilities, setCapabilities] = useState(initialCapabilities);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2');
    const supportsWebGL2 = Boolean(context);
    context?.getExtension('WEBGL_lose_context')?.loseContext();

    const smallScreen = window.matchMedia('(max-width: 640px), (pointer: coarse)');
    const isLowPower = navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4;
    const updateCapabilities = () => {
      setCapabilities({
        ready: true,
        supportsWebGL2,
        isSmallScreen: smallScreen.matches,
        isLowPower,
      });
    };

    updateCapabilities();
    smallScreen.addEventListener('change', updateCapabilities);
    return () => smallScreen.removeEventListener('change', updateCapabilities);
  }, []);

  return capabilities;
}
