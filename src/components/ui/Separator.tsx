import * as RadixSeparator from '@radix-ui/react-separator';
import { cn } from '../../lib/utils';

interface SeparatorProps extends React.ComponentPropsWithoutRef<typeof RadixSeparator.Root> {
  orientation?: 'horizontal' | 'vertical';
}

export function Separator({ className, orientation = 'horizontal', ...props }: SeparatorProps) {
  return (
    <RadixSeparator.Root
      orientation={orientation}
      className={cn(
        'shrink-0 bg-gray-200',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className
      )}
      {...props}
    />
  );
}
