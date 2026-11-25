import type { HTMLAttributes } from 'react';

export default function Tile({ className = '', ...props }: HTMLAttributes<HTMLElement>) {
  return <article className={`ui-tile ${className}`.trim()} {...props} />;
}
