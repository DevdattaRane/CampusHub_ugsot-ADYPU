import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
};

export default function Input({ id, label, className = '', ...props }: InputProps) {
  return (
    <label className="field" htmlFor={id}>
      <span className="field__label">{label}</span>
      <input id={id} className={`input ${className}`.trim()} {...props} />
    </label>
  );
}
