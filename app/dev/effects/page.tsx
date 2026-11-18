import EffectsPreview from '@/components/effects/EffectsPreview';

export const metadata = { title: 'Effects preview · CampusHub' };

export default function EffectsPreviewPage() {
  return (
    <main className="container page effects-preview">
      <p className="eyebrow">Effects preview</p>
      <h1>CampusHub effects</h1>
      <p className="mono">Use the controls to preview one WebGL effect at a time.</p>
      <EffectsPreview />
    </main>
  );
}
