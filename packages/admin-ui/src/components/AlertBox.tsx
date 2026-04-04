import type { AlertBoxProps, AlertVariant } from '../types';

const colors: Record<AlertVariant, { background: string; border: string }> = {
  warning: { background: '#fff8e1', border: '#ffcc02' },
  info: { background: '#e8f0fe', border: '#4285f4' },
  success: { background: '#e6f4ea', border: '#34a853' },
  error: { background: '#fce8e6', border: '#ea4335' },
};

export function AlertBox({ variant, title, children }: AlertBoxProps) {
  const { background, border } = colors[variant];
  return (
    <div
      style={{
        background,
        border: `1px solid ${border}`,
        borderRadius: '4px',
        padding: '12px 16px',
        marginBottom: '16px',
      }}
    >
      <strong>{title}</strong>
      {children}
    </div>
  );
}
