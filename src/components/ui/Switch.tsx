import * as RadixSwitch from '@radix-ui/react-switch';
import { cn } from '../../lib/utils';

interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
  className?: string;
}

export function Switch({ checked, onCheckedChange, disabled, label, id, className }: SwitchProps) {
  const switchId = id || label?.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <RadixSwitch.Root
        id={switchId}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'data-[state=checked]:bg-brand-500 data-[state=unchecked]:bg-gray-200'
        )}
      >
        <RadixSwitch.Thumb
          className={cn(
            'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg transition-transform',
            'data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0.5',
            'translate-y-0.5'
          )}
        />
      </RadixSwitch.Root>
      {label && (
        <label htmlFor={switchId} className="text-sm text-gray-700 cursor-pointer select-none">
          {label}
        </label>
      )}
    </div>
  );
}
