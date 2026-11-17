import type { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'primary';
};

export default function Pill({ className = '', variant = 'default', ...props }: Props) {
  return <button className={`ui-pill ui-pill--${variant} ${className}`.trim()} {...props} />;
}
