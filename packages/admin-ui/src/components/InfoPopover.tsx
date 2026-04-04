import { Button, Popover } from '@wordpress/components';
import { useState } from '@wordpress/element';
import type { InfoPopoverProps } from '../types';

export function InfoPopover({ label, children, width = 480 }: InfoPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button
        icon="info-outline"
        label={label}
        onClick={() => setIsOpen(!isOpen)}
        size="small"
        style={{ verticalAlign: 'middle', marginLeft: '4px' }}
      />
      {isOpen && (
        <Popover onClose={() => setIsOpen(false)} placement="bottom-start">
          <div style={{ padding: '12px 16px', width: `${width}px`, fontSize: '13px' }}>
            {children}
          </div>
        </Popover>
      )}
    </>
  );
}
