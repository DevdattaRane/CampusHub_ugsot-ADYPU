import type { HTMLAttributes } from 'react';

type Props = HTMLAttributes<HTMLDivElement>;

export default function GlassPanel({ className = '', ...props }: Props) {
  return <div className={`glass-panel lg ${className}`.trim()} {...props} />;
}
