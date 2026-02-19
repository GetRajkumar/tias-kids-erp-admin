import * as RadixProgress from '@radix-ui/react-progress';
import { cn } from '../../lib/utils';

interface ProgressProps {
  value: number;
  color?: 'brand' | 'green' | 'blue' | 'orange' | 'red';
  className?: string;
  size?: 'sm' | 'md';
}

const colorMap = {
  brand: 'bg-brand-500',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
};

export function Progress({ value, color = 'brand', className, size = 'sm' }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <RadixProgress.Root
      value={clamped}
      className={cn(
        'relative overflow-hidden rounded-full bg-gray-100 w-full',
        size === 'sm' ? 'h-1.5' : 'h-2.5',
        className
      )}
    >
      <RadixProgress.Indicator
        className={cn('h-full transition-all duration-300 ease-out', colorMap[color])}
        style={{ transform: `translateX(-${100 - clamped}%)` }}
      />
    </RadixProgress.Root>
  );
}
