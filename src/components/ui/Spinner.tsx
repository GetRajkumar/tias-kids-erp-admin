import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return <Loader2 className={cn('animate-spin text-brand-500', sizeMap[size], className)} />;
}

export function LoadingPage() {
  return (
    <div className="flex h-96 items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
