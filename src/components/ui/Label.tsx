import * as RadixLabel from '@radix-ui/react-label';
import { cn } from '../../lib/utils';

interface LabelProps extends React.ComponentPropsWithoutRef<typeof RadixLabel.Root> {
  required?: boolean;
}

export function Label({ children, className, required, ...props }: LabelProps) {
  return (
    <RadixLabel.Root
      className={cn('block text-sm font-medium text-gray-700', className)}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </RadixLabel.Root>
  );
}
