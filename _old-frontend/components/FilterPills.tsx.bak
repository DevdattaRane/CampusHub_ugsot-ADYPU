'use client';

type Props<T extends string> = {
  label?: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  small?: boolean;
};

export default function FilterPills<T extends string>({ label, options, value, onChange, small }: Props<T>) {
  return (
    <div className="pill-group" role="group" aria-label={label}>
      {label && <span className="pill-group__label">{label}</span>}
      {options.map((o) => (
        <button key={o} type="button" className={`pill${small ? ' pill--small' : ''}`} aria-pressed={o === value} onClick={() => onChange(o)}>
          {o}
        </button>
      ))}
    </div>
  );
}
