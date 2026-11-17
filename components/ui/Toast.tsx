type Props = {
  message: string;
  tone?: 'status' | 'error';
  onDismiss?: () => void;
};

export default function Toast({ message, tone = 'status', onDismiss }: Props) {
  return (
    <div className={`ui-toast ui-toast--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <span>{message}</span>
      {onDismiss && (
        <button type="button" aria-label="Dismiss notification" onClick={onDismiss}>×</button>
      )}
    </div>
  );
}
