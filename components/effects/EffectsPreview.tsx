'use client';

import { useState } from 'react';
import GlassPanel from './GlassPanel';
import LiquidLogo from './LiquidLogo';
import ShaderBackground from './ShaderBackground';

type PreviewMode = 'background' | 'logo';

export default function EffectsPreview() {
  const [mode, setMode] = useState<PreviewMode>('background');

  return (
    <div className="effects-preview__body">
      <div className="effects-preview__controls" role="group" aria-label="Choose an effect preview">
        <button
          type="button"
          className="pill r sm"
          aria-pressed={mode === 'background'}
          onClick={() => setMode('background')}
        >
          Shader background
        </button>
        <button
          type="button"
          className="pill r sm"
          aria-pressed={mode === 'logo'}
          onClick={() => setMode('logo')}
        >
          Liquid logo
        </button>
      </div>

      {mode === 'background' ? (
        <ShaderBackground variant="mesh" className="effects-preview__stage">
          <div className="effects-preview__content">
            <p className="mono">One shader · CSS glass panel</p>
            <GlassPanel className="effects-preview__panel">
              <span className="mono">GlassPanel</span>
              <h2>Clear, quiet, and readable.</h2>
              <p>Backdrop blur falls back to a solid canvas surface where unsupported.</p>
            </GlassPanel>
          </div>
        </ShaderBackground>
      ) : (
        <div className="effects-preview__stage effects-preview__logo-stage">
          <LiquidLogo size={128} />
          <GlassPanel className="effects-preview__panel">
            <span className="mono">LiquidLogo</span>
            <h2>Liquid metal U mark</h2>
            <p>The SVG fallback stays in place for reduced motion, mobile, or missing WebGL 2.</p>
          </GlassPanel>
        </div>
      )}
    </div>
  );
}
