import type { HTMLAttributes } from 'react';

export default function Box({ className = '', ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={`ui-box ${className}`.trim()} {...props} />;
}
