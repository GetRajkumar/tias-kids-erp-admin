import * as RadixCheckbox from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({ checked, onCheckedChange, label, id, disabled, className }: CheckboxProps) {
  const checkId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <RadixCheckbox.Root
        id={checkId}
        checked={checked}
        onCheckedChange={(val) => onCheckedChange?.(val === true)}
        disabled={disabled}
        className={cn(
          'flex h-4 w-4 shrink-0 items-center justify-center rounded border border-gray-300 transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
          'data-[state=checked]:border-brand-500 data-[state=checked]:bg-brand-500',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        <RadixCheckbox.Indicator>
          <Check className="h-3 w-3 text-white" />
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      {label && (
        <label htmlFor={checkId} className="text-sm text-gray-700 cursor-pointer select-none">
          {label}
        </label>
      )}
    </div>
  );
}
