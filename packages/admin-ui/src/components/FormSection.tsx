import type { FormSectionProps } from '../types';

export function FormSection({ children, narrow = true }: FormSectionProps) {
  return (
    <div style={{ padding: '16px 0', ...(narrow ? { maxWidth: '600px' } : {}) }}>{children}</div>
  );
}
