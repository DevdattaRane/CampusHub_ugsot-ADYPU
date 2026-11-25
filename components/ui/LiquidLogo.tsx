type Props = {
  size?: number;
};

export default function LiquidLogo({ size = 30 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M12 8v18a12 12 0 0 0 24 0V8" stroke="url(#lqg)" strokeWidth="9" strokeLinecap="round" filter="url(#lqf)" />
      <circle cx="36" cy="9" r="4" fill="#FF7048" />
    </svg>
  );
}
